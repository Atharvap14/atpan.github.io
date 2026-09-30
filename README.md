# atpan.github.io

Personal portfolio site — plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

Each paper gets a short **animated sketch** instead of a paragraph. Sketches contain no
sentences: text appears only on arrows or as one highlighted word.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Where things live

| Path | What |
| --- | --- |
| `index.html` | Home page copy: hero, About, News, Experience, Education, Latest blogs, the ten paper cards |
| `experience.html` | Experience, talks (with video) and competitions |
| `blog/lisr.html`, `blog/deduce.html` | Interactive explainers (3D figures for LISR) |
| `css/style.css` | Design tokens (shadcn-style names) for the beige theme and the dark "chalkboard" theme |
| `js/sketch.js` | Tiny hand-drawn animation engine (wobbly strokes, pen-draw timeline, play/pause/scrub) |
| `js/glyphs.js` | Reusable doodles: person, robot, card, bulb, battery, gauge, magnifier, … |
| `js/scenes.js` | One scene per paper (`SCENES.<name>`), plus the small page doodles |
| `js/main.js` | Wires cards to players, blog thumbnails, reduced-motion handling |
| `js/theme.js` | Light / dark toggle |
| `js/viz.js`, `js/viz3d.js` | Helpers and a tiny drag-to-rotate 3D canvas for the blog figures |
| `js/blog-lisr.js`, `js/blog-deduce.js` | The interactive figures, computed live |
| `assets/` | Portrait, self-hosted fonts (Roboto + Caveat), figures from the LISR paper |

## Editing

- **Text / links / authors** — edit the `<article class="paper">` blocks in `index.html`.
- **News, experience, education** — plain `<li>` / `<div class="edu-item">` blocks in `index.html` and `experience.html`.
- **Add a paper** — copy an `<article>`, give it a new `data-scene="name"`, and add
  `SCENES.name = function (sk) { … }` in `js/scenes.js`.
- **Colours** — the `--background`, `--card`, `--sk-*` variables at the top of `css/style.css`.
- **Fonts** — `--font-sans` and `--font-hand` in `css/style.css`.

### Writing a scene

```js
SCENES.example = function (sk) {                 // canvas is 800 x 520
  var q     = sk.card(40, 150, 110, 150);        // shapes & glyphs are created hidden…
  var arrow = sk.arrow(160, 225, 300, 225, { label: 'train' });   // arrow labels are the only free text
  var key   = sk.word('axiom', 400, 120);        // …or a single highlighted word
  q.draw(0, 800);                                // …then scheduled on the timeline (ms)
  arrow.draw(900, 700);
  key.draw(1800, 700);
};
```

`draw` pen-draws strokes, `pop` bounces an item in, `move / rot / scale / pulse / shake`
animate it, and `along(points, t, dur)` moves it along a path.

## Deploying

GitHub Pages serves this repo from `https://<user>.github.io/<repo>/`. All asset paths are
relative, so the site works from a sub-path as well as from a custom domain.
