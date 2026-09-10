/* ==========================================================================
   FAYER — comportamiento del sitio. Sin dependencias.
   Regla: nada se mueve sin motivo, y todo respeta prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hayObs = 'IntersectionObserver' in window;

  function listo(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* --- Cabecera: el borde aparece sólo cuando hace falta separar ---------- */
  function cabecera() {
    var barra = document.querySelector('.barra');
    if (!barra) return;
    var estado = false;
    function ver() {
      var debe = window.scrollY > 6;
      if (debe !== estado) { estado = debe; barra.classList.toggle('pegada', debe); }
    }
    ver();
    window.addEventListener('scroll', ver, { passive: true });
  }

  /* --- Termómetro: la barra se llena al entrar en pantalla ---------------- */
  /* No es adorno: dibuja un dato (calor = valoración × ventas). Por eso
     se anima una sola vez, cuando el ojo la puede leer. */
  function termometros() {
    var barras = document.querySelectorAll('.calor');
    if (!barras.length) return;

    if (quieto || !hayObs) {
      barras.forEach(function (b) { b.classList.add('encendida'); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var b = en.target;
        // Un respiro antes de arrancar: si empieza en el borde no se ve.
        setTimeout(function () { b.classList.add('encendida'); }, 60 + Math.min(i * 40, 200));
        obs.unobserve(b);
      });
    }, { threshold: 0.4 });

    barras.forEach(function (b) { obs.observe(b); });
  }

  /* --- Filas del índice: entran escalonadas, una sola vez ----------------- */
  function apariciones() {
    var items = document.querySelectorAll('.aparece');
    if (!items.length) return;

    if (quieto || !hayObs) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.filter(function (en) { return en.isIntersecting; })
        .forEach(function (en, i) {
          en.target.style.transitionDelay = Math.min(i * 45, 240) + 'ms';
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    items.forEach(function (el) { obs.observe(el); });
  }

  /* --- Riel de categorías: marca en cuál estás mientras scrolleás --------- */
  /* Sirve para orientarse, que es justo lo que un catálogo largo necesita. */
  function riel() {
    var riel = document.querySelector('.riel');
    if (!riel || !hayObs) return;

    var enlaces = Array.prototype.slice.call(riel.querySelectorAll('a'));
    var bloques = enlaces
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    if (!bloques.length) return;

    function marcar(id) {
      enlaces.forEach(function (a) {
        var activo = a.getAttribute('href') === '#' + id;
        a.classList.toggle('aqui', activo);
        // Que la pastilla activa quede siempre a la vista dentro del riel.
        if (activo && riel.scrollWidth > riel.clientWidth) {
          var izq = a.offsetLeft - riel.clientWidth / 2 + a.offsetWidth / 2;
          riel.scrollTo({ left: izq, behavior: quieto ? 'auto' : 'smooth' });
        }
      });
    }

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) marcar(en.target.id);
      });
    }, { rootMargin: '-25% 0px -65% 0px' });

    bloques.forEach(function (b) { obs.observe(b); });
    marcar(bloques[0].id);
  }

  /* --- Galería: crossfade con desenfoque ---------------------------------- */
  /* Cambiar el src de golpe se ve como un corte entre dos imágenes.
     El blur las mezcla y el ojo lee una sola foto transformándose. */
  function galeria() {
    var minis = document.querySelectorAll('.miniaturas img');
    var principal = document.getElementById('foto-principal');
    if (!minis.length || !principal) return;

    minis.forEach(function (m) { new Image().src = m.src; });

    function cambiar(mini) {
      if (principal.src === mini.src) return;
      minis.forEach(function (i) { i.classList.remove('activa'); });
      mini.classList.add('activa');

      if (quieto) { principal.src = mini.src; return; }

      principal.classList.add('cambiando');
      var lista = new Image();
      lista.onload = function () {
        principal.src = mini.src;
        requestAnimationFrame(function () { principal.classList.remove('cambiando'); });
      };
      lista.src = mini.src;
    }

    minis.forEach(function (mini) {
      mini.addEventListener('click', function () { cambiar(mini); });
      mini.addEventListener('keydown', function (ev) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        cambiar(mini);
      });
    });
  }

  /* --- Preguntas: se abre una y se cierra la anterior --------------------- */
  function preguntas() {
    var items = document.querySelectorAll('.pregunta');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (otro) { if (otro !== item) otro.open = false; });
      });
    });
  }

  /* --- Botón "útil" ------------------------------------------------------- */
  function utiles() {
    var botones = document.querySelectorAll('.util');
    if (!botones.length) return;

    botones.forEach(function (btn) {
      var clave = 'fayer_util_' + btn.dataset.op;
      var base = parseInt(btn.dataset.base, 10) || 0;
      var n = btn.querySelector('.util-n');

      if (localStorage.getItem(clave) === '1') {
        btn.classList.add('marcado');
        n.textContent = base + 1;
      }

      btn.addEventListener('click', function () {
        if (btn.classList.contains('marcado')) {
          localStorage.removeItem(clave);
          btn.classList.remove('marcado');
          n.textContent = base;
        } else {
          localStorage.setItem(clave, '1');
          btn.classList.add('marcado');
          n.textContent = base + 1;
          if (!quieto) {
            n.classList.remove('salta');
            void n.offsetWidth;
            n.classList.add('salta');
          }
        }
      });
    });
  }

  /* --- Cookies ------------------------------------------------------------ */
  function cookies() {
    var CLAVE = 'fayer_cookie_consent';
    if (localStorage.getItem(CLAVE)) return;

    var caja = document.createElement('div');
    caja.id = 'fayer-cookies';
    caja.setAttribute('role', 'region');
    caja.setAttribute('aria-label', 'Aviso de cookies');
    caja.innerHTML =
      '<p>Usamos cookies propias para entender qué productos mirás. ' +
      '<a href="cookies.html">Más info</a>.</p>' +
      '<div class="cc-btns">' +
      '<button class="cc-no" type="button">Rechazar</button>' +
      '<button class="cc-si" type="button">Aceptar</button>' +
      '</div>';

    document.body.appendChild(caja);

    function cerrar(valor) {
      localStorage.setItem(CLAVE, valor);
      caja.classList.add('yendose');
      caja.addEventListener('transitionend', function () { caja.remove(); }, { once: true });
      setTimeout(function () { if (caja.parentNode) caja.remove(); }, 420);
    }
    caja.querySelector('.cc-si').addEventListener('click', function () { cerrar('accepted'); });
    caja.querySelector('.cc-no').addEventListener('click', function () { cerrar('rejected'); });
  }

  listo(function () {
    cabecera();
    termometros();
    apariciones();
    riel();
    galeria();
    preguntas();
    utiles();
    cookies();
  });
})();
