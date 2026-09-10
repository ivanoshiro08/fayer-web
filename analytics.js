/* ==========================================================================
   FAYER — analítica
   Una sola capa que reparte a GA4 y al Pixel de TikTok, respetando el
   consentimiento de cookies. Si el visitante rechaza, no se dispara nada.
   ========================================================================== */
(function () {
  'use strict';

  /* --- Configuración ---------------------------------------------------- */
  var GA4 = 'G-JHRBRHRYED';   // ← reemplazar por el ID real de GA4

  /* Si algún día querés que el pixel dispare siempre (sin esperar la
     decisión de cookies), poné esto en true. Ojo: legalmente es más flojo. */
  var SIEMPRE_ACTIVO = true;

  var CLAVE = 'fayer_cookie_consent';
  var cola = [];
  var arrancado = false;

  function decision() { return localStorage.getItem(CLAVE); }
  function permitido() { return SIEMPRE_ACTIVO || decision() === 'accepted'; }

  /* --- Carga de GA4 (sólo si hay permiso) -------------------------------- */
  function cargarGA4() {
    if (window.gtag || GA4.indexOf('X') !== -1) return;   // sin ID real, no molesta
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA4, { send_page_view: true, anonymize_ip: true });
  }

  /* --- Envío ------------------------------------------------------------- */
  function enviar(evento, datos) {
    datos = datos || {};
    if (window.gtag) gtag('event', evento, datos);

    // El pixel de TikTok sólo recibe los dos eventos que le importan al
    // algoritmo. Llenarlo de eventos custom le ensucia la optimización.
    if (window.ttq) {
      if (evento === 've_ficha') {
        ttq.track('ViewContent', tiktokItem(datos));
      } else if (evento === 'click_comprar') {
        ttq.track('ClickButton', tiktokItem(datos));
      }
    }
  }

  function tiktokItem(d) {
    return {
      content_id: d.item_id || '',
      content_name: d.item_name || '',
      content_type: 'product',
      currency: 'ARS',
      value: d.value || 0
    };
  }

  function track(evento, datos) {
    if (!permitido()) { cola.push([evento, datos]); return; }
    if (!arrancado) { arrancado = true; cargarGA4(); }
    enviar(evento, datos);
  }

  /* Si acepta después de haber navegado un rato, mandamos lo acumulado. */
  function liberarCola() {
    if (!permitido()) { cola.length = 0; return; }
    if (!arrancado) { arrancado = true; cargarGA4(); }
    cola.splice(0).forEach(function (par) { enviar(par[0], par[1]); });
  }

  window.fayer = { track: track, liberarCola: liberarCola, permitido: permitido };

  /* --- Datos de la página ------------------------------------------------ */
  function itemDePagina() {
    var el = document.getElementById('fayer-item');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function paramsItem(it) {
    return {
      item_id: 'producto-' + it.id,
      item_name: it.nombre,
      item_category: it.cat,
      price: it.precio,
      value: it.precio,
      currency: 'ARS',
      calor: it.calor,
      rank: it.rank
    };
  }

  /* --- Instrumentación ---------------------------------------------------- */
  function arrancar() {
    var item = itemDePagina();

    /* 1. Ficha vista */
    if (item) track('ve_ficha', paramsItem(item));

    /* 2. Listado visto (home o catálogo) */
    var filas = document.querySelectorAll('.fila[data-producto]');
    if (filas.length) {
      track('ve_listado', {
        item_list_name: document.body.dataset.lista || 'indice',
        cantidad: filas.length
      });
    }

    /* 3. Click en una fila del índice — con la posición, para saber si
          la gente sólo toca los primeros o baja de verdad. */
    filas.forEach(function (f) {
      f.addEventListener('click', function () {
        track('elige_producto', {
          item_id: 'producto-' + f.dataset.producto,
          item_name: f.dataset.nombre || '',
          item_category: f.dataset.cat || '',
          index: parseInt(f.dataset.rank, 10) || 0,
          item_list_name: document.body.dataset.lista || 'indice'
        });
      });
    });

    /* 4. EL EVENTO QUE IMPORTA: salida a Mercado Libre */
    document.querySelectorAll('a[href*="meli.la"]').forEach(function (a) {
      a.addEventListener('click', function () {
        track('click_comprar', item ? paramsItem(item) : {});
      });
    });

    /* 5. Profundidad de scroll — responde "¿llegan al índice o se van?" */
    var hitos = [25, 50, 75, 90], vistos = {};
    function medirScroll() {
      var alto = document.documentElement.scrollHeight - window.innerHeight;
      if (alto < 200) return;
      var pct = (window.scrollY / alto) * 100;
      hitos.forEach(function (h) {
        if (pct >= h && !vistos[h]) {
          vistos[h] = true;
          track('scroll', { percent_scrolled: h });
        }
      });
    }
    window.addEventListener('scroll', medirScroll, { passive: true });

    /* 6. Señales de interés real dentro de la ficha */
    document.querySelectorAll('.miniaturas img').forEach(function (m) {
      m.addEventListener('click', function () {
        track('mira_fotos', item ? { item_id: 'producto-' + item.id } : {});
      }, { once: true });
    });

    /* Qué preguntan antes de comprar = qué duda les frena la compra */
    document.querySelectorAll('.pregunta').forEach(function (p) {
      p.addEventListener('toggle', function () {
        if (!p.open) return;
        var q = p.querySelector('summary span');
        track('abre_pregunta', {
          pregunta: q ? q.textContent.trim().slice(0, 90) : '',
          item_id: item ? 'producto-' + item.id : ''
        });
      });
    });

    /* 7. Qué categorías navegan en el catálogo */
    document.querySelectorAll('.riel a').forEach(function (a) {
      a.addEventListener('click', function () {
        track('filtra_categoria', { categoria: a.textContent.trim() });
      });
    });

    /* 8. Tiempo con la ficha abierta: distingue mirar de pasar de largo */
    if (item) {
      var desde = Date.now();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'hidden') return;
        var seg = Math.round((Date.now() - desde) / 1000);
        if (seg >= 3 && seg < 1800) {
          track('tiempo_en_ficha', { segundos: seg, item_id: 'producto-' + item.id });
        }
      }, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
