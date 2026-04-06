import assert from "node:assert/strict";
import test from "node:test";

import { parseOffer } from "@/lib/checker/parse-offer";
import { estimateOfferMarketValue } from "@/lib/checker/scoring";

function getPartName(offerText: { title?: string; description?: string }, type: "CPU" | "GPU" | "RAM" | "DYSK" | "PŁYTA" | "PSU" | "CHŁODZENIE") {
  const parsed = parseOffer({
    title: offerText.title,
    description: offerText.description ?? "",
  });

  return parsed.detectedParts.find((part) => part.type === type);
}

test("normalizes Ryzen 7 7800X3D aliases from title", () => {
  const variants = [
    "Komputer 7800x3d",
    "Komputer 7800X3D",
    "Komputer r7 7800x3d",
    "Komputer Ryzen 7 7800X3D",
  ];

  variants.forEach((title) => {
    const cpu = getPartName({ title }, "CPU");
    assert.ok(cpu, `CPU should be detected for title: ${title}`);
    assert.equal(cpu.name, "AMD Ryzen 7 7800X3D");
    assert.equal(cpu.confidence, "high");
  });
});

test("normalizes RTX 4080 SUPER aliases from title", () => {
  const variants = [
    "RTX 4080 SUPER gaming PC",
    "RTX4080 SUPER gaming PC",
    "4080 Super gaming PC",
  ];

  variants.forEach((title) => {
    const gpu = getPartName({ title }, "GPU");
    assert.ok(gpu, `GPU should be detected for title: ${title}`);
    assert.equal(gpu.name, "NVIDIA GeForce RTX 4080 Super");
    assert.equal(gpu.confidence, "high");
  });
});

test("merges title and description into canonical structured parts", () => {
  const parsed = parseOffer({
    title: "PC r7 7800x3d / RTX4080 SUPER",
    description: "32GB DDR5, B650, 1TB NVMe Gen4, zasilacz 750W 80+ Gold",
    price: 6999,
  });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "AMD Ryzen 7 7800X3D");
  assert.equal(parsed.detectedParts.find((part) => part.type === "GPU")?.name, "NVIDIA GeForce RTX 4080 Super");
  assert.equal(parsed.detectedParts.find((part) => part.type === "RAM")?.name, "32 GB DDR5");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PŁYTA")?.name, "AMD B650 motherboard");
  assert.equal(parsed.detectedParts.find((part) => part.type === "DYSK")?.name, "1 TB Gen4 NVMe");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PSU")?.name, "750 W 80+ Gold PSU");
});

test("keeps valuation sane for high-end builds", () => {
  const parsed = parseOffer({
    title: "Komputer Ryzen 7 7800X3D RTX 4080 SUPER",
    description: "32GB DDR5, B650, 1TB NVMe, zasilacz 750W Gold",
    price: 6999,
  });
  const valuation = estimateOfferMarketValue(parsed);

  assert.ok(valuation.estimatedMarketValue, "Expected estimated market value");
  assert.ok(valuation.estimatedMarketValue! >= 5200, "High-end build floor should be preserved");
  assert.equal(valuation.detectedGpuTier, "RTX_4080_SUPER");
});

test("parses mainstream mixed-format titles", () => {
  const parsed = parseOffer({
    title: "PC i5-12400F + RTX3060",
    description: "16GB DDR4, B660, 1TB SSD NVMe, PSU 650W",
  });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "Intel Core i5-12400F");
  assert.equal(parsed.detectedParts.find((part) => part.type === "GPU")?.name, "NVIDIA GeForce RTX 3060");
  assert.equal(parsed.detectedParts.find((part) => part.type === "RAM")?.name, "16 GB DDR4");
});

