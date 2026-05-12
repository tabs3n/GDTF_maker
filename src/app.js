import {
  ATTRIBUTE_NAMES,
  createGdtfFileName,
  createGdtfZipBlob,
  generateDescriptionXml,
  inferMetadata,
  mapLabelToAttribute,
  normalizeRowsForXml,
  parseChannelSets,
  parseDmxRows,
  physicalDefaults,
  shouldSnap
} from "./gdtf-core.js";

const PDFJS_VERSION = "4.10.38";
const PDFJS_CDN_MODULES = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.mjs`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.mjs`
];
const PDFJS_WORKER_URLS = [
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`,
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/legacy/build/pdf.worker.mjs`,
  `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.mjs`
];

const PDFJS_CMAP_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/cmaps/`;
const PDFJS_FONT_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/standard_fonts/`;

const state = {
  rows: [],
  warnings: [],
  objectUrls: []
};

const elements = Object.fromEntries([
  "fileInput",
  "rawText",
  "parseText",
  "clearInput",
  "loadSample",
  "parseStatus",
  "warnings",
  "rowsBody",
  "addRow",
  "generateGdtf",
  "generateGdtfTop",
  "exportStatus",
  "downloadGdtf",
  "downloadXml",
  "xmlPreview",
  "manufacturer",
  "fixtureName",
  "shortName",
  "modeName",
  "lampType",
  "beamType",
  "powerConsumption",
  "luminousFlux",
  "beamAngle",
  "fieldAngle"
].map((id) => [id, document.querySelector(`#${id}`)]));

const sampleText = `Manufacturer: LumaWorks
Model: ArcBar 18 RGBW
DMX Mode: 8CH
1 Dimmer 0-255 0-100%
2 Strobe 0-15 closed 16-255 strobe slow-fast
3 Red 0-255
4 Green 0-255
5 Blue 0-255
6 White 0-255
7 Color macros 0-10 open 11-255 macros
8 Auto programs 0-15 no function 16-255 program select`;

let pdfjsPromise;

init();

function init() {
  elements.fileInput.addEventListener("change", handleFiles);
  elements.parseText.addEventListener("click", parseCurrentText);
  elements.clearInput.addEventListener("click", clearInput);
  elements.loadSample.addEventListener("click", loadSample);
  elements.addRow.addEventListener("click", addManualRow);
  elements.rowsBody.addEventListener("input", updateRowFromEvent);
  elements.rowsBody.addEventListener("change", updateRowFromEvent);
  elements.rowsBody.addEventListener("click", deleteRowFromEvent);
  elements.generateGdtf.addEventListener("click", generateExport);
  elements.generateGdtfTop.addEventListener("click", generateExport);

  for (const element of metadataElements()) {
    element.addEventListener("input", updatePreview);
    element.addEventListener("change", updatePreview);
  }

  renderAll();
  updatePreview();
}

async function handleFiles(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;

  setStatus(`${files.length} Datei${files.length === 1 ? "" : "en"} lesen`);
  state.warnings = [];
  renderWarnings();

  const textParts = [];

  for (const file of files) {
    try {
      setStatus(`${file.name} lesen`);
      const text = await extractTextFromFile(file);
      if (text.trim()) {
        textParts.push(`\n\n# ${file.name}\n${text.trim()}`);
      } else {
        state.warnings.push(`${file.name}: Kein verwertbarer Text gefunden. Falls das PDF gescannt ist, braucht die App OCR.`);
      }
    } catch (error) {
      state.warnings.push(`${file.name}: ${formatUploadError(error)}`);
    }
    renderWarnings();
  }

  if (textParts.length) {
    elements.rawText.value = `${elements.rawText.value}\n${textParts.join("\n")}`.trim();
    parseCurrentText();
  } else {
    setStatus("Kein Text");
    renderWarnings();
  }

  event.target.value = "";
}

