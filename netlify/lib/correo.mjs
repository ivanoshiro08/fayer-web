/* ─────────────────────────────────────────────────────────────────────────
   El mail de compra.

   Se manda apenas Mercado Pago confirma el pago. Es lo que hace que nadie
   pierda sus libros por cerrar la pestaña.

   Van dos mails por venta:
     1. Al comprador, con sus links y su código.
     2. A vos, para que te enteres de cada venta sin entrar a ningún lado.

   Variables de entorno (en Netlify):
     RESEND_API_KEY   la clave de resend.com  → si falta, no se manda nada
                      y la compra sigue funcionando igual
     MAIL_DESDE       "Fayer <hola@fayer.site>" — el dominio tiene que estar
                      verificado en Resend para poder escribirle a terceros
     MAIL_AVISO       adónde te llega el aviso de venta

   Nada de esto puede romper la entrega: si el mail falla, se registra y
   se sigue. La pantalla de gracias ya le dio todo al comprador.
   ───────────────────────────────────────────────────────────────────────── */

const SITIO = "https://fayer.site";
const CONTACTO = "fayer.help@gmail.com";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const pesos = (n) =>
  "$" + Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });

/* ── Plantilla ────────────────────────────────────────────────────────────
   Tablas y estilos en línea: es lo único que renderiza igual en Gmail,
   Outlook y el cliente del iPhone. Fondo claro a propósito, que el modo
   oscuro de Gmail invierte los fondos oscuros y queda ilegible. */

function boton(texto, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0 0">
    <tr><td style="background:#D93F00;border-radius:999px">
      <a href="${esc(url)}" style="display:inline-block;padding:11px 22px;font-family:Helvetica,Arial,sans-serif;
        font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">${esc(texto)}</a>
    </td></tr></table>`;
}

function bloqueEntrega(e, base) {
  const marco = `border:1px solid #E4DCD4;border-radius:12px;padding:16px 18px;margin:0 0 12px;
    font-family:Helvetica,Arial,sans-serif`;
  const rotulo = `font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#948A81;margin:0 0 4px`;
  const nombre = `font-size:15px;font-weight:600;color:#191411;margin:0`;

  if (e.tipo === "codigo") {
    const destino = e.id === "sistema"
      ? `${base}/sistema/?acceso=${encodeURIComponent(e.codigo)}`
      : `${base}/?acceso=${encodeURIComponent(e.codigo)}`;
    return `<div style="${marco}">
      <p style="${rotulo}">Código de acceso</p>
      <p style="${nombre}">${esc(e.nombre)}</p>
      <p style="font-size:20px;font-weight:700;letter-spacing:1px;color:#D93F00;margin:10px 0 0;
        font-family:'Courier New',monospace">${esc(e.codigo)}</p>
      <p style="font-size:12px;color:#6E6259;margin:8px 0 0;line-height:1.5">
        Es de un solo uso y queda atado al navegador donde lo canjees.</p>
      ${boton("Entrar ahora", destino)}
    </div>`;
  }

  if (e.tipo === "descarga") {
    return `<div style="${marco}">
      <p style="${rotulo}">Descarga</p>
      <p style="${nombre}">${esc(e.nombre)}</p>
      <p style="font-size:12px;color:#6E6259;margin:8px 0 0;line-height:1.5">
        El link es tuyo y dura 120 días. El PDF sale con tu licencia personal al pie.</p>
      ${boton("Bajar el PDF", base + e.link)}
    </div>`;
  }

  return `<div style="${marco}">
    <p style="${rotulo}">En camino</p>
    <p style="${nombre}">${esc(e.nombre)}</p>
    <p style="font-size:12px;color:#6E6259;margin:8px 0 0;line-height:1.5">
      Todavía no está publicado. Te lo mandamos apenas salga, sin costo.</p>
  </div>`;
}

