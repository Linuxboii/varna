# Varna

Colour contrast checker that suggests a fix.

**Live:** https://varna.avlokai.com

**For:** Designers and developers who need text to pass WCAG, and anyone choosing readable colours.

## What it does

- WCAG 2 contrast ratio with AA and AAA for body text, large text and UI
- Live preview of the pair
- When it fails, the closest passing colour in the same hue, found in OKLCH
- Fix either the text or the background
- Accepts hex, rgb() and hsl(); share by link

Suggestions keep hue and chroma and only move lightness, so brand colours stay recognisable.

## Privacy

Everything runs in your browser. There is no backend, no analytics and no account. Nothing you enter is uploaded.

## Run locally

No build step and no runtime dependencies. Serve the folder with any static server:

```
npx serve .
```

## Tests

The logic lives in `lib.js` as pure functions, tested with the Node test runner (Node 20+):

```
npm test
```

## Files

- `index.html` page and styles
- `app.js` wiring between the page and the logic
- `lib.js` pure logic, no DOM
- `lib.test.js` tests
- `base.css`, `ui.js` shared look and small DOM helpers

## Licence

MIT. Made by [Sushanth Kasturi](https://sushanth.avlokai.com).
