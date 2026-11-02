# teobotaya.github.io

Portfolio personal de Teo Matías Botaya, publicado con GitHub Pages en
https://teobotaya.github.io

Página estática, sin dependencias ni build:

- `index.html`: el contenido.
- `assets/sitio.css`: los estilos. Tokens de color para claro y oscuro, tipografía
  (Archivo ancha para títulos, Newsreader para leer, JetBrains Mono para datos) y
  ningún componente con caja salvo las capturas y el código.
- `assets/sitio.js`: el tema, los proyectos como slides, la vista previa del índice,
  el reloj del pie y el botón de copiar el mail.
- `assets/proyectos/`: capturas reales de cada proyecto en WebP.
- `assets/og.jpg`: la imagen que se ve al compartir el enlace.

## Los proyectos como slides

En pantallas de 1024 px o más, y con al menos 660 px de alto, la sección de
proyectos se fija y el scroll vertical mueve una pista horizontal. Cada tramo
tiene una meseta al principio y al final, así que cada slide se queda quieta un
rato antes de viajar a la siguiente: se siente como un encastre sin quitarle el
scroll a nadie. La regla de abajo, las flechas del teclado y los enlaces del índice
llevan directo a cada proyecto, y si el foco del teclado entra en una slide que no
se ve, la pista va hasta ella.

En celular, en pantallas bajas o con `prefers-reduced-motion`, los proyectos se
leen uno debajo de otro, sin nada fijo.

## Probarlo en local

```bash
python3 -m http.server 8000
```

y abrir http://localhost:8000
