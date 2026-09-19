import { getStore } from "@netlify/blobs";

/* ─────────────────────────────────────────────────────────────────────────
   Canje de códigos. Dos orígenes, mismo tratamiento:

   1. Códigos EMITIDOS automáticamente por una venta (función /api/pago).
      Viven en Netlify Blobs bajo "emitido/<sha256>".
   2. Códigos MANUALES tuyos, para regalar o vender a mano.
      Van en la lista CODIGOS de acá abajo, guardados como SHA-256.

   En los dos casos el código es de UN SOLO USO: al canjearlo se marca
   y se devuelve un token. Ese token es lo único que permite volver a entrar.
   ───────────────────────────────────────────────────────────────────────── */

const CODIGOS = {
  "700e0932acdb36d9c595386cb0bd8d98ff4e03cfe21070a9a0c3353af907b390": "pro",
  "04bbbf70bb661298307e987ee6f3906983fa0035f65a420a5bc8ccb7d7b04333": "pro",
  "34a160f18f7a931b33fc0fd4d555f3064b5220b54f13956ec4ad6f12c1c474a6": "pro",
  "291596527e711cf425b9fe3b17333e93d9d6fb6d984608ec1015568b52e1d6b1": "pro",
  "6ad1d85d7e2c764615013ad0ba8661d19306a8d24c3ea87c4d456f0449c9fbd0": "pro",
  "dde320ca6b0f0e4eee303b09b94f91b35c99ebc4c4cd4f3b77ab9a9c0c80dd9d": "pro",
  "9be01ece647b2ad85aed327012bf210cc27d247d56a9c743139e9a615ab25a2b": "pro",
  "97d831c13349be014585e86fe094d19ebaa9abd3816147018978c199ac213131": "pro",
  "b14fa81067a7c8f0f0ecd147ab2cf09626e80b2722709681c7b854970088c6b2": "pro",
  "451855e26d8a88b105df7ccad7f9e310b6ce39afdf6fa93d751e7f719f7edea7": "pro",
  "9279bdfd7fad5274b83891a2bdf7578430c8ee8fa72f0d607d7f87f71bf73259": "sistema",
  "77d13db652551e1e92f6dc1e2f42c702fc63a1b1479a22a4a9c892a98395d671": "sistema",
  "227d355655971af4111d8dba3e2bc74922764bfb232ffea0421402d8054cd6d4": "sistema",
  "fe1913c658d4a11e681bc2296faa193591ba864ffd80a2936bdaa62e5d53d14c": "sistema",
  "318a116db03d7763814eb0de850c06566db84985ffe037767e35f25736596c71": "sistema",
  "3d8bef96e2f40a163e09e669341e3e85fc19faeda25204a8f1110def91ecc5c1": "sistema",
  "e76333a1dbf2e4cb2965a531ace40515f78c4ffdc1b4632bf9e48bf35a9bfbfb": "sistema",
  "fd0d4288d0d3732159e2fd9255c4c9f61700fd48bf6c77ec84afc914a608b0bb": "sistema",
  "55e5b452f8da722136b9f1bbbfa2eb4a3af211a6b1c7aa9ab6ed18f91f62e8d1": "sistema",
  "4094a0fc8de5eb87c42430ee066513fffa019822b191e0cbd80f2aa1bf6abbcd": "sistema"
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });

async function sha256(txt) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "metodo" }, 405);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalido" }, 400); }

  const codigo = String(body.codigo || "").trim().toUpperCase();
  if (!codigo) return json({ ok: false, error: "invalido" });

  const hash = await sha256(codigo);
  const store = getStore("fayer-codigos");

  // ── 1. ¿Es un código emitido por una venta?
  const emitido = await store.get(`emitido/${hash}`, { type: "json" });
  if (emitido) {
    if (body.producto && body.producto !== emitido.producto) {
      return json({ ok: false, error: "invalido" });
    }
    if (emitido.canjeado) {
      if (body.token && body.token === emitido.token) {
        return json({ ok: true, producto: emitido.producto, token: emitido.token, reingreso: true });
      }
      return json({ ok: false, error: "usado", fecha: emitido.canjeado_el });
    }
    const token = crypto.randomUUID();
    await store.setJSON(`emitido/${hash}`, {
      ...emitido, canjeado: true, canjeado_el: new Date().toISOString(), token
    });
    return json({ ok: true, producto: emitido.producto, token });
  }

  // ── 2. ¿Es uno de tus códigos manuales?
  const producto = CODIGOS[hash];
  if (!producto) return json({ ok: false, error: "invalido" });
  if (body.producto && body.producto !== producto) return json({ ok: false, error: "invalido" });

  const usado = await store.get(hash, { type: "json" });
  if (usado) {
    if (body.token && body.token === usado.token) {
      return json({ ok: true, producto, token: usado.token, reingreso: true });
    }
    return json({ ok: false, error: "usado", fecha: usado.fecha });
  }

  const token = crypto.randomUUID();
  await store.setJSON(hash, { token, producto, fecha: new Date().toISOString() });
  return json({ ok: true, producto, token });
};

export const config = { path: "/api/canjear" };
