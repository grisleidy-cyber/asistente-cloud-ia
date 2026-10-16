# 📚 Sistema de Libros + Asistente Cloud con IA

Aplicación web para administrar el catálogo de una biblioteca, desarrollada para la actividad **Despliegue de un sistema CRUD en la nube** (Cloud Computing, Unidad 2).

## Asistente Cloud con IA (nuevo)

Pestaña **Asistente IA**: el usuario escribe una pregunta, React la envía a la API REST (`/.netlify/functions/asistente`), la función lee el catálogo de Google Sheets, arma un prompt estructurado y consulta la API de Gemini. La respuesta vuelve a React y se guarda en la pestaña `Historial` de la hoja (se crea sola).

```
React → API REST (Netlify Functions) → Google Sheets + Gemini API → Respuesta → React
```

Extras: filtros (categoría, necesidad, solo disponibles), historial, estadísticas, manejo de errores y estados de carga.

## Tecnologías

| Componente   | Tecnología                     |
| ------------ | ------------------------------ |
| Interfaz     | React + Vite                   |
| API REST     | Node.js (Netlify Functions)    |
| Base de datos| Google Sheets (Google Sheets API) |
| IA           | Gemini API (Google AI Studio)  |
| Repositorio  | GitHub                         |
| Despliegue   | Netlify                        |

## Arquitectura

```
Usuario → React (Netlify) → API REST (Netlify Functions) → Google Sheets
```

## Funcionalidades

- Login básico (usuario/contraseña).
- CRUD completo de libros: título, autor, categoría, año y ejemplares.
- Búsqueda por título o autor, filtro por categoría y contador de registros.
- Validación de formularios y confirmación antes de eliminar.
- Diseño responsivo.

## API

| Método | Ruta                              | Acción             |
| ------ | --------------------------------- | ------------------ |
| GET    | `/.netlify/functions/libros`      | Consultar libros   |
| POST   | `/.netlify/functions/libros`      | Crear libro        |
| PUT    | `/.netlify/functions/libros/:id`  | Actualizar libro   |
| DELETE | `/.netlify/functions/libros/:id`  | Eliminar libro     |
| POST   | `/.netlify/functions/asistente`   | Pregunta al asistente IA |
| GET    | `/.netlify/functions/historial`   | Estadísticas y últimas consultas |

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores (nunca subas `.env` al repositorio):

- `SHEET_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GEMINI_API_KEY` (clave de https://aistudio.google.com/apikey)
- `GEMINI_MODEL` (opcional, por defecto `gemini-3.5-flash-lite`)

## Ejecutar localmente

```bash
npm install
npx netlify-cli dev
```
