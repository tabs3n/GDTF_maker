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

const state = {
  rows: [],
  warnings: [],
  objectUrls: []
};

const elements = {
  fileInput: document.querySelector("#fileInput"),
  rawText: document.querySelector("#rawText"),
  parseText: document.querySelector("#parseText"),
  clearInput: document.querySelector("#clearInput"),
  loadSample: document.querySelector("#loadSample"),
  parseStatus: document.querySelector("#parseStatus"),
  warnings: document.querySelector("#warnings"),
  rowsBody: document.querySelector("#rowsBody"),
  addRow: document.querySelector("#addRow"),
  generateGdtf: document.querySelector("#generateGdtf"),
  generateGdtfTop: document.querySelector("#generateGdtfTop"),
  exportStatus: document.querySelector("#exportStatus"),
  downloadGdtf: document.querySelector("#downloadGdtf"),
  downloadXml: document.querySelector("#downloadXml"),
  xmlPreview: document.querySelector("#xmlPreview"),
  manufacturer: document.querySelector("#manufacturer"),
  fixtureName: document.querySelector("#fixtureName"),
  shortName: document.querySelector("#shortName"),
  modeName: document.querySelector("#modeName"),
  lampType: document.querySelector("#lampType"),
  beamType: document.querySelector("#beamType"),
  powerConsumption: document.querySelector("#powerConsumption"),
  luminousFlux: document.querySelector("#luminousFlux"),
  beamAngle: document.querySelector("#beamAngle"),
  fieldAngle: document.querySelector("#fieldAngle")
};

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

elements.fileInput.addEventListener("change", async (event) => {
  await handleFiles(event.target.files);
});

elements.parseText.addEventListener("click", () => {
  parseCurrentText();
});

elements.clearInput.addEventListener("click", () => {
  elements.rawText.value = "";
  state.rows = [];
  state.warnings = [];
  renderAll();
  setStatus("Bereit");
});

elements.loadSample.addEventListener("click", () => {
  elements.rawText.value = sampleText;
  parseCurrentText();
});

elements.addRow.addEventListener("click", () => {
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
});

elements.rowsBody.addEventListener("input", updateRowFromEvent);
elements.rowsBody.addEventListener("change", updateRowFromEvent);
elements.rowsBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-row]");
  if (!button) return;
  state.rows = state.rows.filter((row) => row.id !== button.dataset.deleteRow);
  renderRows();
  updatePreview();
});

elements.generateGdtf.addEventListener("click", generateExport);
elements.generateGdtfTop.addEventListener("click", generateExport);

for (const element of [
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
]) {
  element.addEventListener("input", updatePreview);
  element.addEventListener("change", updatePreview);
}

renderAll();
updatePreview();

async function handleFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;

  setStatus("Lese Uploads");
  state.warnings = [];
  const textParts = [];

  for (const file of files) {
    try {
      const text = await extractTextFromFile(file);
      if (text) textParts.push(`\n\n# ${file.name}\n${text}`);
    } catch (error) {
      state.warnings.push(`${file.name}: ${error instanceof Error ? error.message : "konnte nicht gelesen werden"}`);
    }
  }

  if (textParts.length) {
    elements.rawText.value = `${elements.rawText.value}\n${textParts.join("\n")}`.trim();
    parseCurrentText();
  } else {
    setStatus("Kein Text");
    renderWarnings();
  }
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
    state.warnings.push(`${file.name}: Bild-OCR ist im Browser-MVP noch nicht aktiv.`);
    return "";
  }
  state.warnings.push(`${file.name}: Dateityp nicht unterstuetzt.`);
  return "";
}

let pdfModulePromise;

async function extractPdfText(file) {
  if (!pdfModulePromise) {
    pdfModulePromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
  }
  const pdfjs = await pdfModulePromise;
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs";
  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

function parseCurrentText() {
  const text = elements.rawText.value;
  const rows = parseDmxRows(text);
  const metadata = inferMetadata(text);
  applyMetadata(metadata);
  state.rows = rows;
  state.warnings = [];
  if (!rows.length) {
    state.warnings.push("Keine DMX-Kanaele erkannt. Du kannst die Tabelle manuell ausfuellen.");
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
    if (!row.attribute || row.attribute === "NoFeature") {
      row.attribute = mapLabelToAttribute(row.label);
    }
  } else {
    row[field] = target.value;
  }

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
