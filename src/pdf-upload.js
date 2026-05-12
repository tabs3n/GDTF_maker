const PDFJS_CDN_MODULES = [
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs",
  "https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.mjs"
];

const PDFJS_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
const PDFJS_CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/";
const PDFJS_FONT_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/";

let pdfjsPromise;

const elements = {
  fileInput: document.querySelector("#fileInput"),
  rawText: document.querySelector("#rawText"),
  parseText: document.querySelector("#parseText"),
  parseStatus: document.querySelector("#parseStatus"),
  warnings: document.querySelector("#warnings")
};

if (elements.fileInput) {
  elements.fileInput.addEventListener("change", handleUpload, true);
}

async function handleUpload(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const files = [...(event.target.files || [])];
  if (!files.length) return;

  setStatus(`${files.length} Datei${files.length === 1 ? "" : "en"} lesen`);
  setWarnings([]);

  const textParts = [];
  const warnings = [];

  for (const file of files) {
    try {
      setStatus(`${file.name} lesen`);
      const text = await extractFileText(file);
      if (text.trim()) {
        textParts.push(`\n\n# ${file.name}\n${text.trim()}`);
      } else {
        warnings.push(`${file.name}: Kein verwertbarer Text gefunden. Falls das PDF gescannt ist, braucht die App OCR.`);
      }
    } catch (error) {
      warnings.push(`${file.name}: ${formatError(error)}`);
    }
  }

  if (textParts.length) {
    elements.rawText.value = `${elements.rawText.value}\n${textParts.join("\n")}`.trim();
    setStatus("Text erkannt");
    elements.parseText.click();
  } else {
    setStatus("Kein Text");
  }

  setTimeout(() => {
    if (warnings.length) appendWarnings(warnings);
  }, 0);

  event.target.value = "";
}

async function extractFileText(file) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  if (file.type.startsWith("text/") || /\.(txt|csv|tsv|md)$/i.test(name)) {
    return file.text();
  }

  if (file.type.startsWith("image/")) {
    throw new Error("Bild-OCR ist noch nicht aktiv. Bitte Text-PDF, TXT oder CSV nutzen.");
  }

  throw new Error("Dateityp wird noch nicht unterstuetzt.");
}

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      let lastError;
      for (const moduleUrl of PDFJS_CDN_MODULES) {
        try {
          const pdfjs = await import(moduleUrl);
          if (pdfjs.GlobalWorkerOptions) {
            pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          }
          return pdfjs;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("PDF.js konnte nicht geladen werden.");
    })();
  }
  return pdfjsPromise;
}

async function extractPdfText(file) {
  const pdfjs = await loadPdfJs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const task = pdfjs.getDocument({
    data: bytes,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
    cMapUrl: PDFJS_CMAP_URL,
    cMapPacked: true,
    standardFontDataUrl: PDFJS_FONT_URL
  });

  const pdf = await task.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    setStatus(`PDF Seite ${pageNumber}/${pdf.numPages}`);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent({ normalizeWhitespace: true, disableCombineTextItems: false });
    const text = textContentToLines(content.items);
    if (text.trim()) pages.push(text);
  }

  await pdf.destroy?.();
  return pages.join("\n");
}

function textContentToLines(items) {
  const positioned = items
    .map((item) => {
      const transform = item.transform || [0, 0, 0, 0, 0, 0];
      return {
        text: String(item.str || "").trim(),
        x: Number(transform[4]) || 0,
        y: Number(transform[5]) || 0,
        width: Number(item.width) || 0
      };
    })
    .filter((item) => item.text);

  positioned.sort((a, b) => Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x);

  const rows = [];
  for (const item of positioned) {
    let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 3);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
    row.y = (row.y + item.y) / 2;
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.items
      .sort((a, b) => a.x - b.x)
      .reduce((line, item, index, sorted) => {
        if (index === 0) return item.text;
        const previous = sorted[index - 1];
        const gap = item.x - (previous.x + previous.width);
        return `${line}${gap > 14 ? "    " : " "}${item.text}`;
      }, "")
      .replace(/\s{2,}/g, "    ")
      .trim())
    .filter(Boolean)
    .join("\n");
}

function setStatus(value) {
  if (elements.parseStatus) elements.parseStatus.textContent = value;
}

function setWarnings(warnings) {
  if (!elements.warnings) return;
  elements.warnings.innerHTML = warnings.map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("");
}

function appendWarnings(warnings) {
  if (!elements.warnings || !warnings.length) return;
  const existing = elements.warnings.innerHTML;
  const next = warnings.map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("");
  elements.warnings.innerHTML = `${existing}${next}`;
}

function formatError(error) {
  const message = error instanceof Error ? error.message : String(error || "unbekannter Fehler");
  if (/failed to fetch|load|network|cdn|module/i.test(message)) {
    return "PDF-Modul konnte nicht geladen werden. Bitte Verbindung pruefen oder PDF-Text manuell einfuegen.";
  }
  if (/password/i.test(message)) {
    return "Passwortgeschuetzte PDFs koennen nicht gelesen werden.";
  }
  return message || "konnte nicht gelesen werden";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
