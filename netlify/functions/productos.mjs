import { PRODUCTOS, precioSuelto } from "../lib/productos.mjs";

/* Catálogo público para la tienda. No expone rutas de archivos. */
export default async () =>
  new Response(JSON.stringify(
    PRODUCTOS.map(p => ({
      id: p.id, tipo: p.tipo, nombre: p.nombre, bajada: p.bajada,
      precio: p.precio, paginas: p.paginas || null,
      disponible: !!p.disponible,
      incluye: p.incluye || null,
      precioSuelto: precioSuelto(p)
    }))
  ), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });

export const config = { path: "/api/productos" };
