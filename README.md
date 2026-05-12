# GDTF Forge

Browser-based MVP for turning datasheet and DMX chart uploads into a draft GDTF 1.2 file.

## Local run

```bash
node server.mjs
```

Open `http://localhost:4173`.

## Test

```bash
node tests/gdtf-core.test.mjs
```

## Deploy on Vercel

Import this folder as a Vercel project. No build command is required because the app is static. Vercel serves `index.html`, `styles.css`, and the `src` module files directly.

## Notes

This MVP extracts text from text, CSV, and PDF uploads in the browser, maps likely DMX channels to GDTF attributes, and exports an uncompressed ZIP archive with a `.gdtf` extension. Datasheets vary a lot, so the detected DMX table is editable before export.
