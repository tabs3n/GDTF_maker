export const FEATURE_GROUPS = [
  { name: "Dimmer", pretty: "Dimmer", features: ["Dimmer"] },
  { name: "Position", pretty: "Position", features: ["PanTilt", "XYZ", "Rotation", "Scale"] },
  { name: "Gobo", pretty: "Gobo", features: ["Gobo", "Media"] },
  { name: "Color", pretty: "Color", features: ["Color", "RGB", "HSB", "CIE", "Indirect", "ColorCorrection"] },
  { name: "Beam", pretty: "Beam", features: ["Beam"] },
  { name: "Focus", pretty: "Focus", features: ["Focus"] },
  { name: "Control", pretty: "Control", features: ["Control"] },
  { name: "Shapers", pretty: "Shapers", features: ["Shapers"] },
  { name: "Video", pretty: "Video", features: ["Video"] }
];

export const ACTIVATION_GROUPS = [
  "PanTilt",
  "XYZ",
  "Rot_XYZ",
  "Scale_XYZ",
  "ColorRGB",
  "ColorHSB",
  "ColorCIE",
  "ColorIndirect",
  "Gobo1",
  "Gobo1Pos",
  "Prism",
  "BeamShaper",
  "Shaper"
];

const COLOR_DATA = {
  ColorAdd_R: { pretty: "R", color: "0.64,0.33,21.3" },
  ColorAdd_G: { pretty: "G", color: "0.3,0.6,71.5" },
  ColorAdd_B: { pretty: "B", color: "0.15,0.06,7.2" },
  ColorAdd_C: { pretty: "C", color: "0.225,0.329,78.7" },
  ColorAdd_M: { pretty: "M", color: "0.321,0.154,28.5" },
  ColorAdd_Y: { pretty: "Y", color: "0.419,0.505,92.8" },
  ColorAdd_RY: { pretty: "Amber", color: "0.477,0.460,57.0" },
  ColorAdd_W: { pretty: "W", color: "0.3127,0.329,100" },
  ColorAdd_WW: { pretty: "WW", color: "0.4578,0.4101,100" },
  ColorAdd_CW: { pretty: "CW", color: "0.3127,0.329,100" },
  ColorAdd_UV: { pretty: "UV", color: "0.2,0.1,8" }
};

