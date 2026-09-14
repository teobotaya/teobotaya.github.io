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
    { t:'x', x:1.6, r:2, l:'Docker',  c:'#0284C7', n:'Docker y Compose',   g:'Infraestructura',
      d:'Base de datos y API levantan juntas con un comando, para que el entorno no dependa de lo que cada máquina tenga instalado.' },
    { t:'c', x:2.6, r:2, l:'Git',     c:'#EA580C', n:'Git',                g:'Infraestructura',
      d:'Una rama por funcionalidad y un historial que se puede leer. Cada decisión de diseño queda fechada en el mensaje del commit.' },
    { t:'v', x:3.6, r:2, l:'CI',      c:'#64748B', n:'GitHub Actions',     g:'Infraestructura',
      d:'Build y pruebas automáticas en cada push. Si algo rompe, se entera el pipeline antes que el usuario.' },
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

    TECLAS.forEach((k) => {
      const b = document.createElement('button');
      b.className = 'key';
      b.type = 'button';
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
    });

    function hundir(k, b) {
      campos.punto.style.setProperty('--kc', k.c);
      campos.nombre.textContent = k.n;
      campos.grupo.textContent = k.g;
      campos.texto.textContent = k.d;
      ficha.style.setProperty('--kc', k.c);
      b.classList.add('down');
    }
    const soltar = (b) => b.classList.remove('down');

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
  }

  /* ============================================ 3. las tarjetas, con resorte

     X e Y llevan resortes independientes: un solo resorte sobre la distancia
     en dos dimensiones se desincroniza cuando cada eje trae otra velocidad. */
  if (!quieto) {
    document.querySelectorAll('.card,.shot,.panel,.layer,.edu,.kbd-info,.stat').forEach((el) => {
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
    '.sec-title,.sec-intro,.eyebrow,.card,.split,.codeblock,.layer,.shot,.edu,.contact,.stats,.kbd-wrap,.stack-group,.cta-row,.hero-meta'
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

  /* ================================================== 6. numeros que suben */
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
})();
