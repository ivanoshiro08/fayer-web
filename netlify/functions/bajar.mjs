import { getStore } from "@netlify/blobs";
import { porId } from "../lib/productos.mjs";
import { leerPdf, diagnostico } from "../lib/archivos.mjs";
import { marcar } from "../lib/marca.mjs";

/* ─────────────────────────────────────────────────────────────────────────
   /api/bajar — la única puerta a los PDF.

   Los archivos NO están publicados. Esta función es lo único que los lee, y
   solo después de validar tres cosas:

     1. El token existe y salió de un pago aprobado de verdad.
     2. El producto pedido estaba en esa compra.
     3. No venció y no se pasó del tope de bajadas.

   Cada descarga sale con el mail del comprador al pie de cada página.

   Diagnóstico (una sola vez, después de deployar):
     /api/bajar?diag=1&clave=<ADMIN_CLAVE>
   ───────────────────────────────────────────────────────────────────────── */

const DIAS_VALIDO = 120;   // el link sirve cuatro meses
const TOPE = 8;            // bajadas por producto: alcanza y sobra para uso normal

const error = (msg, status = 403) =>
  new Response(msg, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });

export default async (req) => {
  const url = new URL(req.url);

  // ── Modo diagnóstico ──────────────────────────────────────────────────
  if (url.searchParams.get("diag")) {
    const clave = process.env.ADMIN_CLAVE;
    if (!clave || url.searchParams.get("clave") !== clave) return error("no", 404);
    const ejemplo = porId("primer-sueldo")?.archivo || "";
    const rutas = await diagnostico(ejemplo);
    return new Response(
      `archivo de prueba: ${ejemplo}\ncwd: ${process.cwd()}\n` +
      `LAMBDA_TASK_ROOT: ${process.env.LAMBDA_TASK_ROOT || "(vacío)"}\n\n` +
      rutas.join("\n") + "\n",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }

  // ── Descarga real ─────────────────────────────────────────────────────
  const token = (url.searchParams.get("t") || "").trim();
  const id = (url.searchParams.get("id") || "").trim();

  if (!/^[a-f0-9]{32}$/.test(token) || !/^[a-z0-9-]{2,40}$/.test(id)) {
    return error("Link inválido.", 400);
  }

  const producto = porId(id);
  if (!producto || producto.entrega !== "descarga" || !producto.archivo) {
    return error("Ese producto no es una descarga.", 404);
  }

  const ventas = getStore("fayer-ventas");
  const clave = `entrega/${token}`;
  const entrega = await ventas.get(clave, { type: "json" });

  if (!entrega) {
    return error("Este link no existe o fue dado de baja. Escribinos y te lo reponemos.", 403);
  }
  if (!Array.isArray(entrega.items) || !entrega.items.includes(id)) {
    return error("Ese libro no estaba en esta compra.", 403);
  }

  const dias = (Date.now() - new Date(entrega.creado || 0).getTime()) / 86400000;
  if (dias > DIAS_VALIDO) {
    return error(
      `Este link venció (dura ${DIAS_VALIDO} días). Escribinos con tu número de compra y te mandamos uno nuevo.`,
      410);
  }

  const bajadas = entrega.bajadas || {};
  if ((bajadas[id] || 0) >= TOPE) {
    return error(
      `Llegaste al tope de ${TOPE} descargas de este libro. Si perdiste el archivo, escribinos y lo resolvemos.`,
      429);
  }

  const bytes = await leerPdf(producto.archivo);
  if (!bytes) {
    // Que no parezca culpa del cliente: pagó bien, el problema es nuestro.
    return error("No pudimos abrir el archivo. Escribinos y te lo mandamos por mail hoy mismo.", 500);
  }

  const salida = await marcar(bytes, {
    email: entrega.email,
    pagoId: entrega.pago_id,
    fecha: entrega.creado
  });

  // Contamos DESPUÉS de tener el archivo: un error nuestro no le gasta una bajada.
  bajadas[id] = (bajadas[id] || 0) + 1;
  try {
    await ventas.setJSON(clave, { ...entrega, bajadas, ultima: new Date().toISOString() });
  } catch { /* si falla el contador, igual le damos el libro */ }

  const nombre = `${producto.nombre} — Fayer.pdf`;
  return new Response(salida, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
};

export const config = { path: "/api/bajar" };
