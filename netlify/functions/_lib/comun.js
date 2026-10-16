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

// Netlify corta la función a los 10 s: solo se reintenta si queda tiempo suficiente.
const LIMITE_REINTENTO_MS = 4500;
const INTENTOS_POR_MODELO = 2;

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

function errorGemini(tipo, mensaje) {
  const e = new Error(mensaje);
  e.tipo = tipo;
  return e;
}

async function preguntarGemini({ instruccion, pregunta }) {
  if (!process.env.GEMINI_API_KEY) throw errorGemini("clave", "Falta la variable GEMINI_API_KEY");
  const inicio = Date.now();
  let llamadas = 0;
  let ultimo = null;

  for (const modelo of modelos()) {
    for (let intento = 1; intento <= INTENTOS_POR_MODELO; intento++) {
      const transcurrido = Date.now() - inicio;
      if (llamadas > 0 && transcurrido >= LIMITE_REINTENTO_MS) {
        throw ultimo || errorGemini("ocupado", "Se agotó el tiempo para consultar Gemini");
      }
      llamadas++;

      let r;
      try {
        r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: instruccion }] },
              contents: [{ role: "user", parts: [{ text: pregunta }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
            }),
            signal: AbortSignal.timeout(Math.max(1500, 6800 - transcurrido)),
          }
        );
      } catch (e) {
        // Error de red o timeout
        ultimo = errorGemini("ocupado", `Gemini (${modelo}) sin respuesta: ${e.message}`);
        await esperar(700);
        continue;
      }

      if (r.status === 404) {
        ultimo = errorGemini("modelo", `Modelo ${modelo} no disponible`);
        break; // siguiente modelo
      }

      if (r.status === 429 || r.status >= 500) {
        const detalle = (await r.text()).slice(0, 200);
        ultimo = errorGemini(r.status === 429 ? "limite" : "ocupado", `Gemini (${modelo}) respondió ${r.status}: ${detalle}`);
        if (intento === 1) await esperar(r.status === 429 ? 1500 : 800);
        continue;
      }

      if (!r.ok) {
        const detalle = (await r.text()).slice(0, 200);
        const tipo = [400, 401, 403].includes(r.status) ? "clave" : "http";
        throw errorGemini(tipo, `Gemini (${modelo}) respondió ${r.status}: ${detalle}`);
      }

      const data = await r.json();
      const texto = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      if (!texto) {
        ultimo = errorGemini("vacio", `Gemini (${modelo}) no devolvió texto`);
        continue;
      }
      return { texto, modelo };
    }
  }
  throw ultimo || errorGemini("ocupado", "No se pudo consultar Gemini");
}

module.exports = { getSheets, json, leerLibros, leerHistorial, guardarHistorial, preguntarGemini };
