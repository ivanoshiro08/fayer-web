import { PRODUCTOS, porId } from "../lib/productos.mjs";

/* ─────────────────────────────────────────────────────────────────────────
   Crea el pago en Mercado Pago y manda al checkout.

   Acepta un carrito:  /api/comprar?items=pro,primer-sueldo
   o un solo producto: /api/comprar?producto=pro

   Si falta MP_ACCESS_TOKEN, o MP no responde, cae al link de pago común
   para que el sitio nunca quede sin forma de cobrar.
   ───────────────────────────────────────────────────────────────────────── */

const LINK_RESPALDO = "https://link.mercadopago.com.ar/fayer";

export default async (req) => {
  const token = process.env.MP_ACCESS_TOKEN;
  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;

  const crudo = url.searchParams.get("items") || url.searchParams.get("producto") || "";
  const ids = [...new Set(crudo.split(",").map(s => s.trim()).filter(Boolean))];

  const items = ids.map(porId).filter(p => p && p.disponible);
  if (!items.length) return Response.redirect(`${base}/tienda/?error=vacio`, 302);
  if (!token) return Response.redirect(LINK_RESPALDO, 302);

  const total = items.reduce((a, p) => a + p.precio, 0);

  const preferencia = {
    items: items.map(p => ({
      id: p.id,
      title: `Fayer — ${p.nombre}`,
      quantity: 1,
      unit_price: p.precio,
      currency_id: "ARS"
    })),
    // La entrega lee esto para saber qué mandar. Es el dato que une pago y producto.
    external_reference: items.map(p => p.id).join(","),
    statement_descriptor: "FAYER",
    back_urls: {
      success: `${base}/gracias/`,
      pending: `${base}/gracias/`,
      failure: `${base}/tienda/?pago=fallido`
    },
    auto_return: "approved",
    payment_methods: { installments: 12 }
  };

  try {
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(preferencia)
    });
    if (!r.ok) return Response.redirect(LINK_RESPALDO, 302);
    const d = await r.json();
    const destino = d.init_point || d.sandbox_init_point;
    return Response.redirect(destino || LINK_RESPALDO, 302);
  } catch {
    return Response.redirect(LINK_RESPALDO, 302);
  }
};

export const config = { path: "/api/comprar" };
