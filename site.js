/* Fayer — banner de cookies (localStorage, sin dependencias) */
(function () {
  var KEY = 'fayer_cookie_consent';
  if (localStorage.getItem(KEY)) return;

  var bar = document.createElement('div');
  bar.id = 'fayer-cookie-bar';
  bar.innerHTML =
    '<style>' +
    '#fayer-cookie-bar{position:fixed;left:0;right:0;bottom:0;z-index:999;' +
    'background:#161616;border-top:1px solid rgba(255,255,255,0.1);' +
    'padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;' +
    'justify-content:space-between;gap:12px;' +
    'font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}' +
    '#fayer-cookie-bar p{margin:0;font-size:.82rem;line-height:1.4;color:#C9C6C0;flex:1;min-width:220px;}' +
    '#fayer-cookie-bar a{color:#FF6A1A;text-decoration:underline;}' +
    '#fayer-cookie-bar .fc-actions{display:flex;gap:10px;flex-shrink:0;}' +
    '#fayer-cookie-bar button{border:none;cursor:pointer;font-weight:600;' +
    'font-size:.82rem;padding:10px 16px;border-radius:8px;font-family:inherit;}' +
    '#fayer-cookie-bar .fc-accept{background:#FF6A1A;color:#0A0A0A;}' +
    '#fayer-cookie-bar .fc-reject{background:transparent;color:#9A9791;border:1px solid rgba(255,255,255,0.15) !important;}' +
    '@media(max-width:480px){#fayer-cookie-bar{padding:14px 16px;}}' +
    '</style>' +
    '<p>Usamos cookies propias para mejorar tu experiencia de navegación. ' +
    '<a href="cookies.html">Más información</a>.</p>' +
    '<div class="fc-actions">' +
    '<button class="fc-reject" id="fc-reject">Rechazar</button>' +
    '<button class="fc-accept" id="fc-accept">Aceptar</button>' +
    '</div>';

  document.body.appendChild(bar);

  document.getElementById('fc-accept').onclick = function () {
    localStorage.setItem(KEY, 'accepted');
    bar.remove();
  };
  document.getElementById('fc-reject').onclick = function () {
    localStorage.setItem(KEY, 'rejected');
    bar.remove();
  };
})();
