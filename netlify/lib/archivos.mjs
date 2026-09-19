import { readFile } from "node:fs/promises";
import path from "node:path";

/* ─────────────────────────────────────────────────────────────────────────
   Dónde están los PDF.

   Viven en /privado/descargas/, FUERA de la carpeta que Netlify publica.
   No hay ninguna URL que los sirva: la única forma de llegar a ellos es
   a través de /api/bajar, que antes valida el token de la compra.

   netlify.toml los mete en el paquete de las funciones con included_files.
   Según cómo bundlee Netlify, el archivo puede quedar colgando de la raíz
   del lambda o del directorio de trabajo, así que probamos las dos y nos
   quedamos con la que exista. Es fea pero es a prueba de sorpresas.
   ───────────────────────────────────────────────────────────────────────── */

const RELATIVO = "privado/descargas";

function candidatos(archivo) {
  const raices = [
    process.env.LAMBDA_TASK_ROOT,
    process.cwd(),
    "/var/task",
    path.resolve(process.cwd(), ".."),
    path.resolve(process.cwd(), "../.."),
  ].filter(Boolean);

  const rutas = [];
  for (const r of raices) {
    rutas.push(path.join(r, RELATIVO, archivo));
    rutas.push(path.join(r, archivo));
  }
  return [...new Set(rutas)];
}

/** Devuelve el PDF como Uint8Array, o null si no lo encuentra. */
export async function leerPdf(archivo) {
  // Nombre de archivo y nada más: sin barras, sin "..", sin rutas absolutas.
  if (!/^[A-Za-z0-9._-]+\.pdf$/.test(archivo)) return null;

  for (const ruta of candidatos(archivo)) {
    try {
      return new Uint8Array(await readFile(ruta));
    } catch { /* probamos la siguiente */ }
  }
  return null;
}

/** Para el diagnóstico: qué rutas se probaron y cuál existe. */
export async function diagnostico(archivo) {
  const out = [];
  for (const ruta of candidatos(archivo)) {
    let estado = "no";
    try { await readFile(ruta); estado = "SÍ"; } catch {}
    out.push(`${estado}  ${ruta}`);
  }
  return out;
}
