import { useEffect, useRef, useState } from "react";

const API = "/.netlify/functions";

const SUGERENCIAS = [
  "Recomiéndame un libro de fantasía",
  "¿Qué libro tiene más ejemplares?",
  "¿Qué libros están agotados?",
];

const BIENVENIDA = {
  rol: "asistente",
  texto: "¡Hola! Soy tu asistente de libros. Pregúntame por recomendaciones, autores o disponibilidad del catálogo.",
};

/* Icono: libro abierto con destellos de cuatro puntas */
const Estrella = ({ cx, cy, r }) => (
  <path
    transform={`translate(${cx} ${cy}) scale(${r})`}
    d="M0 -1 L0.24 -0.24 L1 0 L0.24 0.24 L0 1 L-0.24 0.24 L-1 0 L-0.24 -0.24 Z"
    fill="currentColor"
  />
);
function IconoAsistente({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ color: "#fff" }}>
      <path d="M4 14.5c3.4-1.4 7.6-1.1 11 1.2v10.6c-3.4-2.2-7.6-2.5-11-1.1z" fill="currentColor" />
      <path d="M28 14.5c-3.4-1.4-7.6-1.1-11 1.2v10.6c3.4-2.2 7.6-2.5 11-1.1z" fill="currentColor" opacity="0.88" />
      <Estrella cx={16} cy={7.2} r={5} />
      <Estrella cx={25.4} cy={7.6} r={2.6} />
      <Estrella cx={7} cy={9.2} r={2} />
    </svg>
  );
}

// Convierte **negritas** y viñetas de la respuesta en elementos React.
function Texto({ texto }) {
  const negritas = (t) =>
    t
      .split(/(\*\*[^*]+\*\*)/g)
      .map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
  return texto
    .split("\n")
    .filter((l) => l.trim())
    .map((l, i) => {
      const m = l.match(/^\s*[-*•]\s+(.*)/);
      return m ? (
        <p className="chat-vineta" key={i}>{negritas(m[1])}</p>
      ) : (
        <p key={i}>{negritas(l)}</p>
      );
    });
}

async function enviar(pregunta, conversacion) {
  let r;
  try {
    r = await fetch(`${API}/asistente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta, conversacion }),
    });
  } catch {
    throw new Error("No fue posible consultar el servicio Cloud. Revisa tu conexión.");
  }
  let datos = {};
  try {
    datos = await r.json();
  } catch {
    /* sin JSON */
  }
  if (!r.ok || !datos.respuesta) {
    throw new Error(datos.error || "El asistente no pudo procesar la solicitud.");
  }
  return datos.respuesta;
}

export default function Chatbot() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState("");
  const fin = useRef(null);
  const campo = useRef(null);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, cargando, abierto]);

  useEffect(() => {
    if (abierto) campo.current?.focus();
  }, [abierto]);

  useEffect(() => {
    const alPresionar = (e) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  const mandar = async (e, directo) => {
    e?.preventDefault();
    const q = (directo ?? texto).trim();
    if (cargando) return;
    if (!q) return setAviso("Escribe una pregunta antes de continuar.");
    setAviso("");
    setTexto("");
    // Contexto: los últimos mensajes reales (sin la bienvenida ni errores)
    const previa = mensajes.filter((m) => m !== BIENVENIDA && !m.error).slice(-6);
    setMensajes((m) => [...m, { rol: "usuario", texto: q }]);
    setCargando(true);
    try {
      const respuesta = await enviar(q, previa);
      setMensajes((m) => [...m, { rol: "asistente", texto: respuesta }]);
    } catch (err) {
      setMensajes((m) => [...m, { rol: "asistente", texto: err.message, error: true }]);
    }
    setCargando(false);
  };

  const soloBienvenida = mensajes.length === 1;

  return (
    <>
      {abierto && (
        <section className="chat" role="dialog" aria-label="Asistente IA de libros">
          <header className="chat-cab">
            <span className="chat-avatar"><IconoAsistente size={24} /></span>
            <div>
              <strong>Asistente IA</strong>
              <small>Responde con el catálogo de libros</small>
            </div>
            <button className="chat-cerrar" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div className="chat-msgs" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={`burbuja ${m.rol} ${m.error ? "error" : ""}`}>
                <Texto texto={m.texto} />
              </div>
            ))}
            {soloBienvenida && !cargando && (
              <div className="chat-sug">
                {SUGERENCIAS.map((s) => (
                  <button key={s} onClick={() => mandar(null, s)}>{s}</button>
                ))}
              </div>
            )}
            {cargando && (
              <div className="burbuja asistente escribiendo">
                <span /><span /><span />
                <em>Analizando información…</em>
              </div>
            )}
            <div ref={fin} />
          </div>

          {aviso && <p className="chat-aviso" role="alert">{aviso}</p>}
          <form className="chat-form" onSubmit={mandar}>
            <input
              ref={campo}
              value={texto}
              maxLength={500}
              placeholder="Escribe tu pregunta…"
              onChange={(e) => {
                setTexto(e.target.value);
                if (aviso) setAviso("");
              }}
            />
            <button type="submit" disabled={cargando} aria-label="Enviar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </section>
      )}

      <div className="fab-zona">
        {!abierto && <span className="fab-tip">Asistente IA</span>}
        <button
          className={`fab ${abierto ? "abierto" : ""}`}
          onClick={() => setAbierto(!abierto)}
          aria-label={abierto ? "Cerrar asistente IA" : "Abrir asistente IA"}
          aria-expanded={abierto}
        >
          <IconoAsistente size={36} />
        </button>
      </div>
    </>
  );
}
