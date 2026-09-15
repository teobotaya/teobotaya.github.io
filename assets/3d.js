/* ---------------------------------------------------------------------------
   Movimiento, segun los principios de interfaz fluida de Apple (WWDC 2018):
   respuesta al apretar y no al soltar, seguimiento 1:1, resortes en vez de
   duraciones fijas, e interrupciones que arrancan del valor que se ve.
   Sin librerias: el integrador de resorte son veinte lineas mas abajo.
   --------------------------------------------------------------------------- */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const mq = (q) => matchMedia(q).matches;
  const quieto = mq('(prefers-reduced-motion: reduce)');

  /* ========================================================== 1. el resorte

     Un resorte no tiene duracion: el tiempo de asentamiento sale de los
     parametros. Se describe con los dos que usa Apple —respuesta (que tan
     rapido llega, en segundos) y amortiguacion (1 = sin rebote)— porque son
     los que un ojo humano puede predecir. Lo importante es que siempre parte
     del valor actual y acepta un objetivo nuevo sin cortar la velocidad: eso
     es lo que permite agarrar algo en movimiento y darlo vuelta sin saltos. */
  class Resorte {
    constructor(valor, respuesta = 0.4, amortiguacion = 1) {
      this.v = valor; this.objetivo = valor; this.vel = 0;
      this.respuesta = respuesta; this.amortiguacion = amortiguacion;
    }
    a(objetivo, velocidad) {
      this.objetivo = objetivo;
      if (velocidad !== undefined) this.vel = velocidad;
    }
    paso(dt) {
      const w = (2 * Math.PI) / this.respuesta;
      const acel = -w * w * (this.v - this.objetivo) - 2 * this.amortiguacion * w * this.vel;
      this.vel += acel * dt;
      this.v += this.vel * dt;
      return this.v;
    }
    get quieto() {
      return Math.abs(this.v - this.objetivo) < 0.001 && Math.abs(this.vel) < 0.001;
    }
    asentar() { this.v = this.objetivo; this.vel = 0; }
  }

  /* Un solo reloj sincronizado con la pantalla para todo lo que se mueve. */
  const animados = new Set();
  let ultimo = 0, corriendo = false;
  function reloj(t) {
    const dt = Math.min((t - ultimo) / 1000, 1 / 30);
    ultimo = t;
    for (const f of animados) if (f(dt) === false) animados.delete(f);
    corriendo = animados.size > 0;
    if (corriendo) requestAnimationFrame(reloj);
  }
  function animar(f) {
    animados.add(f);
    if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(reloj); }
  }

  /* Proyeccion de impulso, tal como la publica Apple en el codigo de ejemplo
     de Designing Fluid Interfaces: adonde va a terminar el gesto si lo dejo
     desacelerar solo. No es la formula del libro de fisica. */
  const proyectar = (vel, deceleracion = 0.998) => (vel / 1000) * deceleracion / (1 - deceleracion);

  /* Resistencia progresiva en los bordes: nada se frena de golpe. */
  const gomita = (exceso, largo, k = 0.55) =>
    (exceso * largo * k) / (largo + k * Math.abs(exceso));

  const limitar = (x, min, max) => (x < min ? min : x > max ? max : x);

  /* ========================================================== 2. el teclado */
  const TECLAS = [
    { t:'q', x:0,   r:0, l:'C#',      c:'#8B5CF6', n:'C#',                 g:'Backend',
      d:'El lenguaje del backend de Sports Complex Admin: 48 endpoints REST y 24 pruebas que corren en cada push.' },
    { t:'w', x:1,   r:0, l:'.NET',    c:'#6D46D9', n:'ASP.NET Core 8',     g:'Backend',
      d:'La API, el control de acceso por rol con JWT y la capa de servicios donde vive la lógica de negocio.' },
    { t:'e', x:2,   r:0, l:'EF',      c:'#4F46E5', n:'Entity Framework Core', g:'Backend',
      d:'El mapeo relacional y las migraciones del esquema. El modelo de dominio se escribe una vez y la base lo sigue.' },
    { t:'r', x:3,   r:0, l:'SQL',     c:'#DC2626', n:'SQL Server',         g:'Datos',
      d:'12 tablas. La regla de que dos reservas no se pisan vive acá, en el motor: un formulario se puede esquivar, una restricción no.' },
    { t:'t', x:4,   r:0, l:'JWT',     c:'#DB2777', n:'JWT',                g:'Backend',
      d:'Autenticación por token y permisos resueltos por rol, verificados del lado del servidor en cada pedido.' },

    { t:'a', x:0.3, r:1, l:'TS',      c:'#2563EB', n:'TypeScript',         g:'Frontend',
      d:'Todo el frontend del backoffice y el plugin de Obsidian entero. Los tipos son la primera prueba que corre.' },
    { t:'s', x:1.3, r:1, l:'React',   c:'#0EA5E9', n:'React + React Router', g:'Frontend',
      d:'El backoffice completo: canchas, reservas, clientes, pagos, torneos y partidos, con las vistas separadas por rol.' },
    { t:'d', x:2.3, r:1, l:'Vite',    c:'#A855F7', n:'Vite y esbuild',     g:'Frontend',
      d:'Vite para el frontend, esbuild para el plugin: 29 kB de bundle final, sin dependencias en runtime.' },
    { t:'f', x:3.3, r:1, l:'CSS',     c:'#3B82F6', n:'CSS a mano',         g:'Frontend',
      d:'Diseño responsive escrito sin frameworks. Esta página incluida: el teclado que estás mirando son transformaciones 3D nativas.' },
    { t:'g', x:4.3, r:1, l:'test',    c:'#10B981', n:'xUnit y Vitest',     g:'Calidad',
      d:'24 pruebas del lado del backend y pruebas de componentes en el frontend. Lo que no se prueba, no se sabe si funciona.' },

    { t:'z', x:0.6, r:2, l:'Node',    c:'#16A34A', n:'Node.js',            g:'Herramientas propias',
      d:'Market Desk corre en Node sin una sola dependencia instalada: el servidor, el parseo y las métricas son código propio.' },
    { t:'x', x:1.6, r:2, l:'Docker',  c:'#0284C7', n:'Docker y Kubernetes', g:'Infraestructura',
      d:'Imagen multi-stage con las pruebas adentro del build, y un clúster kind de tres nodos en DevOps Lab: Deployment, Service, HPA, PodDisruptionBudget y RBAC acotado.' },
    { t:'c', x:2.6, r:2, l:'Git',     c:'#EA580C', n:'Git',                g:'Infraestructura',
      d:'Una rama por funcionalidad y un historial que se puede leer. Cada decisión de diseño queda fechada en el mensaje del commit.' },
    { t:'v', x:3.6, r:2, l:'CI',      c:'#64748B', n:'GitHub Actions',     g:'Infraestructura',
      d:'En cada push: pruebas, validación de los manifiestos con kubeconform y publicación de la imagen en GHCR para amd64 y arm64, etiquetada por commit.' },
    { t:'b', x:4.6, r:2, l:'SVG',     c:'#D97706', n:'SVG',                g:'Herramientas propias',
      d:'El mapa de Smart Atlas se dibuja nodo por nodo en SVG: sin canvas, sin WebGL y sin motor de gráficos de terceros.' },

    { t:'n', x:0,   r:3, w:1.4, l:'Obsidian', c:'#7C3AED', n:'Obsidian Plugin API', g:'Herramientas propias',
      d:'Vistas laterales, modales y pestaña de ajustes. Smart Atlas se integra con Smart Connections y, si no está, arma su propio índice.' },
    { t:' ', x:1.6, r:3, w:2.2, l:'0 deps',   c:'#334155', n:'Cero dependencias', g:'Decisión de diseño',
      d:'Un plugin de 29 kB con el álgebra lineal escrita a mano —k-means, PCA, proyección aleatoria— y un servidor Node que no instala nada. Menos superficie que mantener y nada que se rompa solo.' },
    { t:'m', x:4.0, r:3, w:1.4, l:'Mermaid',  c:'#0D9488', n:'UML y Mermaid',  g:'Análisis y diseño',
      d:'Casos de uso, diagramas de secuencia y modelo relacional, versionados como texto junto al código que describen.' },
  ];

  const placa = document.getElementById('kbd');
  const ficha = document.getElementById('kbd-info');

  if (placa && ficha) {
    const porTecla = new Map();
    let apretada = null;
    const campos = {
      punto: ficha.querySelector('.kbd-dot'),
      nombre: ficha.querySelector('h3'),
      grupo: ficha.querySelector('.kbd-grp'),
      texto: ficha.querySelector('p'),
    };

    const orden = [];
    TECLAS.forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'key';
      b.type = 'button';
      /* Tabulacion itinerante: 18 teclas serian 18 paradas de tabulador antes
         de poder seguir leyendo. El grupo entero es una sola parada y las
         flechas se mueven adentro, que es el patron esperado en una grilla. */
      b.tabIndex = i === 0 ? 0 : -1;
      b.style.cssText = `--x:${k.x};--r:${k.r};--w:${k.w || 1};--kc:${k.c}`;
      b.setAttribute('aria-label', `${k.n} — ${k.g}`);
      b.innerHTML =
        '<span class="s s-f"></span><span class="s s-b"></span>' +
        '<span class="s s-r"></span><span class="s s-l"></span>' +
        `<span class="cap"><b>${k.l}</b><i>${k.t === ' ' ? '␣' : k.t.toUpperCase()}</i></span>`;

      /* Apple, regla uno: la respuesta va en el apretar, no en el soltar.
         Esperar al click deja la tecla muerta durante todo el gesto. */
      /* La tecla no captura el puntero: la captura la toma la placa, para
         que un arrastre que empieza sobre una tecla siga siendo un arrastre
         y no quede atrapado en el boton. */
      b.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        hundir(k, b);
        apretada = b;
      });
      /* El teclado fisico y los lectores de pantalla siguen usando el click. */
      b.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); hundir(k, b); }
      });
      b.addEventListener('keyup', () => soltar(b));

      placa.appendChild(b);
      porTecla.set(k.t, { k, b });
      orden.push({ k, b });
    });

    function hundir(k, b) {
      orden.forEach((o) => o.b.removeAttribute('aria-current'));
      b.setAttribute('aria-current', 'true');
      campos.punto.style.setProperty('--kc', k.c);
      campos.nombre.textContent = k.n;
      campos.grupo.textContent = k.g;
      campos.texto.textContent = k.d;
      ficha.style.setProperty('--kc', k.c);
      b.classList.add('down');
    }
    const soltar = (b) => b.classList.remove('down');

    /* Las flechas recorren la grilla: arriba y abajo saltan de fila buscando
       la tecla mas cercana en horizontal, que es como la lee el ojo. */
    const irA = (destino) => {
      if (!destino) return;
      orden.forEach((o) => { o.b.tabIndex = -1; });
      destino.b.tabIndex = 0;
      destino.b.focus();
      hundir(destino.k, destino.b);
      setTimeout(() => soltar(destino.b), 160);
    };
    placa.addEventListener('keydown', (ev) => {
      const i = orden.findIndex((o) => o.b === ev.target);
      if (i < 0) return;
      const yo = orden[i];
      let destino = null;
      if (ev.key === 'ArrowRight') destino = orden[i + 1];
      else if (ev.key === 'ArrowLeft') destino = orden[i - 1];
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        const fila = yo.k.r + (ev.key === 'ArrowDown' ? 1 : -1);
        const candidatas = orden.filter((o) => o.k.r === fila);
        if (candidatas.length) {
          const centro = yo.k.x + (yo.k.w || 1) / 2;
          destino = candidatas.reduce((mejor, o) =>
            Math.abs(o.k.x + (o.k.w || 1) / 2 - centro) <
            Math.abs(mejor.k.x + (mejor.k.w || 1) / 2 - centro) ? o : mejor);
        }
      }
      else if (ev.key === 'Home') destino = orden[0];
      else if (ev.key === 'End') destino = orden[orden.length - 1];
      if (!destino) return;
      ev.preventDefault();
      irA(destino);
    });

    /* Una tecla fisica hunde la de la pantalla mientras esta apretada, y la
       suelta cuando el dedo se va: igual que un teclado de verdad. */
    const enCampo = (e) => e && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName);
    addEventListener('keydown', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey || ev.repeat || enCampo(document.activeElement)) return;
      const hit = porTecla.get(ev.key.toLowerCase());
      if (!hit) return;
      if (ev.key === ' ') ev.preventDefault();
      hundir(hit.k, hit.b);
    });
    addEventListener('keyup', (ev) => {
      const hit = porTecla.get(ev.key.toLowerCase());
      if (hit) soltar(hit.b);
    });

    /* ------------------------------------------------ la placa se agarra */
    const escenario = placa.parentElement;
    const BASE_X = 55, BASE_Z = -31, TOPE = 26, UMBRAL = 8;
    const rx = new Resorte(BASE_X), rz = new Resorte(BASE_Z);
    let arrastrando = false, pendiente = false, historia = [];
    let grabX = 0, grabZ = 0, origenX = 0, origenY = 0;

    const pintar = () => {
      placa.style.setProperty('--tx', (rx.v - BASE_X).toFixed(3) + 'deg');
      placa.style.setProperty('--tz', (rz.v - BASE_Z).toFixed(3) + 'deg');
    };
    const correr = () => animar((dt) => {
      if (arrastrando) return true;
      rx.paso(dt); rz.paso(dt); pintar();
      if (rx.quieto && rz.quieto) { rx.asentar(); rz.asentar(); pintar(); return false; }
      return true;
    });

    escenario.addEventListener('pointerdown', (ev) => {
      escenario.setPointerCapture(ev.pointerId);
      pendiente = !quieto;
      /* Se respeta desde donde la agarro: la placa no salta al centro. */
      origenX = ev.clientX; origenY = ev.clientY;
      grabZ = rz.v; grabX = rx.v;
      historia = [{ x: ev.clientX, y: ev.clientY, t: performance.now() }];
    });

    escenario.addEventListener('pointermove', (ev) => {
      if (quieto) return;

      /* Histeresis: hasta que el dedo no recorre unos pocos pixeles no se
         decide si esto era una tecla o un arrastre. Cuando se decide que es
         arrastre, la tecla apretada se cancela sola, como en iOS cuando uno
         se va del boton sin soltar. */
      if (pendiente && !arrastrando) {
        const d = Math.hypot(ev.clientX - origenX, ev.clientY - origenY);
        if (d < UMBRAL) return;
        arrastrando = true;
        placa.classList.add('agarrada');
        if (apretada) { soltar(apretada); apretada = null; }
      }

      if (!arrastrando) {
        if (ev.pointerType !== 'mouse') return;
        const r = escenario.getBoundingClientRect();
        rz.a(BASE_Z + ((ev.clientX - r.left) / r.width - .5) * 14);
        rx.a(BASE_X + ((ev.clientY - r.top) / r.height - .5) * -10);
        correr();
        return;
      }

      historia.push({ x: ev.clientX, y: ev.clientY, t: performance.now() });
      if (historia.length > 6) historia.shift();

      /* Seguimiento 1:1 mientras esta dentro del tope; pasado el tope, la
         gomita: cede cada vez menos en vez de frenar de golpe. */
      const conTope = (crudo, base) => {
        const d = crudo - base;
        const exceso = Math.abs(d) - TOPE;
        if (exceso <= 0) return crudo;
        return base + Math.sign(d) * (TOPE + gomita(exceso, TOPE));
      };
      rz.v = conTope(grabZ + (ev.clientX - origenX) * 0.26, BASE_Z);
      rx.v = conTope(grabX - (ev.clientY - origenY) * 0.20, BASE_X);
      rz.vel = rx.vel = 0;
      pintar();
    });

    const soltarTodo = (ev) => {
      pendiente = false;
      if (apretada) { soltar(apretada); apretada = null; }
      if (ev && ev.pointerId !== undefined && escenario.hasPointerCapture(ev.pointerId)) {
        escenario.releasePointerCapture(ev.pointerId);
      }
      if (!arrastrando) return;
      arrastrando = false;
      placa.classList.remove('agarrada');

      /* Velocidad medida sobre los ultimos milisegundos, no sobre el ultimo
         evento suelto, que es ruido. */
      const fin = historia[historia.length - 1];
      const ini = historia[0] || fin;
      const ms = Math.max(fin.t - ini.t, 1);
      const vz = ((fin.x - ini.x) / ms) * 1000 * 0.26;
      const vx = -((fin.y - ini.y) / ms) * 1000 * 0.20;

      /* Adonde iba el gesto si lo dejara desacelerar. La placa vuelve a su
         descanso, pero sale con la velocidad del dedo: sin costura entre
         arrastrar y animar. Rebota apenas, porque hubo impulso. */
      const destinoZ = limitar(BASE_Z + proyectar(vz) * 0.02, BASE_Z - 8, BASE_Z + 8);
      const destinoX = limitar(BASE_X + proyectar(vx) * 0.02, BASE_X - 6, BASE_X + 6);
      rz.respuesta = rx.respuesta = 0.45;
      rz.amortiguacion = rx.amortiguacion = 0.8;
      rz.a(destinoZ, vz); rx.a(destinoX, vx);
      correr();
      setTimeout(() => {
        rz.respuesta = rx.respuesta = 0.4;
        rz.amortiguacion = rx.amortiguacion = 1;
        rz.a(BASE_Z); rx.a(BASE_X); correr();
      }, 220);
    };
    escenario.addEventListener('pointerup', soltarTodo);
    escenario.addEventListener('pointercancel', soltarTodo);
    escenario.addEventListener('pointerleave', () => {
      if (arrastrando || quieto) return;
      rz.a(BASE_Z); rx.a(BASE_X); correr();
    });
    if (!quieto) escenario.style.touchAction = 'pan-y';

    /* Arrastrar no puede ser la unica forma de girar la placa: quien no puede
       sostener un arrastre —o navega con teclado— necesita el mismo control
       por otra via. Los botones mueven los mismos resortes que el dedo. */
    const mando = document.querySelector('.kbd-mando');
    if (mando) {
      const PASO = 9, LIMITE = 26;
      const fijar = (resorte, base, delta) => {
        const objetivo = delta === null
          ? base
          : limitar(resorte.objetivo + delta * PASO, base - LIMITE, base + LIMITE);
        resorte.respuesta = 0.4; resorte.amortiguacion = 1;
        resorte.a(objetivo);
        correr();
      };
      mando.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-reset')) { fijar(rz, BASE_Z, null); fijar(rx, BASE_X, null); return; }
        if (b.dataset.girar) fijar(rz, BASE_Z, +b.dataset.girar);
        if (b.dataset.inclinar) fijar(rx, BASE_X, +b.dataset.inclinar);
      });
    }
  }

  /* ============================================ 3. las tarjetas, con resorte

     X e Y llevan resortes independientes: un solo resorte sobre la distancia
     en dos dimensiones se desincroniza cuando cada eje trae otra velocidad. */
  if (!quieto) {
    document.querySelectorAll('.card,.ficha,.shot,.panel,.layer,.edu,.kbd-info,.stat').forEach((el) => {
      el.dataset.tilt = '';
      const sx = new Resorte(0), sy = new Resorte(0), sz = new Resorte(0);
      let vivo = false;
      const tick = (dt) => {
        sx.paso(dt); sy.paso(dt); sz.paso(dt);
        el.style.setProperty('--rx', sx.v.toFixed(3) + 'deg');
        el.style.setProperty('--ry', sy.v.toFixed(3) + 'deg');
        el.style.setProperty('--ty', sz.v.toFixed(2) + 'px');
        if (sx.quieto && sy.quieto && sz.quieto) { vivo = false; return false; }
        return true;
      };
      const arrancar = () => { if (!vivo) { vivo = true; animar(tick); } };

      el.addEventListener('pointermove', (ev) => {
        if (ev.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        sy.a((px - .5) * 9);
        sx.a((py - .5) * -7);
        sz.a(-5);
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        arrancar();
      });
      el.addEventListener('pointerleave', () => { sx.a(0); sy.a(0); sz.a(0); arrancar(); });
    });
  }

  /* ================================================ 4. entradas al scroll */
  const revelables = document.querySelectorAll(
    '.sec-title,.sec-intro,.eyebrow,.card,.carrusel,.split,.codeblock,.layer,.shot,.edu,.contact,.stats,.kbd-wrap,.stack-group,.cta-row,.hero-meta'
  );
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

  revelables.forEach((el) => {
    el.dataset.reveal = '';
    if (el.getBoundingClientRect().top < innerHeight * .92) { el.classList.add('in'); return; }
    const i = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--d', `${Math.min(i, 5) * 60}ms`);
    io.observe(el);
  });

  /* ======================================== 5. el hero y el borde del nav */
  const hero = document.getElementById('top');
  if (hero && !quieto) {
    const hx = new Resorte(0), hy = new Resorte(0);
    let vivo = false;
    const tick = (dt) => {
      hx.paso(dt); hy.paso(dt);
      hero.style.setProperty('--px', hx.v.toFixed(4));
      hero.style.setProperty('--py', hy.v.toFixed(4));
      if (hx.quieto && hy.quieto) { vivo = false; return false; }
      return true;
    };
    hero.addEventListener('pointermove', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      hx.a((ev.clientX - r.left) / r.width - .5);
      hy.a((ev.clientY - r.top) / r.height - .5);
      if (!vivo) { vivo = true; animar(tick); }
    });
    hero.addEventListener('pointerleave', () => { hx.a(0); hy.a(0); if (!vivo) { vivo = true; animar(tick); } });
  }

  /* El nav no lleva un borde fijo: el filo aparece solo cuando hay contenido
     pasando por debajo. Un divisor permanente separa donde no hay nada. */
  const nav = document.querySelector('.nav');
  if (nav) {
    const mirar = () => nav.classList.toggle('con-filo', scrollY > 8);
    mirar();
    addEventListener('scroll', mirar, { passive: true });
  }

  /* ====================================================== 6. el carrusel

     No avanza solo. Un carrusel que se mueve por su cuenta le saca la lectura
     de las manos al que esta leyendo, y obliga a poner un boton de pausa para
     devolversela; es mas simple no quitarsela nunca. Se arrastra, se desliza
     con la rueda, se maneja con los botones o con las flechas. El encastre lo
     hace el navegador con scroll-snap, que es mas suave que cualquier calculo
     nuestro y no pelea con el dedo. */
  document.querySelectorAll('[data-carrusel]').forEach((car) => {
    const pista = car.querySelector('.carrusel-pista');
    const items = [...pista.children];
    const atras = car.querySelector('[data-ir="-1"]');
    const adelante = car.querySelector('[data-ir="1"]');
    const pos = car.querySelector('.carrusel-pos');
    if (!pista || items.length < 2) { if (car.querySelector('.carrusel-mando')) car.querySelector('.carrusel-mando').hidden = true; return; }

    const base = items[0].offsetLeft;
    const donde = () => {
      let mejor = 0, dmin = Infinity;
      items.forEach((it, i) => {
        const d = Math.abs(it.offsetLeft - base - pista.scrollLeft);
        if (d < dmin) { dmin = d; mejor = i; }
      });
      return mejor;
    };
    const ir = (i) => {
      const n = Math.max(0, Math.min(i, items.length - 1));
      pista.scrollTo({ left: items[n].offsetLeft - base, behavior: quieto ? 'auto' : 'smooth' });
    };

    let pedido = 0;
    const HOLGURA = 8;
    const pintar = () => {
      /* Antes del layout ancho y desplazamiento valen cero, y con eso los dos
         botones nacerian apagados. Sin medida no se decide nada. */
      if (!pista.clientWidth) return;
      const i = donde();
      if (pos) pos.textContent = `${i + 1} / ${items.length}`;
      /* El boton que no lleva a ningun lado se apaga y deja de ser foco:
         un control que no hace nada es peor que no tenerlo. */
      const resto = pista.scrollWidth - pista.clientWidth;
      atras.disabled = pista.scrollLeft <= HOLGURA;
      adelante.disabled = resto <= HOLGURA || pista.scrollLeft >= resto - HOLGURA;
    };
    /* El primer pintado tiene que esperar a que exista el ancho real: si se
       mide antes del layout, la pista parece no desbordar y los dos botones
       nacen apagados. */
    pintar();
    requestAnimationFrame(pintar);
    addEventListener('load', pintar);
    if (window.ResizeObserver) new ResizeObserver(pintar).observe(pista);
    pista.addEventListener('scroll', () => {
      if (pedido) return;
      pedido = requestAnimationFrame(() => { pedido = 0; pintar(); });
    }, { passive: true });
    addEventListener('resize', pintar, { passive: true });

    atras.addEventListener('click', () => ir(donde() - 1));
    adelante.addEventListener('click', () => ir(donde() + 1));
    pista.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') { ev.preventDefault(); ir(donde() + 1); }
      else if (ev.key === 'ArrowLeft') { ev.preventDefault(); ir(donde() - 1); }
      else if (ev.key === 'Home') { ev.preventDefault(); ir(0); }
      else if (ev.key === 'End') { ev.preventDefault(); ir(items.length - 1); }
    });
  });

  /* =========================================== 7. donde estoy en la pagina

     Una navegacion que no dice donde estas obliga a adivinar. El enlace de la
     seccion visible queda marcado, y el nav se desliza para mostrarlo cuando
     la fila no entra entera en el telefono. */
  const enlaces = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const secciones = enlaces
    .map((a) => ({ a, sec: document.querySelector(a.getAttribute('href')) }))
    .filter((x) => x.sec);

  if (secciones.length) {
    let actual = null;
    const marcar = (a) => {
      if (a === actual) return;
      enlaces.forEach((x) => x.removeAttribute('aria-current'));
      if (a) {
        a.setAttribute('aria-current', 'true');
        const cont = a.parentElement;
        if (cont.scrollWidth > cont.clientWidth) {
          const r = a.getBoundingClientRect(), c = cont.getBoundingClientRect();
          if (r.left < c.left + 8 || r.right > c.right - 8) {
            cont.scrollTo({ left: a.offsetLeft - cont.clientWidth / 2 + a.offsetWidth / 2,
                            behavior: quieto ? 'auto' : 'smooth' });
          }
        }
      }
      actual = a;
    };
    const mirarSecciones = () => {
      const linea = innerHeight * 0.34;
      let elegida = null;
      for (const { a, sec } of secciones) {
        const r = sec.getBoundingClientRect();
        if (r.top <= linea && r.bottom > linea) elegida = a;
      }
      /* Al fondo de todo gana la ultima, aunque sea corta y no cruce la linea. */
      if (!elegida && scrollY + innerHeight >= document.body.scrollHeight - 4) {
        elegida = secciones[secciones.length - 1].a;
      }
      marcar(elegida);
    };
    mirarSecciones();
    addEventListener('scroll', mirarSecciones, { passive: true });
    addEventListener('resize', mirarSecciones, { passive: true });
  }

  /* ================================================== 8. numeros que suben */
  document.querySelectorAll('.stat-n').forEach((el) => {
    if (quieto) return;
    const m = el.textContent.trim().match(/^(\D*)([\d.,]+)(\D*)$/);
    if (!m) return;
    const [, pre, crudo, post] = m;
    const miles = /[.,]/.test(crudo);
    const fin = parseInt(crudo.replace(/[.,]/g, ''), 10);
    if (!isFinite(fin) || fin > 1e9) return;
    const fmt = (n) => (miles ? n.toLocaleString('es-AR') : String(n));
    const obs = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      obs.disconnect();
      /* Un resorte criticamente amortiguado: llega y se queda, sin pasarse.
         Un numero que se pasa del valor y vuelve se lee como un error. */
      const s = new Resorte(0, 0.7, 1);
      s.a(fin);
      animar((dt) => {
        s.paso(dt);
        el.textContent = pre + fmt(Math.max(0, Math.round(s.v))) + post;
        if (s.quieto) { el.textContent = pre + fmt(fin) + post; return false; }
        return true;
      });
    }, { threshold: .5 });
    obs.observe(el);
  });

  /* ========================================================= 9. el tema

     El sistema propone y la persona dispone: tres estados, y "sistema" es el
     que no fuerza nada. Se guarda porque una preferencia que hay que volver a
     elegir en cada visita no es una preferencia. */
  const TEMAS = ['sistema', 'claro', 'oscuro'];
  const NOMBRES = { sistema: 'Sistema', claro: 'Claro', oscuro: 'Oscuro' };
  const btnTema = document.querySelector('[data-tema-btn]');
  const txtTema = document.querySelector('[data-tema-txt]');
  const leerTema = () => {
    try { return TEMAS.includes(localStorage.getItem('tema')) ? localStorage.getItem('tema') : 'sistema'; }
    catch (e) { return 'sistema'; }
  };
  const ponerTema = (t) => {
    if (t === 'sistema') root.removeAttribute('data-tema');
    else root.setAttribute('data-tema', t);
    if (txtTema) txtTema.textContent = NOMBRES[t];
    if (btnTema) btnTema.setAttribute('title', `Tema: ${NOMBRES[t]}. Clic para cambiar.`);
    try { localStorage.setItem('tema', t); } catch (e) {}
  };
  ponerTema(leerTema());
  if (btnTema) btnTema.addEventListener('click', () => {
    ponerTema(TEMAS[(TEMAS.indexOf(leerTema()) + 1) % TEMAS.length]);
  });

  /* ==================================================== 10. cuanto queda */
  const barra = document.querySelector('[data-progreso]');
  if (barra) {
    let pide = 0;
    const avance = () => {
      const alto = document.documentElement.scrollHeight - innerHeight;
      barra.style.transform = `scaleX(${alto > 0 ? Math.min(scrollY / alto, 1) : 0})`;
    };
    avance();
    addEventListener('scroll', () => {
      if (pide) return;
      pide = requestAnimationFrame(() => { pide = 0; avance(); });
    }, { passive: true });
    addEventListener('resize', avance, { passive: true });
  }

  /* ============================================ 11. la paleta de comandos

     Un <dialog> nativo: la trampa de foco, el fondo inerte y el Escape ya
     vienen resueltos por el navegador y mejor de lo que los haria yo. */
  const paleta = document.getElementById('paleta');
  if (paleta && typeof paleta.showModal === 'function') {
    const entrada = paleta.querySelector('.paleta-input');
    const lista = paleta.querySelector('.paleta-lista');
    const vacio = paleta.querySelector('.paleta-vacio');

    const DESTINOS = [
      ...[...document.querySelectorAll('.nav-links a[href^="#"]')].map((a) => ({
        texto: a.textContent.trim(), url: a.getAttribute('href'), tipo: 'Sección', ico: '#',
      })),
      { texto: 'Descargar el CV en PDF', url: 'assets/CV-Teo-Botaya.pdf', tipo: 'Archivo', ico: '↓', fuera: true },
      { texto: 'Repositorios en GitHub', url: 'https://github.com/teobotaya', tipo: 'Enlace', ico: '↗', fuera: true },
      { texto: 'Escribirme por mail', url: 'mailto:teobotaya@gmail.com', tipo: 'Contacto', ico: '@' },
    ];

    let visibles = [], elegido = 0;
    /* Sin acentos ni mayusculas: buscar "seccion" tiene que encontrar "Sección". */
    const plano = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const pintarLista = () => {
      const q = plano(entrada.value.trim());
      visibles = q ? DESTINOS.filter((d) => plano(d.texto + ' ' + d.tipo).includes(q)) : DESTINOS;
      elegido = 0;
      lista.innerHTML = visibles.map((d, i) => `<li role="presentation">
        <button type="button" class="paleta-op" role="option" data-i="${i}" aria-selected="${i === 0}">
          <span class="op-ico" aria-hidden="true">${d.ico}</span>
          <span>${d.texto}</span><span class="op-tipo">${d.tipo}</span>
        </button></li>`).join('');
      vacio.hidden = visibles.length > 0;
    };
    const marcar = (i) => {
      const ops = [...lista.querySelectorAll('.paleta-op')];
      if (!ops.length) return;
      elegido = (i + ops.length) % ops.length;
      ops.forEach((o, n) => o.setAttribute('aria-selected', n === elegido));
      ops[elegido].scrollIntoView({ block: 'nearest' });
    };
    const viajar = (d) => {
      if (!d) return;
      paleta.close();
      if (d.fuera) { open(d.url, '_blank', 'noopener'); return; }
      if (d.url.startsWith('#')) {
        const destino = document.querySelector(d.url);
        if (destino) {
          destino.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' });
          /* El foco sigue al contenido: si no, el teclado se queda arriba. */
          destino.setAttribute('tabindex', '-1');
          destino.focus({ preventScroll: true });
        }
        location.hash = d.url;
      } else location.href = d.url;
    };

    const abrir = () => {
      entrada.value = '';
      pintarLista();
      paleta.showModal();
      entrada.focus();
    };
    /* El atajo se escribe como lo tiene el teclado de quien mira. */
    const esMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
    document.querySelectorAll('[data-abrir-paleta] kbd').forEach((k) => {
      k.textContent = esMac ? '⌘K' : 'Ctrl K';
    });
    document.querySelectorAll('[data-abrir-paleta]').forEach((b) => b.addEventListener('click', abrir));
    addEventListener('keydown', (ev) => {
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); abrir(); }
    });
    entrada.addEventListener('input', pintarLista);
    paleta.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); marcar(elegido + 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); marcar(elegido - 1); }
      else if (ev.key === 'Enter') { ev.preventDefault(); viajar(visibles[elegido]); }
    });
    lista.addEventListener('click', (ev) => {
      const op = ev.target.closest('.paleta-op');
      if (op) viajar(visibles[+op.dataset.i]);
    });
    /* Clic en el fondo: cerrar, como en cualquier modal. */
    paleta.addEventListener('click', (ev) => { if (ev.target === paleta) paleta.close(); });
  }

})();