async function extractTextFromFile(file) {
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

async function buildWorkerBlobUrl() {
  for (const url of PDFJS_WORKER_URLS) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const text = await response.text();
      const blob = new Blob([text], { type: "text/javascript" });
      return URL.createObjectURL(blob);
    } catch {
      // try next
    }
  }
  return null;
}

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      let lastError;
      for (const moduleUrl of PDFJS_CDN_MODULES) {
        try {
          const pdfjs = await import(moduleUrl);
          if (pdfjs.GlobalWorkerOptions) {
            const blobSrc = await buildWorkerBlobUrl();
            pdfjs.GlobalWorkerOptions.workerSrc = blobSrc ?? moduleUrl.replace("pdf.mjs", "pdf.worker.mjs");
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
  const buffer = await file.arrayBuffer();

  try {
    const pdfjs = await loadPdfJs();
    const task = pdfjs.getDocument({
      data: new Uint8Array(buffer.slice(0)),
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
  } catch (error) {
    const fallback = roughPdfTextFallback(buffer);
    if (fallback.trim()) {
      state.warnings.push(`${file.name}: PDF.js ist fehlgeschlagen, einfacher Text-Fallback wurde genutzt.`);
      return fallback;
    }
    throw error;
  }
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

function roughPdfTextFallback(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  const snippets = [];
  const literalPattern = /\((?:\\.|[^\\)]){2,}\)\s*Tj|\[(.*?)\]\s*TJ/gs;
  for (const match of binary.matchAll(literalPattern)) {
    const raw = match[1] || match[0];
    const strings = [...raw.matchAll(/\((?:\\.|[^\\)]){2,}\)/g)].map((item) => decodePdfLiteral(item[0].slice(1, -1)));
    if (strings.length) snippets.push(strings.join(" "));
  }

  return snippets.join("\n").replace(/\s{2,}/g, " ").trim();
}

function decodePdfLiteral(value) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

function parseCurrentText() {
  const text = elements.rawText.value;
  const rows = parseDmxRows(text);
  const metadata = inferMetadata(text);
  const uploadWarnings = [...state.warnings];

  applyMetadata(metadata);
  state.rows = rows;
  state.warnings = uploadWarnings;

  if (!rows.length) {
    state.warnings.push("Keine DMX-Kanaele erkannt. Du kannst die Tabelle manuell ausfuellen oder den erkannten Text korrigieren.");
  }

  const duplicateOffsets = findDuplicateOffsets(rows);
  if (duplicateOffsets.length) {
    state.warnings.push(`Doppelte Offsets erkannt: ${duplicateOffsets.join(", ")}`);
  }

  setStatus(rows.length ? `${rows.length} Kanaele` : "Keine Kanaele");
  renderAll();
  updatePreview();
}

function applyMetadata(metadata) {
  elements.manufacturer.value = metadata.manufacturer || elements.manufacturer.value;
  elements.fixtureName.value = metadata.fixtureName || elements.fixtureName.value;
  elements.modeName.value = metadata.modeName || elements.modeName.value;
  if (!elements.shortName.value || elements.shortName.value === "LED") {
    elements.shortName.value = (metadata.fixtureName || "Fixture").slice(0, 12);
  }
}

function clearInput() {
  elements.rawText.value = "";
  state.rows = [];
  state.warnings = [];
  renderAll();
  setStatus("Bereit");
  updatePreview();
}

function loadSample() {
  elements.rawText.value = sampleText;
  state.warnings = [];
  parseCurrentText();
}

function addManualRow() {
  const nextOffset = state.rows.reduce((max, row) => Math.max(max, Number(row.offset) || 0), 0) + 1;
  const attribute = "Dimmer";
  const [physicalFrom, physicalTo] = physicalDefaults(attribute);
  state.rows.push({
    id: `manual_${Date.now()}`,
    offset: nextOffset,
    offsets: [nextOffset],
    label: "Dimmer",
    attribute,
    resolution: 1,
    physicalFrom,
    physicalTo,
    channelSets: [],
    snap: shouldSnap(attribute)
  });
  renderRows();
  updatePreview();
}

function findDuplicateOffsets(rows) {
  const seen = new Set();
  const duplicates = new Set();
  for (const row of rows) {
    for (const offset of row.offsets || [row.offset]) {
      if (seen.has(offset)) duplicates.add(offset);
      seen.add(offset);
    }
  }
  return [...duplicates].sort((a, b) => a - b);
}

function updateRowFromEvent(event) {
  const target = event.target;
  const rowId = target.dataset.row;
  const field = target.dataset.field;
  if (!rowId || !field) return;

  const row = state.rows.find((item) => item.id === rowId);
  if (!row) return;

  if (field === "offset") {
    const offsets = parseOffsetValue(target.value);
    row.offset = offsets[0] || 1;
    row.offsets = offsets;
    row.resolution = offsets.length === 2 ? 2 : row.resolution;
  } else if (field === "attribute") {
    row.attribute = target.value;
    const [physicalFrom, physicalTo] = physicalDefaults(row.attribute);
    row.physicalFrom = physicalFrom;
    row.physicalTo = physicalTo;
    row.snap = shouldSnap(row.attribute);
    renderRows();
  } else if (field === "resolution") {
    row.resolution = Number(target.value);
    if (row.resolution === 2 && row.offsets.length === 1) row.offsets = [row.offset, row.offset + 1];
    if (row.resolution === 1) row.offsets = [row.offset];
  } else if (field === "channelSets") {
    row.channelSets = target.value;
  } else if (field === "label") {
    row.label = target.value;
    if (!row.attribute || row.attribute === "NoFeature") row.attribute = mapLabelToAttribute(row.label);
  } else {
    row[field] = target.value;
  }

  updatePreview();
}

function deleteRowFromEvent(event) {
  const button = event.target.closest("[data-delete-row]");
  if (!button) return;
  state.rows = state.rows.filter((row) => row.id !== button.dataset.deleteRow);
  renderRows();
  updatePreview();
}

function parseOffsetValue(value) {
  const offsets = String(value)
    .split(/[,+/ ]+/)
    .map((part) => Number(part.trim()))
    .filter((number) => Number.isFinite(number) && number >= 1 && number <= 512);
  return offsets.length ? offsets.slice(0, 2) : [1];
}

function renderAll() {
  renderWarnings();
  renderRows();
  if (window.lucide) window.lucide.createIcons();
}

function renderWarnings() {
  elements.warnings.innerHTML = state.warnings.map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("");
}

function renderRows() {
  if (!state.rows.length) {
    elements.rowsBody.innerHTML = '<tr class="empty-row"><td colspan="8">Noch keine Kanaele erkannt.</td></tr>';
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  elements.rowsBody.innerHTML = state.rows.map((row) => {
    const setsValue = Array.isArray(row.channelSets)
      ? row.channelSets.map((set) => `${set.from}-${set.to} ${set.name}`).join("; ")
      : row.channelSets || "";
    return `
      <tr>
        <td><input data-row="${row.id}" data-field="offset" value="${escapeHtml((row.offsets || [row.offset]).join(","))}" aria-label="Kanal Offset"></td>
        <td><input data-row="${row.id}" data-field="label" value="${escapeHtml(row.label)}" aria-label="Bezeichnung"></td>
        <td>
          <select data-row="${row.id}" data-field="attribute" aria-label="GDTF Attribut">
            ${ATTRIBUTE_NAMES.map((name) => `<option value="${name}"${name === row.attribute ? " selected" : ""}>${name}</option>`).join("")}
          </select>
        </td>
        <td><input data-row="${row.id}" data-field="physicalFrom" type="number" step="0.01" value="${escapeHtml(row.physicalFrom)}" aria-label="Physischer Startwert"></td>
        <td><input data-row="${row.id}" data-field="physicalTo" type="number" step="0.01" value="${escapeHtml(row.physicalTo)}" aria-label="Physischer Endwert"></td>
        <td><input data-row="${row.id}" data-field="channelSets" value="${escapeHtml(setsValue)}" aria-label="Channel Sets"></td>
        <td>
          <select data-row="${row.id}" data-field="resolution" aria-label="Aufloesung">
            <option value="1"${Number(row.resolution) === 1 ? " selected" : ""}>8</option>
            <option value="2"${Number(row.resolution) === 2 ? " selected" : ""}>16</option>
          </select>
        </td>
        <td>
          <button class="icon-button delete-row" type="button" data-delete-row="${row.id}" title="Kanal loeschen" aria-label="Kanal loeschen">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  if (window.lucide) window.lucide.createIcons();
}

function metadataElements() {
  return [
    elements.manufacturer,
    elements.fixtureName,
    elements.shortName,
    elements.modeName,
    elements.lampType,
    elements.beamType,
    elements.powerConsumption,
    elements.luminousFlux,
    elements.beamAngle,
    elements.fieldAngle
  ];
}

function readMetadata() {
  return {
    manufacturer: elements.manufacturer.value.trim() || "Generic",
    fixtureName: elements.fixtureName.value.trim() || "LED Fixture",
    shortName: elements.shortName.value.trim() || "LED",
    modeName: elements.modeName.value.trim() || "Default",
    lampType: elements.lampType.value,
    beamType: elements.beamType.value,
    powerConsumption: elements.powerConsumption.value,
    luminousFlux: elements.luminousFlux.value,
    beamAngle: elements.beamAngle.value,
    fieldAngle: elements.fieldAngle.value
  };
}

function rowsForExport() {
  return state.rows.map((row) => ({
    ...row,
    channelSets: typeof row.channelSets === "string" ? parseChannelSets(row.channelSets) : row.channelSets
  }));
}

function updatePreview() {
  const metadata = readMetadata();
  const rows = rowsForExport();
  try {
    const xml = generateDescriptionXml(metadata, rows);
    elements.xmlPreview.textContent = xml;
    elements.downloadXml.download = "description.xml";
    elements.exportStatus.textContent = `${normalizeRowsForXml(rows).length || 1} Kanaele`;
  } catch (error) {
    elements.xmlPreview.textContent = error instanceof Error ? error.message : "Vorschaufehler";
    elements.exportStatus.textContent = "Pruefen";
  }
}

async function generateExport() {
  const metadata = readMetadata();
  const rows = rowsForExport();
  setExportStatus("Erstelle Paket");

  const result = await createGdtfZipBlob(metadata, rows);
  revokeObjectUrls();
  const gdtfUrl = URL.createObjectURL(result.blob);
  const xmlUrl = URL.createObjectURL(new Blob([result.xml], { type: "application/xml" }));
  state.objectUrls.push(gdtfUrl, xmlUrl);

  elements.downloadGdtf.href = gdtfUrl;
  elements.downloadGdtf.download = result.fileName || createGdtfFileName(metadata);
  elements.downloadGdtf.classList.remove("disabled");
  elements.downloadXml.href = xmlUrl;
  elements.downloadXml.classList.remove("disabled");
  elements.xmlPreview.textContent = result.xml;
  setExportStatus("Fertig");
}

function revokeObjectUrls() {
  for (const url of state.objectUrls) URL.revokeObjectURL(url);
  state.objectUrls = [];
}

function setStatus(value) {
  elements.parseStatus.textContent = value;
}

function setExportStatus(value) {
  elements.exportStatus.textContent = value;
}

function formatUploadError(error) {
  const message = error instanceof Error ? error.message : String(error || "unbekannter Fehler");
  if (/failed to fetch|network|cdn|module|import/i.test(message)) {
    return "PDF-Modul konnte nicht geladen werden. Bitte Verbindung pruefen oder PDF-Text manuell einfuegen.";
  }
  if (/password/i.test(message)) return "Passwortgeschuetzte PDFs koennen nicht gelesen werden.";
  return message || "konnte nicht gelesen werden";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