export function getAttributeDefinition(name) {
  if (COLOR_DATA[name]) {
    return {
      name,
      pretty: COLOR_DATA[name].pretty,
      activationGroup: "ColorRGB",
      feature: "Color.RGB",
      physicalUnit: "ColorComponent",
      color: COLOR_DATA[name].color
    };
  }

  const controlMatch = name.match(/^Control(\d+)$/);
  if (controlMatch) {
    return { name, pretty: `Ctrl${controlMatch[1]}`, feature: "Control.Control" };
  }

  const goboMatch = name.match(/^Gobo(\d+)$/);
  if (goboMatch) {
    return {
      name,
      pretty: `G${goboMatch[1]}`,
      activationGroup: `Gobo${goboMatch[1]}`,
      feature: "Gobo.Gobo"
    };
  }

  const colorWheelMatch = name.match(/^Color(\d+)$/);
  if (colorWheelMatch) {
    return {
      name,
      pretty: `C${colorWheelMatch[1]}`,
      activationGroup: "ColorRGB",
      feature: "Color.Color"
    };
  }

  const frostMatch = name.match(/^Frost(\d+)$/);
  if (frostMatch) {
    return {
      name,
      pretty: `Frost${frostMatch[1]}`,
      feature: "Beam.Beam",
      physicalUnit: "Percent"
    };
  }

  const prismMatch = name.match(/^Prism(\d+)$/);
  if (prismMatch) {
    return {
      name,
      pretty: `Prism${prismMatch[1]}`,
      activationGroup: "Prism",
      feature: "Beam.Beam"
    };
  }

  const focusMatch = name.match(/^Focus(\d+)$/);
  if (focusMatch) {
    return {
      name,
      pretty: `Focus${focusMatch[1]}`,
      feature: "Focus.Focus"
    };
  }

  const staticDefinitions = {
    Dimmer: { name: "Dimmer", pretty: "Dim", feature: "Dimmer.Dimmer", physicalUnit: "Percent" },
    Pan: { name: "Pan", pretty: "P", activationGroup: "PanTilt", feature: "Position.PanTilt", physicalUnit: "Angle" },
    Tilt: { name: "Tilt", pretty: "T", activationGroup: "PanTilt", feature: "Position.PanTilt", physicalUnit: "Angle" },
    PanRotate: { name: "PanRotate", pretty: "P Rotate", feature: "Position.PanTilt", physicalUnit: "AngularSpeed" },
    TiltRotate: { name: "TiltRotate", pretty: "T Rotate", feature: "Position.PanTilt", physicalUnit: "AngularSpeed" },
    Shutter1: { name: "Shutter1", pretty: "Sh1", feature: "Beam.Beam" },
    Shutter1Strobe: { name: "Shutter1Strobe", pretty: "Strobe1", mainAttribute: "Shutter1", feature: "Beam.Beam", physicalUnit: "Frequency" },
    Iris: { name: "Iris", pretty: "Iris", feature: "Beam.Beam", physicalUnit: "Percent" },
    Zoom: { name: "Zoom", pretty: "Zoom", feature: "Focus.Focus", physicalUnit: "Angle" },
    CTO: { name: "CTO", pretty: "CTO", feature: "Color.ColorCorrection", physicalUnit: "ColorComponent" },
    CTB: { name: "CTB", pretty: "CTB", feature: "Color.ColorCorrection", physicalUnit: "ColorComponent" },
    NoFeature: { name: "NoFeature", pretty: "NoFeature", feature: "Control.Control" },
    Dummy: { name: "Dummy", pretty: "Dummy", feature: "Control.Control" },
    GlobalMSpeed: { name: "GlobalMSpeed", pretty: "Global MSpeed", feature: "Control.Control" },
    LEDFrequency: { name: "LEDFrequency", pretty: "LED Frequency", feature: "Control.Control", physicalUnit: "Frequency" }
  };

  return staticDefinitions[name] || { name, pretty: name, feature: "Control.Control" };
}

export const ATTRIBUTE_NAMES = [
  "Dimmer",
  "Shutter1",
  "Shutter1Strobe",
  "Pan",
  "Tilt",
  "PanRotate",
  "TiltRotate",
  "ColorAdd_R",
  "ColorAdd_G",
  "ColorAdd_B",
  "ColorAdd_W",
  "ColorAdd_WW",
  "ColorAdd_CW",
  "ColorAdd_RY",
  "ColorAdd_UV",
  "ColorAdd_C",
  "ColorAdd_M",
  "ColorAdd_Y",
  "Color1",
  "Gobo1",
  "Prism1",
  "Frost1",
  "Iris",
  "Zoom",
  "Focus1",
  "CTO",
  "CTB",
  "LEDFrequency",
  "GlobalMSpeed",
  "Control1",
  "NoFeature"
];

export function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function sanitizeGdtfName(value, fallback = "Object") {
  const normalized = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const candidate = normalized || fallback;
  return /^[A-Za-z_]/.test(candidate) ? candidate : `G_${candidate}`;
}

export function slugFilePart(value, fallback = "fixture") {
  return sanitizeGdtfName(value, fallback).replace(/_+/g, "-").toLowerCase();
}

