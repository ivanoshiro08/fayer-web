/* ─────────────────────────────────────────────────────────────────────────
   CATÁLOGO — única fuente de verdad.

   Lo usan la tienda, el checkout y la entrega. Si tocás un precio acá,
   cambia en todos lados. No hay otro lugar donde editarlo.

   Para publicar un ebook cuando lo tengas escrito:
     1. Subí el PDF a  /descargas/<archivo>.pdf
     2. Poné  disponible: true  y completá  archivo
   ───────────────────────────────────────────────────────────────────────── */

export const PRODUCTOS = [
  // ── Acceso a herramientas ────────────────────────────────────────────────
  {
    id: "pro",
    tipo: "acceso",
    nombre: "Análisis completo de la calculadora",
    bajada: "Proyección a 12 meses, tres escenarios y la tabla de sensibilidad de precio.",
    precio: 9900,
    disponible: true,
    entrega: "codigo"
  },
  {
    id: "sistema",
    tipo: "acceso",
    nombre: "Sistema Fayer",
    bajada: "Movimientos, cobranzas, pagos, flujo de caja a 12 meses y punto de equilibrio. Sirve para empresa o para finanzas personales.",
    precio: 89000,
    disponible: true,
    entrega: "codigo"
  },

  // ── Ebooks ───────────────────────────────────────────────────────────────
  {
    id: "primer-sueldo",
    tipo: "ebook",
    nombre: "Tu primer sueldo",
    bajada: "Qué hacer con la plata los primeros seis meses, antes de que se te vaya sin saber en qué.",
    precio: 9900,
    paginas: 56,
    disponible: true,
    entrega: "descarga",
    archivo: "tu-primer-sueldo-d9b21c6e89d7.pdf"
  },
  {
    id: "mes-no-cierra",
    tipo: "ebook",
    nombre: "El mes no cierra",
    bajada: "Cómo salir del rojo sin dejar de vivir.",
    precio: 14900,
    paginas: 54,
    disponible: true,
    entrega: "descarga",
    archivo: "el-mes-no-cierra-059c5f39726a.pdf"
  },
  {
    id: "seis-meses",
    tipo: "ebook",
    nombre: "Seis meses de aire",
    bajada: "El colchón que te saca del apuro, y cómo armarlo sin sufrir.",
    precio: 12900,
    paginas: 51,
    disponible: true,
    entrega: "descarga",
    archivo: "seis-meses-de-aire-aed610ab1e6a.pdf"
  },
  {
    id: "plata-en-pareja",
    tipo: "ebook",
    nombre: "Plata en pareja",
    bajada: "Cómo organizar las cuentas de a dos sin terminar peleados.",
    precio: 14900,
    paginas: 50,
    disponible: true,
    entrega: "descarga",
    archivo: "plata-en-pareja-fd42d17aa639.pdf"
  },
  {
    id: "cobrar-por-tu-cuenta",
    tipo: "ebook",
    nombre: "Cobrar por tu cuenta",
    bajada: "Freelance: presupuestar, cobrar y no llevarte sorpresas.",
    precio: 19900,
    paginas: 57,
    disponible: true,
    entrega: "descarga",
    archivo: "cobrar-por-tu-cuenta-cf0b8beba195.pdf"
  },

  // ── Combos ───────────────────────────────────────────────────────────────
  {
    id: "combo-ordenar",
    tipo: "combo",
    nombre: "Combo Ordenar",
    bajada: "Los tres para poner tus números en orden, de principio a fin.",
    incluye: ["primer-sueldo", "mes-no-cierra", "seis-meses"],
    precio: 27900,
    disponible: true,
    entrega: "descarga"
  },
  {
    id: "combo-completo",
    tipo: "combo",
    nombre: "Combo Completo",
    bajada: "Los cinco ebooks. Todo lo que escribimos sobre finanzas personales.",
    incluye: ["primer-sueldo", "mes-no-cierra", "seis-meses", "plata-en-pareja", "cobrar-por-tu-cuenta"],
    precio: 44900,
    disponible: true,
    entrega: "descarga"
  },
  {
    id: "combo-todo",
    tipo: "combo",
    nombre: "Sistema + los cinco ebooks",
    bajada: "La herramienta y todo el material. Es el que más conviene por lejos.",
    incluye: ["sistema", "primer-sueldo", "mes-no-cierra", "seis-meses", "plata-en-pareja", "cobrar-por-tu-cuenta"],
    precio: 109000,
    disponible: true,
    entrega: "mixta"
  }
];

export const porId = (id) => PRODUCTOS.find(p => p.id === id);

/** Suma de los ítems sueltos que incluye un combo, para mostrar cuánto ahorra. */
export function precioSuelto(p) {
  if (!p.incluye) return p.precio;
  return p.incluye.reduce((a, id) => a + (porId(id)?.precio || 0), 0);
}
