import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ─────────────────────────────────────────────────────────────────────────
   La marca de agua personal.

   El candado técnico (token, vencimiento, tope de bajadas) frena a quien
   pasa un link. Lo que frena a quien sube el PDF a un grupo de WhatsApp es
   que el archivo diga su mail en todas las páginas.

   Es discreta a propósito: un renglón gris al pie, que no molesta al leer
   pero que está en las 56 páginas y no se saca sin romper el archivo.
   ───────────────────────────────────────────────────────────────────────── */

/** Oculta el mail lo justo: jime****@gmail.com. Identifica sin exponer. */
function velar(mail) {
  const m = String(mail || "").trim();
  const i = m.indexOf("@");
  if (i < 1) return "";
  const usuario = m.slice(0, i);
  const visible = usuario.slice(0, Math.min(4, usuario.length));
  return `${visible}${"*".repeat(Math.max(3, usuario.length - visible.length))}${m.slice(i)}`;
}

/**
 * Devuelve el PDF con el pie personal en cada página.
 * Si algo falla, devuelve el original: nunca dejamos a un cliente que pagó
 * sin su archivo por un problema de maquetado.
 */
export async function marcar(bytes, { email, pagoId, fecha } = {}) {
  try {
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const quien = velar(email);
    const cuando = (fecha || new Date().toISOString()).slice(0, 10);
    const texto = quien
      ? `Licencia personal de ${quien} · compra ${pagoId || "—"} · ${cuando} · fayer.site`
      : `Licencia personal · compra ${pagoId || "—"} · ${cuando} · fayer.site`;

    const cuerpo = 6.4;
    const gris = rgb(0.62, 0.58, 0.55);
    const paginas = pdf.getPages();

    // La tapa no se toca: es la que se ve en la tienda y en las capturas.
    for (let i = 1; i < paginas.length; i++) {
      const pg = paginas[i];
      const { width } = pg.getSize();
      const ancho = font.widthOfTextAtSize(texto, cuerpo);
      pg.drawText(texto, {
        x: Math.max(8, (width - ancho) / 2),
        y: 11,
        size: cuerpo,
        font,
        color: gris,
        opacity: 0.75,
      });
    }

    pdf.setTitle(pdf.getTitle() || "Fayer");
    pdf.setProducer("Fayer · fayer.site");
    return await pdf.save({ useObjectStreams: true });
  } catch {
    return bytes;
  }
}
