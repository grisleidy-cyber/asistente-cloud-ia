const { google } = require("googleapis");

const SHEET_ID = process.env.SHEET_ID;
const TAB = "Libros";

function getSheets() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Columnas: ID | Titulo | Autor | Categoria | Anio | Ejemplares | Descripcion | Fecha | Imagen
const toObj = (r) => ({
  id: Number(r[0]),
  titulo: r[1] || "",
  autor: r[2] || "",
  categoria: r[3] || "",
  anio: Number(r[4]) || 0,
  ejemplares: Number(r[5]) || 0,
  descripcion: r[6] || "",
  fecha: r[7] || "",
  imagen: r[8] || "",
});

function validar(d) {
  if (!d.titulo || !String(d.titulo).trim()) return "El título es obligatorio";
  if (!d.autor || !String(d.autor).trim()) return "El autor es obligatorio";
  if (!d.categoria || !String(d.categoria).trim()) return "La categoría es obligatoria";
  const anio = Number(d.anio);
  if (d.anio === "" || isNaN(anio) || anio < 1000 || anio > new Date().getFullYear() + 1)
    return "Año inválido";
  if (d.ejemplares === "" || isNaN(Number(d.ejemplares)) || Number(d.ejemplares) < 0)
    return "Número de ejemplares inválido";
  const imagen = String(d.imagen || "").trim();
  if (imagen && !/^https?:\/\//i.test(imagen))
    return "La URL de la imagen debe empezar con http:// o https://";
  return null;
}

exports.handler = async (event) => {
  try {
    const sheets = getSheets();
    const method = event.httpMethod;
    const last = event.path.split("/").pop();
    const id = /^\d+$/.test(last) ? Number(last) : null;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A2:I`,
    });
    const rows = res.data.values || [];

    // READ
    if (method === "GET") {
      return json(200, rows.map(toObj));
    }

    // CREATE
    if (method === "POST") {
      const d = JSON.parse(event.body || "{}");
      const error = validar(d);
      if (error) return json(400, { error });

      const newId = rows.reduce((m, r) => Math.max(m, Number(r[0]) || 0), 0) + 1;
      const fecha = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A:I`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              newId,
              d.titulo.trim(),
              d.autor.trim(),
              d.categoria.trim(),
              Number(d.anio),
              Number(d.ejemplares),
              String(d.descripcion || "").trim(),
              fecha,
              String(d.imagen || "").trim(),
            ],
          ],
        },
      });
      return json(201, { mensaje: "Libro creado", id: newId });
    }

    // UPDATE y DELETE necesitan un ID
    if (id === null) return json(400, { error: "Falta el ID en la ruta" });
    const idx = rows.findIndex((r) => Number(r[0]) === id);
    if (idx === -1) return json(404, { error: "Libro no encontrado" });

    // UPDATE
    if (method === "PUT") {
      const d = JSON.parse(event.body || "{}");
      const error = validar(d);
      if (error) return json(400, { error });

      const fila = idx + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${TAB}!A${fila}:I${fila}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [
            [
              id,
              d.titulo.trim(),
              d.autor.trim(),
              d.categoria.trim(),
              Number(d.anio),
              Number(d.ejemplares),
              String(d.descripcion || "").trim(),
              rows[idx][7] || "",
              String(d.imagen || "").trim(),
            ],
          ],
        },
      });
      return json(200, { mensaje: "Libro actualizado" });
    }

    // DELETE
    if (method === "DELETE") {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const hoja = meta.data.sheets.find((s) => s.properties.title === TAB);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: hoja.properties.sheetId,
                  dimension: "ROWS",
                  startIndex: idx + 1,
                  endIndex: idx + 2,
                },
              },
            },
          ],
        },
      });
      return json(200, { mensaje: "Libro eliminado" });
    }

    return json(405, { error: "Método no permitido" });
  } catch (err) {
    console.error(err);
    return json(500, { error: "Error del servidor", detalle: err.message });
  }
};
