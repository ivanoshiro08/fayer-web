import { getStore } from "@netlify/blobs";
import { PRODUCTOS, porId } from "../lib/productos.mjs";

/* ─────────────────────────────────────────────────────────────────────────
   Entrega automática después del pago.

   /gracias/ llama acá con el payment_id que devolvió Mercado Pago.
   Verificamos el pago CONTRA LA API DE MP — nunca confiamos en la URL,
   porque cualquiera puede escribir un número a mano en la barra.

   Idempotente: si el cliente recarga, recibe exactamente lo mismo.
   Requiere MP_ACCESS_TOKEN en las variables de entorno de Netlify.
   ───────────────────────────────────────────────────────────────────────── */

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

const ALF = "ACDEFGHJKLMNPQRTUVWXY34679";  // sin 0/O, 1/I, S/5
function nuevoCodigo(prefijo) {
  const b = crypto.getRandomValues(new Uint8Array(8));
  const c = [...b].map(x => ALF[x % ALF.length]).join("");
  return `${prefijo}-${c.slice(0,4)}-${c.slice(4,8)}`;
}
/** Token de entrega: 128 bits al azar. Es la llave de las descargas. */
function nuevoToken() {
  const b = crypto.getRandomValues(new Uint8Array(16));
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
}

async function sha256(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

/** Expande combos a sus productos, sin repetidos. */
function expandir(ids) {
  const out = [];
  for (const id of ids) {
    const p = porId(id);
    if (!p) continue;
    if (p.incluye) { for (const h of p.incluye) if (!out.includes(h)) out.push(h); }
    else if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** Si el pago no trae referencia (por ejemplo vino del link suelto), deducimos por monto. */
function deducirPorMonto(monto) {
  const exacto = PRODUCTOS.find(p => p.disponible && p.precio === Number(monto));
  if (exacto) return [exacto.id];
  return [Number(monto) >= 50000 ? "sistema" : "pro"];
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "metodo" }, 405);

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return json({ ok: false, error: "sin_config" }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalido" }, 400); }

  const pagoId = String(body.payment_id || "").trim();
  if (!/^\d{5,}$/.test(pagoId)) return json({ ok: false, error: "invalido" });

  const ventas = getStore("fayer-ventas");
  const previo = await ventas.get(pagoId, { type: "json" });
  if (previo) return json({ ok: true, entregas: previo.entregas, repetido: true });

  let pago;
  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return json({ ok: false, error: r.status === 404 ? "no_encontrado" : "mp_error" });
    pago = await r.json();
  } catch { return json({ ok: false, error: "mp_error" }); }

  if (pago.status !== "approved") return json({ ok: false, error: "no_aprobado", estado: pago.status });

  const ref = String(pago.external_reference || "").trim();
  const pedidos = ref ? ref.split(",").map(s => s.trim()).filter(Boolean)
                      : deducirPorMonto(pago.transaction_amount);

  const codigos = getStore("fayer-codigos");
  const entregas = [];
  const entregaToken = nuevoToken();   // una llave por compra
  const bajables = [];                 // qué libros habilita esa llave

  for (const id of expandir(pedidos)) {
    const p = porId(id);
    if (!p) continue;

    if (p.entrega === "codigo") {
      const codigo = nuevoCodigo(id === "sistema" ? "FAYER-SIS" : "FAYER-PRO");
      await codigos.setJSON(`emitido/${await sha256(codigo)}`, {
        producto: id, pago_id: pagoId, fecha: new Date().toISOString(), canjeado: false
      });
      entregas.push({
        tipo: "codigo", id, nombre: p.nombre, codigo,
        link: id === "sistema" ? `/sistema/?acceso=${encodeURIComponent(codigo)}`
                               : `/?acceso=${encodeURIComponent(codigo)}`
      });
    } else if (p.entrega === "descarga" && p.archivo) {
      bajables.push(id);
      entregas.push({
        tipo: "descarga", id, nombre: p.nombre,
        link: `/api/bajar?t=${entregaToken}&id=${encodeURIComponent(id)}`
      });
    } else {
      // Comprado pero todavía sin archivo: se avisa, no se deja al cliente sin nada.
      entregas.push({ tipo: "pendiente", id, nombre: p.nombre });
    }
  }

  const ahora = new Date().toISOString();
  const email = pago.payer?.email || "";

  // La llave de descarga. /api/bajar es lo único que la lee, y sin ella
  // no hay forma de llegar a los PDF: no están publicados en ningún lado.
  if (bajables.length) {
    await ventas.setJSON(`entrega/${entregaToken}`, {
      items: bajables, pago_id: pagoId, email, creado: ahora, bajadas: {}
    });
  }

  await ventas.setJSON(pagoId, {
    entregas, monto: pago.transaction_amount,
    email, referencia: ref, fecha: ahora
  });

  return json({ ok: true, entregas });
};

export const config = { path: "/api/pago" };
