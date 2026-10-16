// Utilidades compartidas por las funciones del asistente.
const { google } = require("googleapis");

const SHEET_ID = process.env.SHEET_ID;
const TAB_LIBROS = "Libros";
const TAB_HISTORIAL = "Historial";

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
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

// Hoja "Libros": ID | Titulo | Autor | Categoria | Anio | Ejemplares | Descripcion | Fecha
async function leerLibros(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_LIBROS}!A2:H`,
  });
  return (res.data.values || [])
    .filter((r) => r[1])
    .map((r) => ({
      id: Number(r[0]),
      titulo: r[1] || "",
      autor: r[2] || "",
      categoria: r[3] || "",
      anio: Number(r[4]) || 0,
      ejemplares: Number(r[5]) || 0,
      descripcion: r[6] || "",
    }));
}

// Crea la pestaña "Historial" (con encabezados) si todavía no existe.
async function asegurarHistorial(sheets) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existe = meta.data.sheets.some((s) => s.properties.title === TAB_HISTORIAL);
  if (existe) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: TAB_HISTORIAL } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB_HISTORIAL}!A1:D1`,
    valueInputOption: "RAW",
    requestBody: { values: [["Fecha", "Pregunta", "Respuesta", "Filtros"]] },
  });
}

// Hoja "Historial": Fecha | Pregunta | Respuesta | Filtros
async function leerHistorial(sheets) {
  await asegurarHistorial(sheets);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_HISTORIAL}!A2:D`,
  });
  return (res.data.values || []).map((r) => ({
    fecha: r[0] || "",
    pregunta: r[1] || "",
    respuesta: r[2] || "",
    filtros: r[3] || "",
  }));
}

async function guardarHistorial(sheets, { pregunta, respuesta, filtros }) {
  await asegurarHistorial(sheets);
  const fecha = new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB_HISTORIAL}!A:D`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[fecha, pregunta, respuesta.slice(0, 1500), filtros || ""]] },
  });
}

// ---------- Gemini (Google AI Studio) ----------
function modelos() {
  const lista = [process.env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
  return [...new Set(lista.filter(Boolean))];
}

async function preguntarGemini({ instruccion, pregunta }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Falta la variable GEMINI_API_KEY");
  let ultimo = "";
  for (const modelo of modelos()) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruccion }] },
          contents: [{ role: "user", parts: [{ text: pregunta }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
        }),
      }
    );
    if (r.status === 404) {
      ultimo = `Modelo ${modelo} no disponible`;
      continue;
    }
    if (!r.ok) throw new Error(`Gemini respondió ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = await r.json();
    const texto = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    if (!texto) throw new Error("Gemini no devolvió texto");
    return { texto, modelo };
  }
  throw new Error(ultimo || "No se pudo consultar Gemini");
}

module.exports = { getSheets, json, leerLibros, leerHistorial, guardarHistorial, preguntarGemini };
