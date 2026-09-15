# fayer.site — paquete de despliegue

## Qué hay acá

| Archivo | Para qué sirve |
|---|---|
| `index.html` | El sitio completo. Todo el CSS y el JS van adentro; no hay build |
| `netlify.toml` | Headers de seguridad, caché y redirección de www → apex |
| `favicon.svg` | Ícono de la pestaña |
| `og.png` | Imagen de previsualización al compartir el link (1200×630) |
| `robots.txt` | Permite indexar todo y apunta al sitemap |
| `sitemap.xml` | Mapa del sitio para Google |

## Cómo publicarlo

1. Copiá **todos** estos archivos a la raíz de tu repo de GitHub (al mismo nivel, no dentro de una carpeta).
2. `git add . && git commit -m "Nueva home de Fayer" && git push`
3. Netlify lo detecta y despliega solo. Tarda menos de un minuto.

En Netlify, verificá que en *Build settings* el **publish directory** esté en `.` y el
**build command** vacío. Si el repo tenía otra configuración, `netlify.toml` la pisa.

## Antes de publicar, cambiá estas cuatro cosas

1. **El link de pago** — en `index.html`, buscá `link.mercadopago.com.ar/fayer` y poné tu link real de Mercado Pago.
2. **El precio del análisis Pro** — buscá `$9.900` dentro del bloque `gate-card`.
3. **Los precios de las guías** — buscá `$14.900`, `$12.900` y `$16.900`.
4. **Los códigos de acceso** — ver abajo.

## Códigos de acceso al análisis Pro

Estos cinco ya están activos:

```
FAYER-PRO-A7K2
FAYER-PRO-M4Q9
FAYER-PRO-T6R1
FAYER-PRO-Z3B8
FAYER-PRO-J5N4
```

En `index.html` están guardados como SHA-256, no en texto plano. Para generar uno nuevo,
abrí la consola del navegador y pegá esto con tu código:

```js
crypto.subtle.digest('SHA-256', new TextEncoder().encode('FAYER-PRO-LOQUESEA'))
  .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
```

Copiá el resultado y agregalo al array `CODES` en `index.html`.

También funciona el link directo: `https://fayer.site/?acceso=FAYER-PRO-A7K2` desbloquea y
queda guardado en ese navegador. Sirve para la página de "gracias por tu compra" de Mercado Pago.

## IMPORTANTE — la limitación del candado

Este bloqueo es del lado del navegador. Alguien que sepa abrir las herramientas de desarrollo
puede saltearlo. Para la mayoría de la gente alcanza, pero **no es un candado real**.

El candado de verdad necesita una Netlify Function que valide el pago contra la API de
Mercado Pago antes de devolver el contenido. Es el paso siguiente cuando tengas ventas
que lo justifiquen.

## El formulario de contacto

Usa Netlify Forms y se activa solo con el primer deploy. Las respuestas te llegan en
**Netlify → Forms → diagnostico**. Para que además te lleguen por mail, andá a
*Forms → Settings → Form notifications* y agregá tu dirección.
