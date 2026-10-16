import { useEffect, useRef, useState } from "react";
import "./App.css";
import Chatbot from "./Chatbot.jsx";

const API = "/.netlify/functions/libros";
const API_IMAGEN = "/.netlify/functions/subir-imagen";
const USUARIO = "admin";
const PASSWORD = "12345";
const vacio = { titulo: "", autor: "", categoria: "", anio: "", ejemplares: "", descripcion: "", imagen: "" };

/* ---------- Iconos (SVG) ---------- */
const Icono = ({ children, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const IBook = (p) => (
  <Icono {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Icono>
);
const ILock = (p) => (
  <Icono {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icono>
);
const IPlus = (p) => (
  <Icono {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
);
const ILayers = (p) => (
  <Icono {...p}>
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </Icono>
);
const ITag = (p) => (
  <Icono {...p}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7" cy="7" r="1.5" />
  </Icono>
);
const IAlert = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </Icono>
);
const IGear = (p) => (
  <Icono {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Icono>
);
const IEdit = (p) => (
  <Icono {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </Icono>
);
const ITrash = (p) => (
  <Icono {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="m19 6-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </Icono>
);
const IDownload = (p) => (
  <Icono {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Icono>
);
const ISearch = (p) => (
  <Icono {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icono>
);
const IClose = (p) => (
  <Icono {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icono>
);
const IGrid = (p) => (
  <Icono {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icono>
);
const IList = (p) => (
  <Icono {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </Icono>
);
const IUpload = (p) => (
  <Icono {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m17 8-5-5-5 5" />
    <path d="M12 3v12" />
  </Icono>
);

/* ---------- Reduce una imagen a `max` px y la devuelve como JPEG base64 (sin prefijo) ---------- */
function reducirImagen(archivo, max = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // fondo blanco para PNG con transparencia
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

/* ---------- Portada con respaldo si no hay imagen o falla la carga ---------- */
function Portada({ src, titulo }) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => setFallo(false), [src]);

  if (!src || fallo) {
    return (
      <div className="portada-vacia">
        <IBook size={30} />
        <span>{titulo}</span>
      </div>
    );
  }
  return (
    <img
      className="portada-img"
      src={src}
      alt={`Portada de ${titulo}`}
      loading="lazy"
      onError={() => setFallo(true)}
    />
  );
}

/* ---------- Número que cuenta hacia arriba ---------- */
function Contador({ valor }) {
  const [n, setN] = useState(0);
  const previo = useRef(0);

  useEffect(() => {
    const desde = previo.current;
    const inicio = performance.now();
    const duracion = 700;
    let raf;
    const paso = (t) => {
      const p = Math.min((t - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - p, 3);
      setN(Math.round(desde + (valor - desde) * suave));
      if (p < 1) raf = requestAnimationFrame(paso);
      else previo.current = valor;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);

  return <>{n}</>;
}

export default function App() {
  const [logueado, setLogueado] = useState(
    sessionStorage.getItem("login") === "ok"
  );
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [errorLogin, setErrorLogin] = useState("");
  const [intentos, setIntentos] = useState(0);

  const [libros, setLibros] = useState([]);
  const [form, setForm] = useState(vacio);
  const [editId, setEditId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState("");
  const [orden, setOrden] = useState("id");
  const [mensaje, setMensaje] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [menu, setMenu] = useState(null); // { libro, top, bottom, right }
  const [vista, setVista] = useState("tarjetas"); // "tarjetas" | "tabla"
  const [subiendo, setSubiendo] = useState(false);

  const avisar = (texto, tipo = "ok") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3000);
  };

  // ---------- LOGIN ----------
  const iniciarSesion = (e) => {
    e.preventDefault();
    if (user === USUARIO && pass === PASSWORD) {
      sessionStorage.setItem("login", "ok");
      setLogueado(true);
      setErrorLogin("");
    } else {
      setErrorLogin("Usuario o contraseña incorrectos");
      setIntentos((n) => n + 1);
    }
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("login");
    setLogueado(false);
    setUser("");
    setPass("");
  };

  // ---------- READ ----------
  const cargar = async () => {
    setCargando(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLibros(data);
    } catch (err) {
      avisar("Error al cargar: " + err.message, "error");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (logueado) cargar();
  }, [logueado]);

  // ---------- Cerrar menú / ventanas con clic fuera o Escape ----------
  useEffect(() => {
    if (!menu) return;
    const cerrarSiFuera = (e) => {
      if (!e.target.closest(".menu-flotante") && !e.target.closest(".engrane")) {
        setMenu(null);
      }
    };
    const cerrar = () => setMenu(null);
    document.addEventListener("mousedown", cerrarSiFuera);
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrarSiFuera);
      window.removeEventListener("scroll", cerrar, true);
      window.removeEventListener("resize", cerrar);
    };
  }, [menu]);

  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") {
        setMenu(null);
        setAEliminar(null);
        setMostrarForm(false);
        setEditId(null);
        setForm(vacio);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  // ---------- FORMULARIO (ventana emergente) ----------
  const abrirNuevo = () => {
    setEditId(null);
    setForm(vacio);
    setMostrarForm(true);
  };

  const cerrarForm = () => {
    setMostrarForm(false);
    setEditId(null);
    setForm(vacio);
  };

  const editar = (l) => {
    setMenu(null);
    setEditId(l.id);
    setForm({
      titulo: l.titulo,
      autor: l.autor,
      categoria: l.categoria,
      anio: l.anio,
      ejemplares: l.ejemplares,
      descripcion: l.descripcion || "",
      imagen: l.imagen || "",
    });
    setMostrarForm(true);
  };

  // ---------- SUBIR PORTADA ----------
  const subirPortada = async (e) => {
    const archivo = e.target.files[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      return avisar("El archivo debe ser una imagen", "error");
    }
    setSubiendo(true);
    try {
      const imagen = await reducirImagen(archivo);
      const res = await fetch(API_IMAGEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, imagen: data.url }));
    } catch (err) {
      avisar("Error al subir la imagen: " + err.message, "error");
    }
    setSubiendo(false);
  };

  // ---------- CREATE / UPDATE ----------
  const guardar = async (e) => {
    e.preventDefault();
    if (subiendo) return avisar("Espera a que termine de subir la imagen", "error");
    if (
      !form.titulo.trim() ||
      !form.autor.trim() ||
      !form.categoria.trim() ||
      form.anio === "" ||
      form.ejemplares === ""
    ) {
      return avisar("Completa todos los campos", "error");
    }
    if (Number(form.ejemplares) < 0) {
      return avisar("Los ejemplares no pueden ser negativos", "error");
    }
    try {
      const res = await fetch(editId ? `${API}/${editId}` : API, {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      avisar(editId ? "Libro actualizado" : "Libro agregado");
      cerrarForm();
      cargar();
    } catch (err) {
      avisar(err.message, "error");
    }
  };

  // ---------- DELETE ----------
  const pedirEliminar = (l) => {
    setMenu(null);
    setAEliminar(l);
  };

  const confirmarEliminar = async () => {
    const id = aEliminar.id;
    setAEliminar(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      avisar("Libro eliminado");
      cargar();
    } catch (err) {
      avisar(err.message, "error");
    }
  };

  // ---------- MENÚ DEL ENGRANE ----------
  const abrirMenu = (e, libro) => {
    if (menu && menu.libro.id === libro.id) return setMenu(null);
    const r = e.currentTarget.getBoundingClientRect();
    const abajo = r.bottom + 110 > window.innerHeight;
    setMenu({
      libro,
      right: window.innerWidth - r.right,
      top: abajo ? null : r.bottom + 6,
      bottom: abajo ? window.innerHeight - r.top + 6 : null,
    });
  };

  // ---------- BÚSQUEDA + FILTRO ----------
  const categorias = [...new Set(libros.map((l) => l.categoria))].sort();
  const filtrados = libros.filter((l) => {
    const q = busqueda.toLowerCase();
    const coincide =
      l.titulo.toLowerCase().includes(q) || l.autor.toLowerCase().includes(q);
    const cat = !filtroCat || l.categoria === filtroCat;
    return coincide && cat;
  });

  // ---------- ORDENAMIENTO ----------
  const ordenados = [...filtrados].sort((a, b) => {
    switch (orden) {
      case "titulo-asc":
        return a.titulo.localeCompare(b.titulo, "es");
      case "titulo-desc":
        return b.titulo.localeCompare(a.titulo, "es");
      case "autor-asc":
        return a.autor.localeCompare(b.autor, "es");
      case "anio-asc":
        return a.anio - b.anio;
      case "anio-desc":
        return b.anio - a.anio;
      case "ejemplares-desc":
        return b.ejemplares - a.ejemplares;
      default:
        return a.id - b.id;
    }
  });

  // ---------- ESTADÍSTICAS ----------
  const totalEjemplares = libros.reduce((suma, l) => suma + l.ejemplares, 0);
  const agotados = libros.filter((l) => l.ejemplares === 0).length;

  // ---------- EXPORTAR CSV ----------
  const exportarCSV = () => {
    const cab = ["ID", "Titulo", "Autor", "Categoria", "Anio", "Ejemplares", "Descripcion", "Fecha", "Imagen"];
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const filas = ordenados.map((l) =>
      [l.id, l.titulo, l.autor, l.categoria, l.anio, l.ejemplares, l.descripcion, l.fecha, l.imagen]
        .map(esc)
        .join(",")
    );
    const csv = "﻿" + [cab.join(","), ...filas].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "libros.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------- PANTALLA LOGIN ----------
  if (!logueado) {
    return (
      <div className="login-page">
        <div className="fondo-login" aria-hidden="true">
          <span className="forma f1" />
          <span className="forma f2" />
          <span className="forma f3" />
          <span className="forma f4" />
          <span className="forma f5" />
          <span className="forma f6" />
        </div>

        <form className="login-card" onSubmit={iniciarSesion}>
          <div className="login-icono">
            <ILock size={36} />
          </div>
          <h1>Inicia sesión</h1>
          <p className="login-sub">Sistema de gestión de biblioteca</p>

          <label htmlFor="usuario">Usuario</label>
          <input
            id="usuario"
            placeholder="Ingresa tu usuario"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoFocus
          />

          <label htmlFor="clave">Contraseña</label>
          <input
            id="clave"
            type="password"
            placeholder="Ingresa tu contraseña"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          {errorLogin && (
            <p className="error-login" key={intentos}>
              {errorLogin}
            </p>
          )}

          <button type="submit" className="btn-login">
            Iniciar sesión
          </button>
        </form>
      </div>
    );
  }

  // ---------- PANTALLA PRINCIPAL ----------
  return (
    <div className="app">
      <div className="banner" aria-hidden="true">
        <span className="orbe o1" />
        <span className="orbe o2" />
        <span className="orbe o3" />
      </div>

      <div className="contenedor">
        <header className="topbar">
          <div className="marca">
            <span className="logo">
              <IBook size={24} />
            </span>
            <div>
              <h1>Sistema de Libros</h1>
              <p>Panel de administración</p>
            </div>
          </div>
          <div className="acciones-top">
            <button className="btn-agregar" onClick={abrirNuevo}>
              <IPlus size={18} /> Agregar libro
            </button>
            <button className="btn-fantasma" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {mensaje && (
          <div className={`toast ${mensaje.tipo}`} role="status">
            {mensaje.texto}
          </div>
        )}

        <section className="kpis">
          <div className="kpi k1">
            <span className="kpi-icono">
              <IBook size={22} />
            </span>
            <div>
              <strong>
                <Contador valor={libros.length} />
              </strong>
              <small>Libros registrados</small>
            </div>
          </div>
          <div className="kpi k2">
            <span className="kpi-icono">
              <ILayers size={22} />
            </span>
            <div>
              <strong>
                <Contador valor={totalEjemplares} />
              </strong>
              <small>Ejemplares en total</small>
            </div>
          </div>
          <div className="kpi k3">
            <span className="kpi-icono">
              <ITag size={22} />
            </span>
            <div>
              <strong>
                <Contador valor={categorias.length} />
              </strong>
              <small>Categorías</small>
            </div>
          </div>
          <div className="kpi k4">
            <span className="kpi-icono">
              <IAlert size={22} />
            </span>
            <div>
              <strong>
                <Contador valor={agotados} />
              </strong>
              <small>Agotados</small>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="barra">
            <div className="buscador">
              <ISearch size={18} />
              <input
                placeholder="Buscar por título o autor"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <select
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="id">Ordenar: por ID</option>
              <option value="anio-desc">Año (más nuevo primero)</option>
              <option value="anio-asc">Año (más antiguo primero)</option>
              <option value="titulo-asc">Título (A-Z)</option>
              <option value="titulo-desc">Título (Z-A)</option>
              <option value="autor-asc">Autor (A-Z)</option>
              <option value="ejemplares-desc">Más ejemplares primero</option>
            </select>
            <span className="total">
              Total de libros: <strong>{libros.length}</strong>
              {(busqueda || filtroCat) && ` (mostrando ${filtrados.length})`}
            </span>
            <div className="selector-vista" role="group" aria-label="Tipo de vista">
              <button
                className={vista === "tarjetas" ? "activo" : ""}
                onClick={() => setVista("tarjetas")}
                aria-label="Vista de tarjetas"
                aria-pressed={vista === "tarjetas"}
                title="Tarjetas"
              >
                <IGrid size={18} />
              </button>
              <button
                className={vista === "tabla" ? "activo" : ""}
                onClick={() => setVista("tabla")}
                aria-label="Vista de tabla"
                aria-pressed={vista === "tabla"}
                title="Tabla"
              >
                <IList size={18} />
              </button>
            </div>
            <button className="btn-borde" onClick={exportarCSV}>
              <IDownload size={16} /> Exportar CSV
            </button>
          </div>

          {cargando && libros.length === 0 ? (
            <p className="vacio">Cargando...</p>
          ) : vista === "tarjetas" ? (
            ordenados.length === 0 ? (
              <p className="vacio">Sin registros</p>
            ) : (
              <div className="grid-libros">
                {ordenados.map((l, i) => (
                  <article
                    key={l.id}
                    className="tarjeta"
                    style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                  >
                    <div className="portada">
                      <Portada src={l.imagen} titulo={l.titulo} />
                      <button
                        className={`engrane ${
                          menu && menu.libro.id === l.id ? "activo" : ""
                        }`}
                        onClick={(e) => abrirMenu(e, l)}
                        aria-label={`Acciones para ${l.titulo}`}
                      >
                        <IGear size={18} />
                      </button>
                    </div>
                    <div className="tarjeta-info">
                      <h3 title={l.titulo}>{l.titulo}</h3>
                      <p className="tarjeta-autor">{l.autor}</p>
                      <div className="tarjeta-meta">
                        <span className="pildora">{l.categoria}</span>
                        <small>{l.anio}</small>
                      </div>
                      {l.ejemplares === 0 ? (
                        <span className="badge agotado">Agotado</span>
                      ) : (
                        <span className="badge disponible">
                          {l.ejemplares}{" "}
                          {l.ejemplares === 1 ? "disponible" : "disponibles"}
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : (
            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>Categoría</th>
                    <th>Año</th>
                    <th>Ejemplares</th>
                    <th className="centro">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenados.map((l, i) => (
                    <tr
                      key={l.id}
                      style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
                    >
                      <td className="id">{l.id}</td>
                      <td className="titulo">{l.titulo}</td>
                      <td>{l.autor}</td>
                      <td>
                        <span className="pildora">{l.categoria}</span>
                      </td>
                      <td>{l.anio}</td>
                      <td>
                        {l.ejemplares === 0 ? (
                          <span className="pildora roja">Agotado</span>
                        ) : (
                          l.ejemplares
                        )}
                      </td>
                      <td className="centro">
                        <button
                          className={`engrane ${
                            menu && menu.libro.id === l.id ? "activo" : ""
                          }`}
                          onClick={(e) => abrirMenu(e, l)}
                          aria-label={`Acciones para ${l.titulo}`}
                        >
                          <IGear size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {ordenados.length === 0 && (
                    <tr className="fila-vacia">
                      <td colSpan="7">Sin registros</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Chatbot />

      {/* Menú del engrane */}
      {menu && (
        <div
          className="menu-flotante"
          style={{
            right: menu.right,
            top: menu.top ?? "auto",
            bottom: menu.bottom ?? "auto",
          }}
        >
          <button onClick={() => editar(menu.libro)}>
            <IEdit size={16} /> Editar
          </button>
          <button className="peligro" onClick={() => pedirEliminar(menu.libro)}>
            <ITrash size={16} /> Eliminar
          </button>
        </div>
      )}

      {/* Ventana emergente: agregar / editar */}
      {mostrarForm && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && cerrarForm()}>
          <form className="modal" onSubmit={guardar}>
            <div className="modal-cabecera">
              <h2>{editId ? "Editar libro" : "Agregar libro"}</h2>
              <button
                type="button"
                className="cerrar"
                onClick={cerrarForm}
                aria-label="Cerrar"
              >
                <IClose size={18} />
              </button>
            </div>

            <div className="form-grid">
              <div className="campo ancho">
                <label htmlFor="f-titulo">Título</label>
                <input
                  id="f-titulo"
                  placeholder="Ej. Cien años de soledad"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="campo">
                <label htmlFor="f-autor">Autor</label>
                <input
                  id="f-autor"
                  placeholder="Nombre del autor"
                  value={form.autor}
                  onChange={(e) => setForm({ ...form, autor: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="f-cat">Categoría</label>
                <input
                  id="f-cat"
                  placeholder="Ej. Novela, Ciencia"
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                />
              </div>
              <div className="campo">
                <label htmlFor="f-anio">Año de publicación</label>
                <input
                  id="f-anio"
                  type="number"
                  placeholder="Ej. 1967"
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="f-ej">Ejemplares disponibles</label>
                <input
                  id="f-ej"
                  type="number"
                  placeholder="Ej. 5"
                  value={form.ejemplares}
                  onChange={(e) =>
                    setForm({ ...form, ejemplares: e.target.value })
                  }
                />
              </div>
              <div className="campo ancho">
                <label htmlFor="f-desc">Descripción (opcional)</label>
                <textarea
                  id="f-desc"
                  rows={3}
                  maxLength={400}
                  placeholder="Breve resumen del libro"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                />
              </div>
              <div className="campo ancho">
                <label htmlFor="f-img">Portada</label>
                <div className="campo-portada">
                  <div className="miniatura">
                    <Portada src={form.imagen} titulo={form.titulo || "Sin portada"} />
                  </div>
                  <div className="portada-controles">
                    <label
                      className={`btn-borde subir ${subiendo ? "deshabilitado" : ""}`}
                    >
                      <IUpload size={16} />
                      {subiendo ? "Subiendo imagen…" : "Subir portada desde mi PC"}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={subiendo}
                        onChange={subirPortada}
                      />
                    </label>
                    <input
                      id="f-img"
                      type="url"
                      placeholder="O pega la URL de una imagen (https://...)"
                      value={form.imagen}
                      disabled={subiendo}
                      onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-pie">
              <button type="button" className="btn-borde" onClick={cerrarForm}>
                Cancelar
              </button>
              <button type="submit" className="btn-primario" disabled={subiendo}>
                {subiendo ? "Subiendo imagen…" : editId ? "Guardar cambios" : "Agregar libro"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmación de borrado */}
      {aEliminar && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setAEliminar(null)}>
          <div className="modal chico">
            <span className="aviso-icono">
              <ITrash size={26} />
            </span>
            <h3>¿Deseas eliminar este registro?</h3>
            <p>
              <strong>{aEliminar.titulo}</strong>
              <br />
              {aEliminar.autor}
            </p>
            <div className="modal-pie centrado">
              <button className="btn-borde" onClick={() => setAEliminar(null)}>
                Cancelar
              </button>
              <button className="btn-peligro" onClick={confirmarEliminar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}