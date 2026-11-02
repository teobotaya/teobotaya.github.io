/* Portfolio de Teo Matias Botaya: tema, proyectos como slides, vista previa
   del indice, reloj y copiar el mail. Sin dependencias. Todo lo que mueve
   cosas se apaga con prefers-reduced-motion, y sin JavaScript la pagina se
   lee entera de arriba a abajo. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)');
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function cada(lista, fn) { Array.prototype.forEach.call(lista, fn); }

  /* ---------- Tema: auto, claro u oscuro ---------- */
  var temaBtn = document.querySelector('[data-tema-btn]');
  var temaTxt = document.querySelector('[data-tema-txt]');
  var NOMBRE = { sistema: 'Auto', claro: 'Claro', oscuro: 'Oscuro' };
  var SIGUIENTE = { sistema: 'claro', claro: 'oscuro', oscuro: 'sistema' };
  var tema = raiz.getAttribute('data-tema') || 'sistema';

  function aplicarTema(t, guardar) {
    tema = t;
    if (t === 'sistema') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', t);
    temaTxt.textContent = NOMBRE[t];
    temaBtn.title = 'Cambiar a ' + NOMBRE[SIGUIENTE[t]].toLowerCase();
    if (guardar) { try { localStorage.setItem('tema', t); } catch (e) {} }
  }
  aplicarTema(tema, false);
  temaBtn.addEventListener('click', function () { aplicarTema(SIGUIENTE[tema], true); });

  /* ---------- Barra: borde al bajar y seccion actual ---------- */
  var barra = document.querySelector('.barra');
  var enlacesNav = document.querySelectorAll('.barra-nav a');
  function bordeBarra() { barra.classList.toggle('con-borde', scrollY > 8); }

  if ('IntersectionObserver' in window) {
    var porId = {};
    cada(enlacesNav, function (a) { porId[a.getAttribute('href').slice(1)] = a; });
    var vigia = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        cada(enlacesNav, function (a) { a.removeAttribute('aria-current'); });
        var a = porId[en.target.id];
        if (a) a.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    /* La portada tambien se vigila, para que arriba de todo no quede
       marcada la ultima seccion que se vio. */
    porId.inicio = null;
    Object.keys(porId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) vigia.observe(s);
    });

    /* Aparicion suave de lo que entra en pantalla, una sola vez. */
    var aparece = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visto'); aparece.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    cada(document.querySelectorAll('.aparece, .slide'), function (el) { aparece.observe(el); });
  } else {
    cada(document.querySelectorAll('.aparece, .slide'), function (el) { el.classList.add('visto'); });
  }

  /* ---------- Proyectos: el scroll vertical mueve una pista horizontal ---------- */
  var carril = document.querySelector('[data-carril]');
  var pista = document.querySelector('[data-pista]');
  var escena = document.querySelector('[data-escena]');
  var slides = Array.prototype.slice.call(pista.querySelectorAll('.slide'));
  var N = slides.length;
  var regla = document.querySelector('[data-regla]');
  var cursor = document.querySelector('[data-cursor]');
  var numEl = document.querySelector('[data-num]');
  var nombreEl = document.querySelector('[data-nombre-actual]');
  var flechas = document.querySelectorAll('[data-ir]');
  var mqFijo = matchMedia('(min-width: 1024px) and (min-height: 660px) and (prefers-reduced-motion: no-preference)');
  var fijo = false;
  var activo = -1;
  var pedido = false;
  var cambioNombre = 0;

  regla.style.setProperty('--n', N);
  slides.forEach(function (s, k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', dos(k + 1) + ' · ' + s.getAttribute('data-nombre'));
    b.addEventListener('click', function () { ir(k); });
    regla.insertBefore(b, cursor);
  });
  var marcas = regla.querySelectorAll('button');

  /* Cada tramo de scroll tiene una meseta al principio y al final: la slide
     se queda quieta un rato y despues viaja con una curva suave. Se siente
     como un encastre, pero el scroll nunca se le quita a la persona. */
  function suave(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function recorrido() { return Math.max(1, carril.offsetHeight - innerHeight); }
  function posicion() {
    var p = clamp(-carril.getBoundingClientRect().top / recorrido(), 0, 1);
    var bruto = p * (N - 1);
    var i = Math.min(Math.floor(bruto), N - 2);
    return i + suave(clamp((bruto - i - 0.2) / 0.6, 0, 1));
  }

  function marcarActivo(a) {
    activo = a;
    numEl.textContent = dos(a + 1);
    var nombre = slides[a].getAttribute('data-nombre');
    clearTimeout(cambioNombre);
    if (reducido.matches) { nombreEl.textContent = nombre; }
    else {
      nombreEl.classList.add('cambia');
      cambioNombre = setTimeout(function () {
        nombreEl.textContent = nombre;
        nombreEl.classList.remove('cambia');
      }, 160);
    }
    cada(marcas, function (m, k) {
      if (k === a) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current');
    });
    flechas[0].setAttribute('aria-disabled', String(a === 0));
    flechas[1].setAttribute('aria-disabled', String(a === N - 1));
  }

  function pintar() {
    pedido = false;
    bordeBarra();
    if (!fijo) return;
    var x = posicion();
    pista.style.transform = 'translate3d(' + (-x * 100).toFixed(3) + '%,0,0)';
    for (var k = 0; k < N; k++) {
      var dk = clamp(k - x, -1, 1);
      slides[k].style.setProperty('--d', dk.toFixed(4));
      slides[k].style.setProperty('--ad', Math.abs(dk).toFixed(4));
    }
    cursor.style.setProperty('--x', x.toFixed(4));
    var a = Math.round(x);
    if (a !== activo) marcarActivo(a);
  }
  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } }

  function ir(k, sinAnimar) {
    k = clamp(k, 0, N - 1);
    var comportamiento = sinAnimar || reducido.matches ? 'auto' : 'smooth';
    if (!fijo) { slides[k].scrollIntoView({ behavior: comportamiento, block: 'start' }); return; }
    var arriba = carril.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: Math.round(arriba + (k / (N - 1)) * recorrido()), behavior: comportamiento });
  }

  function cambiarModo() {
    fijo = mqFijo.matches;
    raiz.classList.toggle('fijo', fijo);
    if (!fijo) {
      pista.style.transform = '';
      slides.forEach(function (s) { s.style.removeProperty('--d'); s.style.removeProperty('--ad'); });
    }
    activo = -1;
    pedir();
  }
  if (mqFijo.addEventListener) mqFijo.addEventListener('change', cambiarModo);
  else mqFijo.addListener(cambiarModo);
  cambiarModo();

  addEventListener('scroll', pedir, { passive: true });
  addEventListener('resize', pedir);

  cada(flechas, function (b) {
    b.addEventListener('click', function () {
      if (b.getAttribute('aria-disabled') === 'true') return;
      ir(activo + Number(b.getAttribute('data-ir')));
    });
  });

  /* Con el teclado: si el foco entra a una slide que no se ve, se va hasta
     ella; y las flechas del teclado pasan de proyecto mientras la escena
     ocupa la pantalla. */
  escena.addEventListener('focusin', function (e) {
    if (!fijo) return;
    var s = e.target.closest('.slide');
    if (!s) return;
    var k = slides.indexOf(s);
    /* El navegador hace su propio scroll para mostrar el foco despues de
       este evento; se espera un cuadro para que el nuestro quede ultimo. */
    requestAnimationFrame(function () { if (k !== Math.round(posicion())) ir(k, true); });
  });
  document.addEventListener('keydown', function (e) {
    if (!fijo || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var t = e.target;
    if (t !== document.body && !escena.contains(t)) return;
    var r = carril.getBoundingClientRect();
    if (r.top > 1 || r.bottom < innerHeight - 1) return;
    e.preventDefault();
    ir(activo + (e.key === 'ArrowRight' ? 1 : -1));
  });

  /* Los enlaces a un proyecto (#p-...) llevan a su slide, no al principio del carril. */
  var porSlide = {};
  slides.forEach(function (s, k) { porSlide[s.id] = k; });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#p-"]');
    if (!a || !fijo) return;
    var k = porSlide[a.getAttribute('href').slice(1)];
    if (k === undefined) return;
    e.preventDefault();
    ir(k);
    history.pushState(null, '', a.getAttribute('href'));
  });
  addEventListener('load', function () {
    var k = porSlide[location.hash.slice(1)];
    if (fijo && k !== undefined) ir(k, true);
  });

  /* ---------- Vista previa que sigue al cursor sobre el indice ---------- */
  var espia = document.querySelector('[data-espia-caja]');
  var indice = document.querySelector('[data-indice]');
  var mqEspia = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)');
  if (espia && indice) {
    var fotos = espia.querySelectorAll('img');
    var mx = 0, my = 0, ex = 0, ey = 0;
    var dentro = false, corriendo = false;

    /* Persecucion con amortiguamiento critico: cada cuadro recorre una
       fraccion fija de lo que falta, y la inclinacion sale de la velocidad. */
    function paso() {
      var nx = ex + (mx - ex) * 0.17;
      var ny = ey + (my - ey) * 0.17;
      var vx = nx - ex;
      ex = nx; ey = ny;
      var ancho = espia.offsetWidth;
      var izq = ex + 28 + ancho > innerWidth - 16 ? ex - 28 - ancho : ex + 28;
      espia.style.transform = 'translate3d(' + izq.toFixed(1) + 'px,' + (ey - 120).toFixed(1) + 'px,0) rotate(' + clamp(vx * 0.3, -5, 5).toFixed(2) + 'deg)';
      if (dentro || Math.abs(mx - ex) + Math.abs(my - ey) > 0.5) requestAnimationFrame(paso);
      else corriendo = false;
    }
    indice.addEventListener('pointermove', function (e) {
      if (!mqEspia.matches || e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (!dentro) { dentro = true; ex = mx; ey = my; espia.classList.add('activa'); }
      if (!corriendo) { corriendo = true; requestAnimationFrame(paso); }
    });
    indice.addEventListener('pointerleave', function () {
      dentro = false;
      espia.classList.remove('activa');
    });
    cada(indice.querySelectorAll('[data-espia]'), function (a) {
      a.addEventListener('pointerenter', function () {
        var k = Number(a.getAttribute('data-espia'));
        cada(fotos, function (f, j) { f.classList.toggle('ver', j === k); });
      });
    });
  }

  /* ---------- Reloj de Buenos Aires en el pie ---------- */
  var reloj = document.querySelector('[data-reloj]');
  var hora = document.querySelector('[data-hora]');
  try {
    var formato = new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires'
    });
    var tic = function () {
      var ahora = new Date();
      hora.textContent = formato.format(ahora);
      hora.setAttribute('datetime', ahora.toISOString());
    };
    tic();
    reloj.hidden = false;
    setInterval(tic, 15000);
  } catch (e) {}

  /* ---------- Copiar el mail ---------- */
  var copiar = document.querySelector('[data-copiar]');
  var estado = document.querySelector('[data-copiar-estado]');
  if (copiar) {
    var volver = 0;
    var listo = function (ok) {
      copiar.textContent = ok ? 'Copiado' : 'No se pudo copiar';
      estado.textContent = ok ? 'Mail copiado al portapapeles' : 'No se pudo copiar el mail';
      clearTimeout(volver);
      volver = setTimeout(function () { copiar.textContent = 'Copiar'; estado.textContent = ''; }, 2200);
    };
    var aMano = function (texto) {
      var t = document.createElement('textarea');
      t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
      listo(ok);
    };
    copiar.addEventListener('click', function () {
      var texto = copiar.getAttribute('data-copiar');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(function () { listo(true); }, function () { aMano(texto); });
      } else aMano(texto);
    });
  }

  pedir();
})();