export function inferMetadata(text) {
  const source = String(text || "");
  const findValue = (...labels) => {
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*[:\\-]\\s*([^\\r\\n]{2,80})`, "i");
      const match = source.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s{2,}/g, " ");
      }
    }
    return "";
  };

  const channels = parseDmxRows(source);
  return {
    manufacturer: findValue("manufacturer", "hersteller", "brand") || "Generic",
    fixtureName: findValue("model", "fixture", "geraet", "device") || "LED Fixture",
    modeName: findValue("dmx mode", "dmx-modus", "mode") || (channels.length ? `${channels.length}CH` : "Default")
  };
}

export function mapLabelToAttribute(label) {
  const value = String(label || "").toLowerCase();
  const compact = value.replace(/[\s_-]+/g, "");

  if (/\bpan\b/.test(value) && /(rotate|rot|speed)/.test(value)) return "PanRotate";
  if (/\btilt\b/.test(value) && /(rotate|rot|speed)/.test(value)) return "TiltRotate";
  if (/\bpan\b/.test(value)) return "Pan";
  if (/\btilt\b/.test(value)) return "Tilt";
  if (/(dimmer|intensity|master|helligkeit)/.test(value)) return "Dimmer";
  if (/(strobe|strobo|flash|blitz)/.test(value)) return "Shutter1Strobe";
  if (/(shutter|verschluss)/.test(value)) return "Shutter1";
  if (/(red|rot|\br\b)/.test(value) && !/(green|blue|amber|white)/.test(value)) return "ColorAdd_R";
  if (/(green|gruen|grun|\bg\b)/.test(value)) return "ColorAdd_G";
  if (/(blue|blau|\bb\b)/.test(value)) return "ColorAdd_B";
  if (/(warm white|warmwhite|ww|warmweiss|warmweis)/.test(value)) return "ColorAdd_WW";
  if (/(cool white|coolwhite|cw|kaltweiss|kaltweis)/.test(value)) return "ColorAdd_CW";
  if (/(white|weiss|weis|\bw\b)/.test(value)) return "ColorAdd_W";
  if (/(amber|orange|gelbton)/.test(value)) return "ColorAdd_RY";
  if (/(uv|ultra violet|ultraviolet|blacklight|schwarzlicht)/.test(value)) return "ColorAdd_UV";
  if (/(cyan)/.test(value)) return "ColorAdd_C";
  if (/(magenta)/.test(value)) return "ColorAdd_M";
  if (/(yellow|gelb)/.test(value)) return "ColorAdd_Y";
  if (/(color wheel|colour wheel|farbrad|color select|colour select)/.test(value)) return "Color1";
  if (/(gobo)/.test(value)) return "Gobo1";
  if (/(prism|prisma)/.test(value)) return "Prism1";
  if (/(frost|soft)/.test(value)) return "Frost1";
  if (/(iris)/.test(value)) return "Iris";
  if (/(zoom|beam angle)/.test(value)) return "Zoom";
  if (/(focus|fokus)/.test(value)) return "Focus1";
  if (/(cto|color temperature|colour temperature|ctc|kelvin)/.test(value)) return "CTO";
  if (/(ctb)/.test(value)) return "CTB";
  if (/(frequency|frequenz|pwm)/.test(value)) return "LEDFrequency";
  if (/(speed|geschwindigkeit|mspeed|movement time)/.test(value)) return "GlobalMSpeed";
  if (/(reset|control|program|macro|auto|sound|mode|function|display|fan)/.test(value) || compact === "ch") return "Control1";
  return "NoFeature";
}

export function physicalDefaults(attribute) {
  if (["Dimmer", "Iris", "Frost1", "ColorAdd_R", "ColorAdd_G", "ColorAdd_B", "ColorAdd_W", "ColorAdd_WW", "ColorAdd_CW", "ColorAdd_RY", "ColorAdd_UV", "ColorAdd_C", "ColorAdd_M", "ColorAdd_Y"].includes(attribute)) {
    return [0, 1];
  }
  if (attribute === "Pan") return [-270, 270];
  if (attribute === "Tilt") return [-135, 135];
  if (attribute === "Zoom") return [0, 60];
  return [0, 1];
}

export function parseChannelSets(text) {
  const source = String(text || "").replaceAll("–", "-").replaceAll("—", "-");
  const matches = [];
  const pattern = /(\d{1,5})\s*(?:-|to|bis|~)\s*(\d{1,5})\s*[:=]?\s*([^\d;\n\r]{2,60}?)(?=\s+\d{1,5}\s*(?:-|to|bis|~)\s*\d{1,5}|[;\n\r]|$)/gi;
  for (const match of source.matchAll(pattern)) {
    const from = Number(match[1]);
    const to = Number(match[2]);
    const name = match[3].trim().replace(/\s{2,}/g, " ");
    if (Number.isFinite(from) && Number.isFinite(to) && from >= 0 && to >= from && name) {
      matches.push({ name, from, to });
    }
  }
  return matches;
}

function cleanChannelLabel(value) {
  return String(value || "")
    .replace(/\b\d{1,5}\s*(?:-|to|bis|~)\s*\d{1,5}\b/gi, " ")
    .replace(/\b(?:dmx|value|wert|range|bereich|kanal|channel|ch)\b/gi, " ")
    .replace(/[|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseDelimitedLine(line) {
  const delimiter = line.includes("\t") ? "\t" : line.includes(";") ? ";" : line.includes(",") ? "," : "";
  if (!delimiter) return null;
  const parts = line.split(delimiter).map((part) => part.trim()).filter(Boolean);
  const numericIndex = parts.findIndex((part) => /^\d{1,3}$/.test(part));
  if (numericIndex === -1) return null;
  const label = parts.slice(numericIndex + 1).find((part) => /[A-Za-zÄÖÜäöüß]/.test(part)) || parts[numericIndex + 1] || "";
  if (!label) return null;
  return { offset: Number(parts[numericIndex]), label: cleanChannelLabel(label), raw: line };
}

export function parseDmxRows(text) {
  const lines = String(text || "")
    .replaceAll("\u00a0", " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = [];
  for (const line of lines) {
    if (/^(page|seite|www\.|http|manual|table of contents)/i.test(line)) continue;

    const delimited = parseDelimitedLine(line);
    let parsed = delimited;

    if (!parsed) {
      const match = line.match(/^(?:dmx\s*)?(?:ch(?:annel)?\.?\s*)?(\d{1,3})(?:\s*(?:\/|&|\+|,|-)\s*(\d{1,3}))?(?:\s*[:.)-]\s*|\s+)(.+)$/i);
      if (match) {
        const offset = Number(match[1]);
        const secondOffset = Number(match[2]);
        const rest = match[3].trim();
        if (offset >= 1 && offset <= 512 && /[A-Za-zÄÖÜäöüß]/.test(rest)) {
          parsed = {
            offset,
            offsets: Number.isFinite(secondOffset) && secondOffset > offset && secondOffset <= 512 ? [offset, secondOffset] : [offset],
            label: cleanChannelLabel(rest),
            raw: line
          };
        }
      }
    }

    if (!parsed || !parsed.label || parsed.offset < 1 || parsed.offset > 512) continue;
    const attribute = mapLabelToAttribute(parsed.label);
    const [physicalFrom, physicalTo] = physicalDefaults(attribute);
    rows.push({
      id: createRowId(parsed.offset, rows.length),
      offset: parsed.offset,
      offsets: parsed.offsets || [parsed.offset],
      label: parsed.label,
      attribute,
      resolution: parsed.offsets?.length === 2 ? 2 : 1,
      physicalFrom,
      physicalTo,
      channelSets: parseChannelSets(parsed.raw),
      snap: shouldSnap(attribute),
      raw: parsed.raw
    });
  }

  return mergeFineChannels(rows).sort((a, b) => a.offset - b.offset);
}

function createRowId(offset, index) {
  return `row_${offset}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function mergeFineChannels(rows) {
  const sorted = [...rows].sort((a, b) => a.offset - b.offset);
  const result = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const current = { ...sorted[index], offsets: [...(sorted[index].offsets || [sorted[index].offset])] };
    const next = sorted[index + 1];
    const nextLooksFine = next && /(fine|low byte|lsb|least significant)/i.test(next.raw || next.label);
    const currentLooksFine = /(fine|low byte|lsb|least significant)/i.test(current.raw || current.label);
    const adjacent = next && next.offset === current.offset + 1;

    if (!currentLooksFine && nextLooksFine && adjacent && next.attribute === current.attribute) {
      current.offsets = [current.offset, next.offset];
      current.resolution = 2;
      current.label = current.label.replace(/\b(coarse|high byte|msb|most significant)\b/gi, "").trim() || current.label;
      index += 1;
    }

    if (!currentLooksFine) {
      result.push(current);
    }
  }

  return result;
}

export function shouldSnap(attribute) {
  return /^(Shutter|Gobo|Color\d|Prism|Control|NoFeature|Dummy)/.test(attribute);
}

export function normalizeRowsForXml(rows) {
  const countByAttribute = new Map();
  return rows
    .filter((row) => Number(row.offset) >= 1 && Number(row.offset) <= 512)
    .map((row, index) => {
      const baseAttribute = row.attribute || mapLabelToAttribute(row.label);
      const seen = countByAttribute.get(baseAttribute) || 0;
      countByAttribute.set(baseAttribute, seen + 1);
      let xmlAttribute = baseAttribute;
      if (seen > 0 && /^(Control|NoFeature|Dummy)$|^Control\d+$/.test(baseAttribute)) {
        xmlAttribute = `Control${seen + 1}`;
      }
      const byteCount = Number(row.resolution) === 2 || (row.offsets || []).length === 2 ? 2 : 1;
      const maxValue = byteCount === 2 ? 65535 : 255;
      return {
        ...row,
        id: row.id || createRowId(row.offset, index),
        offset: Number(row.offset),
        offsets: Array.isArray(row.offsets) && row.offsets.length ? row.offsets.map(Number) : [Number(row.offset)],
        attribute: baseAttribute,
        xmlAttribute,
        resolution: byteCount,
        physicalFrom: numberOrDefault(row.physicalFrom, 0),
        physicalTo: numberOrDefault(row.physicalTo, 1),
        channelSets: normalizeChannelSets(row.channelSets),
        snap: typeof row.snap === "boolean" ? row.snap : shouldSnap(baseAttribute),
        defaultValue: numberOrDefault(row.defaultValue, 0),
        highlightValue: numberOrDefault(row.highlightValue, maxValue)
      };
    });
}

function normalizeChannelSets(value) {
  if (Array.isArray(value)) return value;
  return parseChannelSets(value);
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function attrs(values) {
  return Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}="${escapeXml(value)}"`)
    .join(" ");
}

function node(name, values, children = "", indent = "") {
  const attributes = attrs(values);
  const open = attributes ? `<${name} ${attributes}` : `<${name}`;
  if (!children) return `${indent}${open} />`;
  return `${indent}${open}>\n${children}\n${indent}</${name}>`;
}

export function generateDescriptionXml(metadata, rows) {
  const normalizedRows = normalizeRowsForXml(rows);
  const usedAttributes = collectUsedAttributes(normalizedRows);
  const fixtureName = metadata.fixtureName || "LED Fixture";
  const manufacturer = metadata.manufacturer || "Generic";
  const fixtureTypeId = (metadata.fixtureTypeId || randomUuid()).toUpperCase();
  const modeName = sanitizeGdtfName(metadata.modeName || `${normalizedRows.length || 1}CH`, "Default");

  const fixtureChildren = [
    generateAttributeDefinitionsXml(usedAttributes),
    "    <Wheels />",
    "    <PhysicalDescriptions />",
    "    <Models />",
    generateGeometriesXml(metadata),
    generateDmxModesXml(modeName, normalizedRows),
    `    <Revisions>\n      <Revision Text="Draft generated by GDTF Forge" Date="${new Date().toISOString().slice(0, 19)}" />\n    </Revisions>`
  ].join("\n");

  const fixtureType = node(
    "FixtureType",
    {
      Name: sanitizeGdtfName(fixtureName, "Fixture"),
      ShortName: metadata.shortName || fixtureName.slice(0, 12),
      LongName: fixtureName,
      Manufacturer: manufacturer,
      Description: metadata.description || "Generated draft from datasheet and DMX chart",
      FixtureTypeID: fixtureTypeId,
      Thumbnail: "thumbnail",
      CanHaveChildren: "No"
    },
    fixtureChildren,
    "  "
  );

  return `<?xml version="1.0" encoding="UTF-8"?>\n<GDTF DataVersion="1.2">\n${fixtureType}\n</GDTF>\n`;
}

function collectUsedAttributes(rows) {
  const used = new Set(rows.map((row) => row.xmlAttribute));
  for (const attribute of [...used]) {
    const definition = getAttributeDefinition(attribute);
    if (definition.mainAttribute) used.add(definition.mainAttribute);
  }
  if (!used.size) used.add("Dimmer");
  return [...used].sort();
}

function generateAttributeDefinitionsXml(usedAttributes) {
  const activationGroups = ACTIVATION_GROUPS.map((name) => `        <ActivationGroup Name="${name}" />`).join("\n");
  const featureGroups = FEATURE_GROUPS.map((group) => {
    const features = group.features.map((feature) => `          <Feature Name="${feature}" />`).join("\n");
    return `        <FeatureGroup Name="${group.name}" Pretty="${group.pretty}">\n${features}\n        </FeatureGroup>`;
  }).join("\n");
  const attributes = usedAttributes.map((name) => {
    const definition = getAttributeDefinition(name);
    return node(
      "Attribute",
      {
        Name: definition.name,
        Pretty: definition.pretty,
        ActivationGroup: definition.activationGroup,
        Feature: definition.feature,
        MainAttribute: definition.mainAttribute,
        PhysicalUnit: definition.physicalUnit,
        Color: definition.color
      },
      "",
      "        "
    );
  }).join("\n");

  return [
    "    <AttributeDefinitions>",
    "      <ActivationGroups>",
    activationGroups,
    "      </ActivationGroups>",
    "      <FeatureGroups>",
    featureGroups,
    "      </FeatureGroups>",
    "      <Attributes>",
    attributes,
    "      </Attributes>",
    "    </AttributeDefinitions>"
  ].join("\n");
}

function generateGeometriesXml(metadata) {
  const beamAttributes = {
    Name: "Beam",
    LampType: metadata.lampType || "LED",
    PowerConsumption: numberOrDefault(metadata.powerConsumption, 100),
    LuminousFlux: numberOrDefault(metadata.luminousFlux, 3000),
    ColorTemperature: numberOrDefault(metadata.colorTemperature, 6000),
    BeamAngle: numberOrDefault(metadata.beamAngle, 25),
    FieldAngle: numberOrDefault(metadata.fieldAngle, 25),
    BeamRadius: numberOrDefault(metadata.beamRadius, 0.05),
    BeamType: metadata.beamType || "Wash"
  };

  return [
    "    <Geometries>",
    "      <Geometry Name=\"Body\">",
    node("Beam", beamAttributes, "", "        "),
    "      </Geometry>",
    "    </Geometries>"
  ].join("\n");
}

function generateDmxModesXml(modeName, rows) {
  const channelXml = rows.map((row) => generateDmxChannelXml(row)).join("\n");
  return [
    "    <DMXModes>",
    `      <DMXMode Name="${modeName}" Description="${rows.length} channel draft" Geometry="Body">`,
    "        <DMXChannels>",
    channelXml || generateDmxChannelXml({
      offset: 1,
      offsets: [1],
      label: "Dimmer",
      xmlAttribute: "Dimmer",
      resolution: 1,
      physicalFrom: 0,
      physicalTo: 1,
      snap: false,
      channelSets: []
    }),
    "        </DMXChannels>",
    "      </DMXMode>",
    "    </DMXModes>"
  ].join("\n");
}

function generateDmxChannelXml(row) {
  const byteCount = row.resolution === 2 ? 2 : 1;
  const offset = (row.offsets?.length ? row.offsets : [row.offset]).join(",");
  const maxValue = byteCount === 2 ? 65535 : 255;
  const channelSetXml = row.channelSets
    .filter((set) => Number.isFinite(Number(set.from)))
    .sort((a, b) => Number(a.from) - Number(b.from))
    .map((set) => node("ChannelSet", {
      Name: sanitizeGdtfName(set.name, "Set"),
      DMXFrom: `${scaleDmxValue(set.from, byteCount)}/${byteCount}`,
      PhysicalFrom: 0,
      PhysicalTo: 1
    }, "", "              "))
    .join("\n");

  const functionXml = node(
    "ChannelFunction",
    {
      Name: sanitizeGdtfName(row.xmlAttribute, "Function"),
      Attribute: row.xmlAttribute,
      OriginalAttribute: row.label,
      DMXFrom: `0/${byteCount}`,
      Default: `${clamp(Math.round(row.defaultValue), 0, maxValue)}/${byteCount}`,
      PhysicalFrom: row.physicalFrom,
      PhysicalTo: row.physicalTo
    },
    channelSetXml,
    "            "
  );

  const logicalXml = node(
    "LogicalChannel",
    {
      Attribute: row.xmlAttribute,
      Snap: row.snap ? "Yes" : "No",
      Master: row.xmlAttribute === "Dimmer" ? "Grand" : "None"
    },
    functionXml,
    "          "
  );

  return node(
    "DMXChannel",
    {
      DMXBreak: 1,
      Offset: offset,
      Highlight: `${clamp(Math.round(row.highlightValue), 0, maxValue)}/${byteCount}`,
      Geometry: "Beam"
    },
    logicalXml,
    "          "
  );
}

function scaleDmxValue(value, byteCount) {
  const numeric = clamp(Number(value), 0, 255);
  return byteCount === 2 ? Math.round((numeric / 255) * 65535) : numeric;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function generateThumbnailSvg(metadata) {
  const manufacturer = escapeXml(metadata.manufacturer || "Generic");
  const fixtureName = escapeXml(metadata.fixtureName || "Fixture");
  const initials = escapeXml(
    String(metadata.fixtureName || "G")
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase()
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="64" fill="#142628"/>
  <circle cx="256" cy="210" r="116" fill="#13736d"/>
  <path d="M164 355h184l-34 64H198z" fill="#b45f32"/>
  <text x="256" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="84" font-weight="700" fill="#ffffff">${initials}</text>
  <text x="256" y="72" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#dce8e6">${manufacturer}</text>
  <text x="256" y="466" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#dce8e6">${fixtureName}</text>
</svg>`;
}

export function createGdtfFileName(metadata) {
  const manufacturer = slugFilePart(metadata.manufacturer, "generic");
  const fixture = slugFilePart(metadata.fixtureName, "fixture");
  return `${manufacturer}@${fixture}@draft.gdtf`;
}

export async function createGdtfZipBlob(metadata, rows) {
  const xml = generateDescriptionXml(metadata, rows);
  const svg = generateThumbnailSvg(metadata);
  const bytes = createZipBytes([
    { name: "description.xml", content: xml },
    { name: "thumbnail.svg", content: svg }
  ]);
  return {
    xml,
    fileName: createGdtfFileName(metadata),
    blob: new Blob([bytes], { type: "application/octet-stream" })
  };
}

const crcTable = new Uint32Array(256).map((_, tableIndex) => {
  let c = tableIndex;
  for (let bit = 0; bit < 8; bit += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function dosTimeDate(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

export function createZipBytes(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { time, date } = dosTimeDate();

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === "string" ? encoder.encode(file.content) : file.content;
    const crc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0x0800);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, time);
    writeUint16(localHeader, 12, date);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, dataBytes.length);
    writeUint32(localHeader, 22, dataBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0x0800);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, time);
    writeUint16(centralHeader, 14, date);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, dataBytes.length);
    writeUint32(centralHeader, 24, dataBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + dataBytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralSize);
  writeUint32(end, 16, offset);

  const totalSize = offset + centralSize + end.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;
  for (const part of [...localParts, ...centralParts, end]) {
    output.set(part, cursor);
    cursor += part.length;
  }
  return output;
}
