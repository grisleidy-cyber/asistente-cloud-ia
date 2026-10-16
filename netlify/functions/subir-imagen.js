// Sube una portada a ImgBB y devuelve su URL pública.
// La API key vive solo en el servidor (variable de entorno IMGBB_API_KEY).
const MAX_BASE64 = 4_000_000;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Método no permitido" });

  if (!process.env.IMGBB_API_KEY) {
    return json(500, { error: "Falta configurar la variable IMGBB_API_KEY en el servidor" });
  }

  let cuerpo;
  try {
    cuerpo = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "La solicitud no es un JSON válido" });
  }

  const imagen = typeof cuerpo.imagen === "string" ? cuerpo.imagen.trim() : "";
  if (!imagen) return json(400, { error: "No se recibió ninguna imagen" });
  if (imagen.length > MAX_BASE64) {
    return json(413, { error: "La imagen es demasiado grande (máximo 4 MB en base64)" });
  }

  try {
    const fd = new FormData();
    fd.append("image", imagen);
    const r = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      { method: "POST", body: fd }
    );
    const data = await r.json().catch(() => null);
    if (!r.ok || !data?.data?.url) {
      console.error("imgbb:", r.status, data?.error?.message);
      return json(502, { error: "El servicio de imágenes no pudo procesar la portada" });
    }
    return json(200, { url: data.data.url });
  } catch (err) {
    console.error(err);
    return json(500, { error: "Error del servidor al subir la imagen", detalle: err.message });
  }
};
