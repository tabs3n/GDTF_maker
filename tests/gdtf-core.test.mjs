import assert from "node:assert/strict";
import {
  createZipBytes,
  generateDescriptionXml,
  inferMetadata,
  mapLabelToAttribute,
  parseChannelSets,
  parseDmxRows
} from "../src/gdtf-core.js";

const sample = `Manufacturer: LumaWorks
Model: ArcBar 18 RGBW
DMX Mode: 8CH
1 Dimmer 0-255 0-100%
2 Strobe 0-15 closed 16-255 strobe slow-fast
3 Red 0-255
4 Green 0-255
5 Blue 0-255
6 White 0-255`;

const rows = parseDmxRows(sample);
assert.equal(rows.length, 6);
assert.equal(rows[0].attribute, "Dimmer");
assert.equal(rows[2].attribute, "ColorAdd_R");
assert.equal(mapLabelToAttribute("Pan fine"), "Pan");

const sets = parseChannelSets("0-15 closed 16-255 strobe slow-fast");
assert.equal(sets.length, 2);
assert.equal(sets[1].name, "strobe slow-fast");

const metadata = inferMetadata(sample);
assert.equal(metadata.manufacturer, "LumaWorks");
assert.equal(metadata.fixtureName, "ArcBar 18 RGBW");

const xml = generateDescriptionXml(
  {
    manufacturer: metadata.manufacturer,
    fixtureName: metadata.fixtureName,
    shortName: "ArcBar",
    modeName: metadata.modeName,
    fixtureTypeId: "308EA87D-7164-42DE-8106-A6D273F57A51"
  },
  rows
);
assert.match(xml, /<GDTF DataVersion="1.2">/);
assert.match(xml, /<FixtureType /);
assert.match(xml, /<DMXChannel DMXBreak="1" Offset="1"/);
assert.match(xml, /<Attribute Name="ColorAdd_R"/);

const zip = createZipBytes([
  { name: "description.xml", content: xml },
  { name: "thumbnail.svg", content: "<svg />" }
]);
assert.equal(zip[0], 0x50);
assert.equal(zip[1], 0x4b);
assert.ok(new TextDecoder().decode(zip).includes("description.xml"));

console.log("gdtf-core tests passed");