export function mailComprador({ entregas, monto, pagoId, base }) {
  const cuerpo = entregas.map((e) => bloqueEntrega(e, base)).join("");
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FBF8F5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F5">
<tr><td align="center" style="padding:28px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="max-width:520px;background:#ffffff;border:1px solid #E4DCD4;border-radius:18px">
<tr><td style="padding:26px 24px">

  <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;
    letter-spacing:-0.4px;color:#191411;margin:0 0 4px">Fayer</p>
  <div style="height:1px;background:#E4DCD4;margin:0 0 20px"></div>

  <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:21px;font-weight:700;
    letter-spacing:-0.6px;color:#191411;margin:0 0 8px;line-height:1.25">Gracias por tu compra</h1>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#6E6259;
    margin:0 0 20px;line-height:1.6">
    Guardá este mail: acá adentro está todo lo que compraste. Si perdés los links, volvés a este mail y listo.</p>

  ${cuerpo}

  <div style="border:1px solid #F3D3C3;background:#FFF1EA;border-radius:12px;padding:15px 17px;margin:16px 0 0">
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1.6px;
      text-transform:uppercase;color:#D93F00;margin:0 0 5px">Si algo falla</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#191411;margin:0;line-height:1.55">
      Si el archivo no te llega, no abre o no es lo que compraste, respondé este mail y lo
      resolvemos el mismo día. Tenés además 10 días corridos para arrepentirte de la compra,
      como manda la ley.</p>
  </div>

  <div style="height:1px;background:#E4DCD4;margin:22px 0 14px"></div>
  <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#948A81;margin:0;line-height:1.6">
    Compra ${esc(pagoId)} · ${pesos(monto)}<br>
    Cualquier cosa, escribinos a <a href="mailto:${CONTACTO}"
      style="color:#D93F00;text-decoration:none">${CONTACTO}</a><br>
    <a href="${base}" style="color:#948A81;text-decoration:none">fayer.site</a>
  </p>

</td></tr></table>
</td></tr></table>
</body></html>`;
}

function mailAviso({ entregas, monto, pagoId, email }) {
  const items = entregas.map((e) => `<li>${esc(e.nombre)} (${esc(e.tipo)})</li>`).join("");
  return `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#191411">
    <h2 style="margin:0 0 8px">Venta nueva · ${pesos(monto)}</h2>
    <p style="margin:0 0 4px">Comprador: <b>${esc(email || "sin mail")}</b></p>
    <p style="margin:0 0 12px;color:#6E6259">Pago ${esc(pagoId)}</p>
    <ul style="margin:0;padding-left:18px">${items}</ul>
  </body></html>`;
}

/* ── Envío ───────────────────────────────────────────────────────────────── */

async function enviar({ para, asunto, html, responder }) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave || !para) return { ok: false, motivo: "sin_config" };

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_DESDE || `Fayer <onboarding@resend.dev>`,
      to: [para],
      subject: asunto,
      html,
      ...(responder ? { reply_to: responder } : {})
    })
  });

  if (!r.ok) return { ok: false, motivo: `resend_${r.status}`, detalle: await r.text() };
  return { ok: true };
}

/**
 * Manda el mail al comprador y el aviso de venta. Nunca tira: devuelve qué
 * pasó con cada uno para que quede en el registro de la venta.
 */
export async function avisarCompra({ entregas, monto, pagoId, email, base = SITIO }) {
  const resultado = { comprador: null, aviso: null };

  try {
    resultado.comprador = await enviar({
      para: email,
      asunto: "Tu compra en Fayer",
      html: mailComprador({ entregas, monto, pagoId, base }),
      responder: CONTACTO
    });
  } catch (e) {
    resultado.comprador = { ok: false, motivo: "excepcion", detalle: String(e) };
  }

  try {
    resultado.aviso = await enviar({
      para: process.env.MAIL_AVISO || CONTACTO,
      asunto: `Venta · ${pesos(monto)} · ${email || "sin mail"}`,
      html: mailAviso({ entregas, monto, pagoId, email })
    });
  } catch (e) {
    resultado.aviso = { ok: false, motivo: "excepcion", detalle: String(e) };
  }

  return resultado;
}
