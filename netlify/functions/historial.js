// GET /.netlify/functions/historial -> estadísticas del asistente + últimas consultas
const { getSheets, json, leerLibros, leerHistorial } = require("./_lib/comun");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Método no permitido" });
  try {
    const sheets = getSheets();
    const [historial, libros] = await Promise.all([leerHistorial(sheets), leerLibros(sheets)]);
    return json(200, {
      estadisticas: {
        consultas: historial.length,
        libros: libros.length,
        disponibles: libros.filter((l) => l.ejemplares > 0).length,
        categorias: new Set(libros.map((l) => l.categoria)).size,
      },
      recientes: historial.slice(-5).reverse(),
    });
  } catch (e) {
    console.error("historial:", e.message);
    return json(502, { error: "No fue posible consultar el servicio Cloud." });
  }
};
