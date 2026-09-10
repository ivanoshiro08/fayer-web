/* ==========================================================================
   Fayer — comportamiento compartido de todo el sitio.
   Sin dependencias. Todo respeta prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  // Marca que hay JS: el CSS sólo esconde cosas para animarlas si esto existe,
  // así sin JS la página se ve entera igual.
  document.documentElement.classList.add('js');

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function alCargar(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* --- 1. Borde del header sólo cuando scrolleás ------------------------ */
  function headerPegajoso() {
    var head = document.querySelector('header, .topbar');
    if (!head) return;

    var pegado = false;
    function revisar() {
      var deberia = window.scrollY > 8;
      if (deberia !== pegado) {
        pegado = deberia;
        head.classList.toggle('is-stuck', pegado);
      }
    }
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
  }

  /* --- 2. Aparición escalonada de las tarjetas -------------------------- */
  function revelar() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (quieto || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('shown'); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      // Las que entran juntas se escalonan entre sí, no todas de una.
      var visibles = entradas.filter(function (e) { return e.isIntersecting; });
      visibles.forEach(function (e, i) {
        var el = e.target;
        el.style.transitionDelay = Math.min(i * 45, 260) + 'ms';
        el.classList.add('shown');
        obs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    items.forEach(function (el) { obs.observe(el); });
  }

  /* --- 3. Galería: crossfade con desenfoque ----------------------------- */
  /* Cambiar el src de golpe se ve como un corte. El blur tapa el salto y
     hace que se lea como una sola imagen transformándose. */
  function galeria() {
    var thumbs = document.querySelectorAll('.gallery-thumbs img');
    if (!thumbs.length) return;

    // Precargamos para que el cambio sea instantáneo al tocar.
    thumbs.forEach(function (t) { new Image().src = t.src; });

    thumbs.forEach(function (thumb) {
      // Son role="button": Enter y Espacio tienen que funcionar igual que el click.
      thumb.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        thumb.click();
      });

      thumb.addEventListener('click', function () {
        var contenedor = thumb.closest('.hero-col') || document;
        var principal = contenedor.querySelector('.hero img');
        if (!principal || principal.src === thumb.src) return;

        thumb.parentElement.querySelectorAll('img').forEach(function (i) {
          i.classList.remove('active');
        });
        thumb.classList.add('active');

        if (quieto) { principal.src = thumb.src; return; }

        principal.classList.add('swapping');
        var listo = new Image();
        listo.onload = function () {
          principal.src = thumb.src;
          requestAnimationFrame(function () {
            principal.classList.remove('swapping');
          });
        };
        listo.src = thumb.src;
      });
    });
  }

  /* --- 4. FAQ: cerrar la anterior al abrir una nueva -------------------- */
  function acordeon() {
    var items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (otro) {
          if (otro !== item) otro.open = false;
        });
      });
    });
  }

  /* --- 5. Botón "Útil" de las reseñas ----------------------------------- */
  function likes() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.review-like-btn');
      if (!btn) return;

      var id = btn.dataset.reviewId;
      var base = parseInt(btn.dataset.base, 10) || 0;
      var clave = 'fayer_review_like_' + id;
      var contador = btn.querySelector('.review-like-count');
      var yaEstaba = localStorage.getItem(clave) === '1';

      if (yaEstaba) {
        localStorage.removeItem(clave);
        btn.classList.remove('liked');
        contador.textContent = base;
      } else {
        localStorage.setItem(clave, '1');
        btn.classList.add('liked');
        contador.textContent = base + 1;
        if (!quieto) {
          contador.classList.remove('bump');
          void contador.offsetWidth; // reinicia la animación
          contador.classList.add('bump');
        }
      }
    });

    // Restaurar el estado guardado al cargar.
    document.querySelectorAll('.review-like-btn').forEach(function (btn) {
      if (localStorage.getItem('fayer_review_like_' + btn.dataset.reviewId) !== '1') return;
      btn.classList.add('liked');
      var contador = btn.querySelector('.review-like-count');
      if (contador) contador.textContent = (parseInt(btn.dataset.base, 10) || 0) + 1;
    });
  }

  /* --- 6. Banner de cookies -------------------------------------------- */
  function cookies() {
    var CLAVE = 'fayer_cookie_consent';
    if (localStorage.getItem(CLAVE)) return;

    var barra = document.createElement('div');
    barra.id = 'fayer-cookie-bar';
    barra.setAttribute('role', 'region');
    barra.setAttribute('aria-label', 'Aviso de cookies');
    barra.innerHTML =
      '<p>Usamos cookies propias para mejorar tu navegación. ' +
      '<a href="cookies.html">Más información</a>.</p>' +
      '<div class="fc-actions">' +
      '<button class="fc-reject" type="button">Rechazar</button>' +
      '<button class="fc-accept" type="button">Aceptar</button>' +
      '</div>';

    document.body.appendChild(barra);

    function cerrar(valor) {
      localStorage.setItem(CLAVE, valor);
      barra.classList.add('leaving');
      barra.addEventListener('transitionend', function () { barra.remove(); }, { once: true });
      setTimeout(function () { if (barra.parentNode) barra.remove(); }, 400);
    }

    barra.querySelector('.fc-accept').addEventListener('click', function () { cerrar('accepted'); });
    barra.querySelector('.fc-reject').addEventListener('click', function () { cerrar('rejected'); });
  }

  alCargar(function () {
    headerPegajoso();
    revelar();
    galeria();
    acordeon();
    likes();
    cookies();
  });
})();
