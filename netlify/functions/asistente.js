// POST /.netlify/functions/asistente
// Flujo: pregunta -> Google Sheets (catálogo) -> prompt estructurado -> Gemini -> respuesta
const { getSheets, json, leerLibros, guardarHistorial, preguntarGemini } = require("./_lib/comun");

const INSTRUCCION = `Eres un asistente de biblioteca especializado en recomendar libros.

Reglas:
- Utiliza SOLAMENTE la información del CATALOGO que recibirás.
- No inventes libros, autores, años ni datos que no estén en el catálogo.
- Si ningún libro cumple con lo que pide el usuario, dilo claramente y sugiere la opción más cercana del catálogo.
- Si un libro tiene 0 ejemplares, menciona que está agotado por ahora.
- Si la pregunta no tiene relación con libros o con el catálogo, responde que solo puedes ayudar con el catálogo de la biblioteca.
- Responde en español, de forma breve (máximo 120 palabras) y explica en una frase por qué recomiendas cada libro.`;

const textoCatalogo = (libros) =>
  libros
    .map(
      (l) =>
        `- [ID ${l.id}] "${l.titulo}" de ${l.autor} | Categoría: ${l.categoria} | Año: ${l.anio} | Ejemplares: ${l.ejemplares}${
          l.descripcion ? ` | Descripción: ${l.descripcion}` : ""
        }`
    )
    .join("\n");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  let cuerpo;
  try {
    cuerpo = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "La solicitud no es un JSON válido." });
  }

  const pregunta = String(cuerpo.pregunta || "").trim();
  const categoria = String(cuerpo.categoria || "").trim();
  const necesidad = String(cuerpo.necesidad || "").trim();
  const soloDisponibles = Boolean(cuerpo.soloDisponibles);
  const previa = (Array.isArray(cuerpo.conversacion) ? cuerpo.conversacion : [])
    .slice(-6)
    .map((m) => `${m.rol === "usuario" ? "Usuario" : "Asistente"}: ${String(m.texto || "").slice(0, 400)}`)
    .join("\n");

  if (!pregunta) return json(400, { error: "Escribe una pregunta antes de continuar." });
  if (pregunta.length > 500) return json(400, { error: "La pregunta es demasiado larga (máximo 500 caracteres)." });

  // 1) Google Sheets
  const sheets = getSheets();
  let libros;
  try {
    libros = await leerLibros(sheets);
  } catch (e) {
    console.error("sheets:", e.message);
    return json(502, { error: "No fue posible consultar el servicio Cloud." });
  }

  // 2) Filtros del formulario
  let candidatos = libros;
  if (categoria) candidatos = candidatos.filter((l) => l.categoria.toLowerCase() === categoria.toLowerCase());
  if (soloDisponibles) candidatos = candidatos.filter((l) => l.ejemplares > 0);
  if (candidatos.length === 0) {
    return json(200, {
      respuesta:
        "No encontré libros en el catálogo con esos filtros. Prueba con otra categoría o quita el filtro de disponibilidad.",
      librosConsultados: 0,
      guardado: false,
    });
  }

  // 3) Prompt estructurado
  const prompt = [
    `CATALOGO:\n${textoCatalogo(candidatos)}`,
    categoria && `FILTRO DE CATEGORIA: ${categoria}`,
    necesidad && `NECESIDAD DEL LECTOR: ${necesidad}`,
    soloDisponibles && "SOLO LIBROS DISPONIBLES: sí",
    previa && `CONVERSACION PREVIA (solo como contexto):\n${previa}`,
    `PREGUNTA DEL USUARIO:\n${pregunta}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  // 4) Gemini
  let resultado;
  try {
    resultado = await preguntarGemini({ instruccion: INSTRUCCION, pregunta: prompt });
  } catch (e) {
    console.error("gemini:", e.message);
    return json(502, { error: "El asistente no pudo procesar la solicitud." });
  }

  // 5) Historial (si falla, la respuesta igual se entrega)
  let guardado = true;
  try {
    const filtros = [categoria && `Categoría: ${categoria}`, necesidad && `Necesidad: ${necesidad}`, soloDisponibles && "Solo disponibles"]
      .filter(Boolean)
      .join(" | ");
    await guardarHistorial(sheets, { pregunta, respuesta: resultado.texto, filtros });
  } catch (e) {
    guardado = false;
    console.error("historial:", e.message);
  }

  return json(200, {
    respuesta: resultado.texto,
    modelo: resultado.modelo,
    librosConsultados: candidatos.length,
    guardado,
  });
};
