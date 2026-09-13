/* ---------------------------------------------------------------------------
   Profundidad sin librerías: un teclado en CSS 3D, inclinación con el puntero
   y entradas al hacer scroll. Todo se degrada: sin JS la pagina se lee igual.
   --------------------------------------------------------------------------- */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ el teclado */
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
      d:'Diseño responsive escrito sin frameworks. Esta pagina incluida: el teclado que estas mirando son transformaciones 3D nativas.' },
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
      d:'Un plugin de 29 kB con el álgebra lineal escrita a mano — k-means, PCA, proyección aleatoria — y un servidor Node que no instala nada. Menos superficie que mantener y nada que se rompa solo.' },
    { t:'m', x:4.0, r:3, w:1.4, l:'Mermaid',  c:'#0D9488', n:'UML y Mermaid',  g:'Análisis y diseño',
      d:'Casos de uso, diagramas de secuencia y modelo relacional, versionados como texto junto al código que describen.' },
  ];

  const board = document.getElementById('kbd');
  const info  = document.getElementById('kbd-info');
  if (board && info) {
    const porTecla = new Map();
    const fInfo = {
      dot: info.querySelector('.kbd-dot'),
      nom: info.querySelector('h3'),
      grp: info.querySelector('.kbd-grp'),
      txt: info.querySelector('p'),
    };

    TECLAS.forEach((k) => {
      const b = document.createElement('button');
      b.className = 'key';
      b.type = 'button';
      b.style.cssText = `--x:${k.x};--r:${k.r};--w:${k.w || 1};--kc:${k.c}`;
      b.setAttribute('aria-label', `${k.n} — ${k.g}`);
      b.innerHTML =
        `<span class="s s-f"></span><span class="s s-b"></span>` +
        `<span class="s s-r"></span><span class="s s-l"></span>` +
        `<span class="cap"><b>${k.l}</b><i>${k.t === ' ' ? '␣' : k.t.toUpperCase()}</i></span>`;
      b.addEventListener('click', () => elegir(k, b));
      board.appendChild(b);
      porTecla.set(k.t, { k, b });
    });

    let sueltaEn = 0;
    function elegir(k, b) {
      fInfo.dot.style.setProperty('--kc', k.c);
      fInfo.nom.textContent = k.n;
      fInfo.grp.textContent = k.g;
      fInfo.txt.textContent = k.d;
      info.style.setProperty('--kc', k.c);
      b.classList.add('down');
      clearTimeout(sueltaEn);
      sueltaEn = setTimeout(() => b.classList.remove('down'), 170);
    }

    /* La gracia: la tecla fisica hunde la tecla de la pantalla. */
    addEventListener('keydown', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const e = document.activeElement;
      if (e && /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) return;
      const hit = porTecla.get(ev.key.toLowerCase());
      if (!hit) return;
      if (ev.key === ' ') ev.preventDefault();
      elegir(hit.k, hit.b);
    });

    /* La placa acompaña al puntero, apenas. */
    if (!quieto) {
      const stage = board.parentElement;
      stage.addEventListener('pointermove', (ev) => {
        const r = stage.getBoundingClientRect();
        board.style.setProperty('--tz', `${((ev.clientX - r.left) / r.width - .5) * 13}deg`);
        board.style.setProperty('--tx', `${((ev.clientY - r.top) / r.height - .5) * -9}deg`);
      });
      stage.addEventListener('pointerleave', () => {
        board.style.setProperty('--tz', '0deg');
        board.style.setProperty('--tx', '0deg');
      });
    }
  }

  /* ------------------------------------------ inclinación de las tarjetas */
  const inclinables = document.querySelectorAll('.card,.shot,.panel,.layer,.edu,.kbd-info,.stat');
  if (!quieto) {
    inclinables.forEach((el) => {
      el.dataset.tilt = '';
      let pedido = 0;
      el.addEventListener('pointermove', (ev) => {
        if (pedido) return;
        pedido = requestAnimationFrame(() => {
          pedido = 0;
          const r = el.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width;
          const py = (ev.clientY - r.top) / r.height;
          el.style.setProperty('--ry', `${(px - .5) * 9}deg`);
          el.style.setProperty('--rx', `${(py - .5) * -7}deg`);
          el.style.setProperty('--mx', `${px * 100}%`);
          el.style.setProperty('--my', `${py * 100}%`);
        });
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* --------------------------------------------------- entradas al scroll */
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
    /* Lo que ya se ve al cargar no se anima: no tiene sentido esconderlo. */
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * .92) { el.classList.add('in'); return; }
    const hermanos = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
    el.style.setProperty('--d', `${Math.min(hermanos, 5) * 70}ms`);
    io.observe(el);
  });

  /* --------------------------------------------------------- hero en capas */
  const hero = document.getElementById('top');
  if (hero && !quieto) {
    hero.addEventListener('pointermove', (ev) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', ((ev.clientX - r.left) / r.width - .5).toFixed(3));
      hero.style.setProperty('--py', ((ev.clientY - r.top) / r.height - .5).toFixed(3));
    });
  }

  /* ------------------------------------------------------- números que suben */
  document.querySelectorAll('.stat-n').forEach((el) => {
    if (quieto) return;
    /* El texto puede traer prefijo y separador de miles: "~9.700". Se anima
       solo el número y se devuelve con el mismo formato con el que estaba. */
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
      const t0 = performance.now(), dur = 900;
      const paso = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(Math.round(fin * e)) + post;
        if (p < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }, { threshold: .5 });
    obs.observe(el);
  });
})();