test("extracts labeled PC offer lines with Intel CPU and motherboard correctly", () => {
  const description = `Komputer gamingowy, na którym zagrasz we wszystkie dostępne na rynku gry. + GRATIS (poniżej).

Specyfikacja:
Procesor: Intel Core i5-10400F - 6 x 2,9 GHz (6 rdzeni, 12 wątków, tryb turbo: 4,3 GHz)
Pamięć RAM: 32 GB DDR4
Karta Graficzna: ASUS GeForce RTX 3060 TUF GAMING OC 12GB
Płyta główna: ASUS Prime B460
Dysk SSD: 512 GB M2 NVMe - kilkukrotnie szybszy od standardowych dysków SSD
Chłodzenie procesora: BeQuiet!
Zasilacz: 650W - bardzo cichy, wydajny i niezawodny zasilacz renomowanej marki
Obudowa: Komputronik Corsair z panelem bocznym wykonanym z pleksy.
System: Windows 11 Pro 64bit

Pisemna gwarancja!`;

  const parsed = parseOffer({ description });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "Intel Core i5-10400F");
  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.confidence, "high");
  assert.equal(parsed.detectedParts.find((part) => part.type === "GPU")?.name, "NVIDIA GeForce RTX 3060 12 GB");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PŁYTA")?.name, "ASUS Prime B460");
  assert.equal(parsed.detectedParts.find((part) => part.type === "RAM")?.name, "32 GB DDR4");
  assert.equal(parsed.detectedParts.find((part) => part.type === "DYSK")?.name, "512 GB PCIe NVMe");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PSU")?.name, "650 W PSU");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PSU")?.confidence, "medium");
  assert.equal(parsed.detectedParts.find((part) => part.type === "CHŁODZENIE")?.name, "be quiet!");
  assert.equal(parsed.signals?.hasWarrantyInfo, true);
});

test("extracts Ryzen offer from labeled lines", () => {
  const parsed = parseOffer({
    description: `Procesor: Ryzen 5 5600X
Karta graficzna: MSI RX 6700 XT 12GB
Płyta: MSI B550M PRO
RAM: 16 GB DDR4
SSD: 1 TB NVMe
Zasilacz: 650W 80+ Bronze`,
  });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "AMD Ryzen 5 5600X");
  assert.equal(parsed.detectedParts.find((part) => part.type === "GPU")?.name, "AMD Radeon RX 6700 XT 12 GB");
  assert.equal(parsed.detectedParts.find((part) => part.type === "PŁYTA")?.name, "MSI B550M PRO");
});

test("extracts CPU from short labeled line", () => {
  const parsed = parseOffer({
    description: "CPU: i5 12400F\nGPU: RTX 3060\nRAM: 16 GB DDR4",
  });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "Intel Core i5-12400F");
  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.confidence, "high");
});

test("extracts Xeon and Ryzen PRO aliases from offer text", () => {
  const xeonParsed = parseOffer({
    description: "CPU: xeon2670v3\nGPU: RTX 2060\nRAM: 16 GB DDR4",
  });

  const proParsed = parseOffer({
    description: "Procesor: 4650g pro\nGPU: RTX 3060\nRAM: 16 GB DDR4",
  });

  assert.equal(xeonParsed.detectedParts.find((part) => part.type === "CPU")?.name, "Intel Xeon E5-2670 v3");
  assert.equal(proParsed.detectedParts.find((part) => part.type === "CPU")?.name, "AMD Ryzen 5 PRO 4650G");
});

test("parses RAM kits as total capacity instead of single stick size", () => {
  const parsed = parseOffer({
    description: "RAM - 16 GB( 2x8 ) 3200 MHZ G.SKILL AEGIS DDR4",
  });

  const ram = parsed.detectedParts.find((part) => part.type === "RAM");

  assert.ok(ram);
  assert.equal(ram.name, "16 GB DDR4");
  assert.equal(ram.confidence, "high");
  assert.equal(ram.attributes?.ramGb, 16);
  assert.equal(ram.attributes?.ramSticks, 2);
  assert.equal(ram.attributes?.ramPerStickGb, 8);
  assert.equal(ram.attributes?.ramSpeedMhz, 3200);
  assert.equal(ram.attributes?.model, "G.SKILL Aegis");
});

test("still falls back to global scan without labels", () => {
  const parsed = parseOffer({
    description: "Sprzedam PC z Ryzen 7 5700X, RTX 3070, 32 GB DDR4, B550 i 1 TB NVMe. Wszystko sprawne.",
  });

  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.name, "AMD Ryzen 7 5700X");
  assert.equal(parsed.detectedParts.find((part) => part.type === "GPU")?.name, "NVIDIA GeForce RTX 3070");
  assert.equal(parsed.detectedParts.find((part) => part.type === "CPU")?.confidence, "medium");
});
