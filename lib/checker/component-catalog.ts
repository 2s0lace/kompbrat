import type { DetectedPartType } from "@/types/checker";
import { getCpuMeta } from "@/lib/checker/cpu-database";
import { getGpuMeta } from "@/lib/checker/gpu-database";

export type CanonicalComponentType = Exclude<DetectedPartType, "CENA">;

export type ComponentAttributes = {
  vendor?: string;
  family?: string;
  series?: string;
  model?: string;
  suffix?: string;
  platform?: string;
  chipset?: string;
  memoryType?: "DDR3" | "DDR4" | "DDR5";
  ramGb?: number;
  ramSticks?: number;
  ramPerStickGb?: number;
  ramSpeedMhz?: number;
  storageGb?: number;
  storageKind?: "NVMe" | "SSD" | "HDD";
  storageInterface?: "Gen4" | "Gen3" | "SATA" | "PCIe";
  wattage?: number;
  efficiency?: "80+ Bronze" | "80+ Silver" | "80+ Gold" | "80+ Platinum";
  vramGb?: number;
};

export type CatalogComponent = {
  id: string;
  type: CanonicalComponentType;
  canonical: string;
  aliases: string[];
  attributes: ComponentAttributes;
  valuation?: {
    usedValue?: number;
    newValue?: number;
    wholeBuildFloor?: number;
    tier?: string;
  };
};

export type RamCatalogEntry = {
  id: string;
  canonical: string;
  aliases: string[];
  attributes: Pick<ComponentAttributes, "memoryType" | "ramGb">;
};

export type StorageCatalogEntry = {
  id: string;
  canonical: string;
  aliases: string[];
  attributes: Pick<ComponentAttributes, "storageGb" | "storageKind" | "storageInterface">;
};

export type PsuCatalogEntry = {
  id: string;
  canonical: string;
  aliases: string[];
  attributes: Pick<ComponentAttributes, "wattage" | "efficiency">;
};

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((chunk) => {
      if (/[0-9]/.test(chunk) || chunk === chunk.toUpperCase()) {
        return chunk.toUpperCase();
      }

      return chunk.charAt(0).toUpperCase() + chunk.slice(1);
    })
    .join(" ");
}

function createRyzenCpuEntry(input: {
  id: string;
  tier: "5" | "7" | "9";
  model: string;
  suffix?: string;
  platform: "am4" | "am5";
  valuation?: CatalogComponent["valuation"];
}) {
  const suffix = (input.suffix ?? "").toUpperCase();
  const modelLabel = `${input.model}${suffix}`;
  const canonical = `AMD Ryzen ${input.tier} ${modelLabel}`;
  const familyAlias = `ryzen ${input.tier} ${modelLabel}`;
  const shortAlias = `r${input.tier} ${modelLabel}`;

  return {
    id: input.id,
    type: "CPU",
    canonical,
    aliases: unique([`amd ${familyAlias}`, familyAlias, shortAlias, modelLabel]),
    attributes: {
      vendor: "AMD",
      family: "Ryzen",
      series: `Ryzen ${input.tier}`,
      model: modelLabel,
      suffix: suffix || undefined,
      platform: input.platform.toUpperCase(),
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createIntelCpuEntry(input: {
  id: string;
  tier: "i5" | "i7" | "i9";
  model: string;
  suffix?: string;
  valuation?: CatalogComponent["valuation"];
}) {
  const suffix = (input.suffix ?? "").toUpperCase();
  const modelLabel = `${input.model}${suffix}`;
  const canonical = `Intel Core ${input.tier}-${modelLabel}`;

  return {
    id: input.id,
    type: "CPU",
    canonical,
    aliases: unique([
      `intel core ${input.tier} ${modelLabel}`,
      `core ${input.tier} ${modelLabel}`,
      `${input.tier} ${modelLabel}`,
      modelLabel,
    ]),
    attributes: {
      vendor: "Intel",
      family: "Core",
      series: input.tier.toUpperCase(),
      model: modelLabel,
      suffix: suffix || undefined,
      platform: "LGA1700",
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createNvidiaGpuEntry(input: {
  id: string;
  line: "RTX" | "GTX";
  model: string;
  suffix?: "SUPER" | "TI";
  vramGb?: number;
  valuation?: CatalogComponent["valuation"];
}) {
  const suffix = input.suffix ? ` ${input.suffix}` : "";
  const canonical = `NVIDIA GeForce ${input.line} ${input.model}${suffix}`;
  const aliasBase = `${input.line} ${input.model}${suffix}`;

  return {
    id: input.id,
    type: "GPU",
    canonical,
    aliases: unique([
      `nvidia geforce ${aliasBase}`,
      `geforce ${aliasBase}`,
      aliasBase,
      `${input.model}${suffix}`,
    ]),
    attributes: {
      vendor: "NVIDIA",
      family: "GeForce",
      series: input.line,
      model: input.model,
      suffix: input.suffix,
      vramGb: input.vramGb,
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createAmdGpuEntry(input: {
  id: string;
  model: string;
  suffix?: string;
  vramGb?: number;
  valuation?: CatalogComponent["valuation"];
}) {
  const suffix = input.suffix ? ` ${input.suffix}` : "";
  const canonical = `AMD Radeon RX ${input.model}${suffix}`;
  const aliasBase = `RX ${input.model}${suffix}`;

  return {
    id: input.id,
    type: "GPU",
    canonical,
    aliases: unique([
      `amd radeon ${aliasBase}`,
      `radeon ${aliasBase}`,
      aliasBase,
      `${input.model}${suffix}`,
    ]),
    attributes: {
      vendor: "AMD",
      family: "Radeon",
      series: "RX",
      model: input.model,
      suffix: input.suffix,
      vramGb: input.vramGb,
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createIntelArcGpuEntry(input: {
  id: string;
  model: string;
  vramGb?: number;
  valuation?: CatalogComponent["valuation"];
}) {
  const modelLabel = input.model.toUpperCase();

  return {
    id: input.id,
    type: "GPU",
    canonical: `Intel Arc ${modelLabel}`,
    aliases: unique([`intel arc ${modelLabel}`, `arc ${modelLabel}`, modelLabel]),
    attributes: {
      vendor: "Intel",
      family: "Arc",
      series: "Arc",
      model: modelLabel,
      vramGb: input.vramGb,
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createMotherboardEntry(input: {
  id: string;
  canonical: string;
  aliases: string[];
  chipset: string;
  platform: string;
  valuation: CatalogComponent["valuation"];
}) {
  return {
    id: input.id,
    type: "PŁYTA",
    canonical: input.canonical,
    aliases: unique(input.aliases),
    attributes: {
      chipset: input.chipset,
      platform: input.platform,
    },
    valuation: input.valuation,
  } satisfies CatalogComponent;
}

function createRamEntry(input: {
  ramGb: number;
  memoryType?: "DDR3" | "DDR4" | "DDR5";
}) {
  return {
    id: `ram-${input.ramGb}${input.memoryType ? `-${input.memoryType.toLowerCase()}` : ""}`,
    canonical: canonicalRamName(input.ramGb, input.memoryType),
    aliases: unique([
      `${input.ramGb} gb${input.memoryType ? ` ${input.memoryType}` : ""}`,
      `${input.ramGb}gb${input.memoryType ? ` ${input.memoryType}` : ""}`,
      `${input.ramGb} g${input.memoryType ? ` ${input.memoryType}` : ""}`,
    ]),
    attributes: {
      ramGb: input.ramGb,
      memoryType: input.memoryType,
    },
  } satisfies RamCatalogEntry;
}

function createStorageEntry(input: {
  storageGb: number;
  storageKind: "NVMe" | "SSD" | "HDD";
  storageInterface?: "Gen4" | "Gen3" | "SATA" | "PCIe";
}) {
  return {
    id: `storage-${input.storageGb}-${input.storageKind.toLowerCase()}${input.storageInterface ? `-${input.storageInterface.toLowerCase()}` : ""}`,
    canonical: canonicalStorageName(input.storageGb, input.storageKind, input.storageInterface),
    aliases: unique([
      input.storageGb >= 1000 && input.storageGb % 1000 === 0 ? `${input.storageGb / 1000} tb ${input.storageKind}` : `${input.storageGb} gb ${input.storageKind}`,
      input.storageGb >= 1000 && input.storageGb % 1000 === 0 ? `${input.storageGb / 1000}tb ${input.storageKind}` : `${input.storageGb}gb ${input.storageKind}`,
      input.storageInterface ? `${input.storageGb >= 1000 && input.storageGb % 1000 === 0 ? `${input.storageGb / 1000} tb` : `${input.storageGb} gb`} ${input.storageInterface}` : "",
    ]),
    attributes: input,
  } satisfies StorageCatalogEntry;
}

function createPsuEntry(input: {
  wattage: number;
  efficiency?: "80+ Bronze" | "80+ Silver" | "80+ Gold" | "80+ Platinum";
}) {
  return {
    id: `psu-${input.wattage}${input.efficiency ? `-${input.efficiency.toLowerCase().replace(/\s+/g, "-")}` : ""}`,
    canonical: canonicalPsuName(input.wattage, input.efficiency),
    aliases: unique([
      `${input.wattage} w${input.efficiency ? ` ${input.efficiency}` : ""}`,
      `${input.wattage}w${input.efficiency ? ` ${input.efficiency}` : ""}`,
      `${input.wattage} watt${input.efficiency ? ` ${input.efficiency}` : ""}`,
    ]),
    attributes: input,
  } satisfies PsuCatalogEntry;
}

export const cpuCatalog: CatalogComponent[] = [
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-7-7800x3d", tier: "7", model: "7800", suffix: "x3d", platform: "am5", valuation: { usedValue: 1450, newValue: 1550 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-7-7700", tier: "7", model: "7700", platform: "am5", valuation: { usedValue: 950, newValue: 1100 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-9600x", tier: "5", model: "9600", suffix: "x", platform: "am5", valuation: { newValue: 920 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-9600", tier: "5", model: "9600", platform: "am5", valuation: { newValue: 820 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-8600g", tier: "5", model: "8600", suffix: "g", platform: "am5", valuation: { newValue: 780 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-7600", tier: "5", model: "7600", platform: "am5", valuation: { usedValue: 740, newValue: 860 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-7500f", tier: "5", model: "7500", suffix: "f", platform: "am5", valuation: { usedValue: 560, newValue: 650 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-7-5700x", tier: "7", model: "5700", suffix: "x", platform: "am4", valuation: { usedValue: 500, newValue: 620 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-5600x", tier: "5", model: "5600", suffix: "x", platform: "am4", valuation: { usedValue: 380, newValue: 470 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-5600g", tier: "5", model: "5600", suffix: "g", platform: "am4", valuation: { usedValue: 380, newValue: 460 } }),
  createRyzenCpuEntry({ id: "cpu-amd-ryzen-5-5600", tier: "5", model: "5600", platform: "am4", valuation: { usedValue: 340, newValue: 420 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i7-14700", tier: "i7", model: "14700", valuation: { newValue: 1500 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i7-12700kf", tier: "i7", model: "12700", suffix: "kf", valuation: { usedValue: 760, newValue: 980 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i7-10700k", tier: "i7", model: "10700", suffix: "k", valuation: { usedValue: 520, newValue: 680 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-10400f", tier: "i5", model: "10400", suffix: "f", valuation: { usedValue: 260, newValue: 360 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-14600k", tier: "i5", model: "14600", suffix: "k", valuation: { newValue: 1050 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-14400f", tier: "i5", model: "14400", suffix: "f", valuation: { newValue: 760 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-14400", tier: "i5", model: "14400", valuation: { newValue: 790 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-13400f", tier: "i5", model: "13400", suffix: "f", valuation: { newValue: 650 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-13400", tier: "i5", model: "13400", valuation: { newValue: 700 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-12600k", tier: "i5", model: "12600", suffix: "k", valuation: { newValue: 990 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-12400f", tier: "i5", model: "12400", suffix: "f", valuation: { usedValue: 450, newValue: 560 } }),
  createIntelCpuEntry({ id: "cpu-intel-core-i5-12400", tier: "i5", model: "12400", valuation: { newValue: 620 } }),
];

export const gpuCatalog: CatalogComponent[] = [
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4080-super", line: "RTX", model: "4080", suffix: "SUPER", vramGb: 16, valuation: { usedValue: 3800, newValue: 4600, wholeBuildFloor: 5200, tier: "RTX_4080_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3080-ti", line: "RTX", model: "3080", suffix: "TI", vramGb: 12, valuation: { usedValue: 2000, wholeBuildFloor: 3300, tier: "RTX_3080_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-5070-ti", line: "RTX", model: "5070", suffix: "TI", vramGb: 16, valuation: { newValue: 3400, wholeBuildFloor: 5400, tier: "RTX_5070_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-5070", line: "RTX", model: "5070", vramGb: 12, valuation: { newValue: 2800, wholeBuildFloor: 4500, tier: "RTX_5070" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4070-ti", line: "RTX", model: "4070", suffix: "TI", vramGb: 12, valuation: { usedValue: 2700, newValue: 3400, wholeBuildFloor: 4300, tier: "RTX_4070_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4070-super", line: "RTX", model: "4070", suffix: "SUPER", vramGb: 12, valuation: { usedValue: 2350, newValue: 2900, wholeBuildFloor: 3900, tier: "RTX_4070_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4070", line: "RTX", model: "4070", vramGb: 12, valuation: { usedValue: 1800, newValue: 2400, wholeBuildFloor: 3100, tier: "RTX_4070" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-5060-ti", line: "RTX", model: "5060", suffix: "TI", vramGb: 16, valuation: { newValue: 2200, wholeBuildFloor: 3300, tier: "RTX_5060_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-5060", line: "RTX", model: "5060", vramGb: 8, valuation: { newValue: 1600, wholeBuildFloor: 2600, tier: "RTX_5060" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4060-ti", line: "RTX", model: "4060", suffix: "TI", vramGb: 8, valuation: { usedValue: 1400, newValue: 1750, wholeBuildFloor: 2400, tier: "RTX_4060_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-4060", line: "RTX", model: "4060", vramGb: 8, valuation: { usedValue: 1100, newValue: 1350, wholeBuildFloor: 2100, tier: "RTX_4060" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3080", line: "RTX", model: "3080", vramGb: 10, valuation: { usedValue: 1550, wholeBuildFloor: 2800, tier: "RTX_3080" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3070-ti", line: "RTX", model: "3070", suffix: "TI", vramGb: 8, valuation: { usedValue: 1300, wholeBuildFloor: 2500, tier: "RTX_3070_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3070", line: "RTX", model: "3070", vramGb: 8, valuation: { usedValue: 1050, wholeBuildFloor: 2200, tier: "RTX_3070" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3060-8gb", line: "RTX", model: "3060 8GB", vramGb: 8, valuation: { usedValue: 620, wholeBuildFloor: 1450, tier: "RTX_3060_8GB" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3060-ti", line: "RTX", model: "3060", suffix: "TI", vramGb: 8, valuation: { usedValue: 850, wholeBuildFloor: 1850, tier: "RTX_3060_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-3060", line: "RTX", model: "3060", vramGb: 12, valuation: { usedValue: 700, wholeBuildFloor: 1550, tier: "RTX_3060" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-2070-super", line: "RTX", model: "2070", suffix: "SUPER", vramGb: 8, valuation: { usedValue: 760, wholeBuildFloor: 1800, tier: "RTX_2070_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-2070", line: "RTX", model: "2070", vramGb: 8, valuation: { usedValue: 660, wholeBuildFloor: 1650, tier: "RTX_2070" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-2060-super", line: "RTX", model: "2060", suffix: "SUPER", vramGb: 8, valuation: { usedValue: 560, wholeBuildFloor: 1450, tier: "RTX_2060_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-rtx-2060", line: "RTX", model: "2060", vramGb: 6, valuation: { usedValue: 470, wholeBuildFloor: 1300, tier: "RTX_2060" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1660-ti", line: "GTX", model: "1660", suffix: "TI", vramGb: 6, valuation: { usedValue: 470, wholeBuildFloor: 1100, tier: "GTX_1660_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1660-super", line: "GTX", model: "1660", suffix: "SUPER", vramGb: 6, valuation: { usedValue: 430, wholeBuildFloor: 1000, tier: "GTX_1660_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1660", line: "GTX", model: "1660", vramGb: 6, valuation: { usedValue: 360, wholeBuildFloor: 900, tier: "GTX_1660" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1650-super", line: "GTX", model: "1650", suffix: "SUPER", vramGb: 4, valuation: { usedValue: 300, wholeBuildFloor: 850, tier: "GTX_1650_SUPER" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1650", line: "GTX", model: "1650", vramGb: 4, valuation: { usedValue: 240, wholeBuildFloor: 760, tier: "GTX_1650" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1060-6gb", line: "GTX", model: "1060 6GB", vramGb: 6, valuation: { usedValue: 210, wholeBuildFloor: 650, tier: "GTX_1060_6GB" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1060-3gb", line: "GTX", model: "1060 3GB", vramGb: 3, valuation: { usedValue: 160, wholeBuildFloor: 560, tier: "GTX_1060_3GB" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1050-ti", line: "GTX", model: "1050", suffix: "TI", vramGb: 4, valuation: { usedValue: 120, wholeBuildFloor: 450, tier: "GTX_1050_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-1050", line: "GTX", model: "1050", vramGb: 2, valuation: { usedValue: 90, wholeBuildFloor: 380, tier: "GTX_1050" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-960", line: "GTX", model: "960", vramGb: 4, valuation: { usedValue: 80, wholeBuildFloor: 350, tier: "GTX_960" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-950", line: "GTX", model: "950", vramGb: 2, valuation: { usedValue: 60, wholeBuildFloor: 300, tier: "GTX_950" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gtx-750-ti", line: "GTX", model: "750", suffix: "TI", vramGb: 2, valuation: { usedValue: 40, wholeBuildFloor: 240, tier: "GTX_750_TI" } }),
  createNvidiaGpuEntry({ id: "gpu-nvidia-gt-1030", line: "GTX", model: "1030", vramGb: 2, valuation: { usedValue: 40, wholeBuildFloor: 250, tier: "GT_1030" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-9070-xt", model: "9070", suffix: "XT", vramGb: 16, valuation: { newValue: 3390, wholeBuildFloor: 5200, tier: "RX_9070_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-9070", model: "9070", vramGb: 16, valuation: { newValue: 2850, wholeBuildFloor: 4500, tier: "RX_9070" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-9060-xt", model: "9060", suffix: "XT", vramGb: 16, valuation: { newValue: 2200, wholeBuildFloor: 3300, tier: "RX_9060_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-7800-xt", model: "7800", suffix: "XT", vramGb: 16, valuation: { usedValue: 2100, newValue: 2600, wholeBuildFloor: 3600, tier: "RX_7800_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-7700-xt", model: "7700", suffix: "XT", vramGb: 12, valuation: { usedValue: 1550, newValue: 1900, wholeBuildFloor: 2850, tier: "RX_7700_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6800-xt", model: "6800", suffix: "XT", vramGb: 16, valuation: { usedValue: 1500, wholeBuildFloor: 2750, tier: "RX_6800_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6800", model: "6800", vramGb: 16, valuation: { usedValue: 1250, wholeBuildFloor: 2400, tier: "RX_6800" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6750-xt", model: "6750", suffix: "XT", vramGb: 12, valuation: { usedValue: 1120, wholeBuildFloor: 2250, tier: "RX_6750_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6700-xt", model: "6700", suffix: "XT", vramGb: 12, valuation: { usedValue: 960, wholeBuildFloor: 1950, tier: "RX_6700_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6700", model: "6700", vramGb: 10, valuation: { usedValue: 860, wholeBuildFloor: 1750, tier: "RX_6700" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6650-xt", model: "6650", suffix: "XT", vramGb: 8, valuation: { usedValue: 760, wholeBuildFloor: 1550, tier: "RX_6650_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6600-xt", model: "6600", suffix: "XT", vramGb: 8, valuation: { usedValue: 720, wholeBuildFloor: 1500, tier: "RX_6600_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-6600", model: "6600", vramGb: 8, valuation: { usedValue: 650, newValue: 980, wholeBuildFloor: 1350, tier: "RX_6600" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-5700-xt", model: "5700", suffix: "XT", vramGb: 8, valuation: { usedValue: 620, wholeBuildFloor: 1450, tier: "RX_5700_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-5700", model: "5700", vramGb: 8, valuation: { usedValue: 540, wholeBuildFloor: 1300, tier: "RX_5700" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-5600-xt", model: "5600", suffix: "XT", vramGb: 6, valuation: { usedValue: 420, wholeBuildFloor: 1050, tier: "RX_5600_XT" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-580-8gb", model: "580 8GB", vramGb: 8, valuation: { usedValue: 180, wholeBuildFloor: 600, tier: "RX_580_8GB" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-580-4gb", model: "580 4GB", vramGb: 4, valuation: { usedValue: 150, wholeBuildFloor: 540, tier: "RX_580_4GB" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-570-4gb", model: "570 4GB", vramGb: 4, valuation: { usedValue: 130, wholeBuildFloor: 500, tier: "RX_570_4GB" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-560-2gb", model: "560 2GB", vramGb: 2, valuation: { usedValue: 70, wholeBuildFloor: 320, tier: "RX_560_2GB" } }),
  createAmdGpuEntry({ id: "gpu-amd-rx-550", model: "550", vramGb: 2, valuation: { usedValue: 50, wholeBuildFloor: 280, tier: "RX_550" } }),
  createIntelArcGpuEntry({ id: "gpu-intel-arc-a770", model: "A770", vramGb: 16, valuation: { usedValue: 850, wholeBuildFloor: 1800, tier: "ARC_A770" } }),
  createIntelArcGpuEntry({ id: "gpu-intel-arc-b580", model: "B580", vramGb: 12, valuation: { newValue: 1200, wholeBuildFloor: 2300, tier: "ARC_B580" } }),
  createIntelArcGpuEntry({ id: "gpu-intel-arc-b570", model: "B570", vramGb: 10, valuation: { newValue: 980, wholeBuildFloor: 1900, tier: "ARC_B570" } }),
];

export const motherboardCatalog: CatalogComponent[] = [
  createMotherboardEntry({ id: "mb-am4-b450", canonical: "AMD B450 motherboard", aliases: ["b450"], chipset: "B450", platform: "AM4", valuation: { usedValue: 180, newValue: 260 } }),
  createMotherboardEntry({ id: "mb-am4-b550", canonical: "AMD B550 motherboard", aliases: ["b550"], chipset: "B550", platform: "AM4", valuation: { usedValue: 260, newValue: 360 } }),
  createMotherboardEntry({ id: "mb-am4-x570", canonical: "AMD X570 motherboard", aliases: ["x570"], chipset: "X570", platform: "AM4", valuation: { usedValue: 360, newValue: 520 } }),
  createMotherboardEntry({ id: "mb-am5-a620", canonical: "AMD A620 motherboard", aliases: ["a620"], chipset: "A620", platform: "AM5", valuation: { newValue: 420 } }),
  createMotherboardEntry({ id: "mb-am5-b650", canonical: "AMD B650 motherboard", aliases: ["b650"], chipset: "B650", platform: "AM5", valuation: { newValue: 650 } }),
  createMotherboardEntry({ id: "mb-am5-x670", canonical: "AMD X670 motherboard", aliases: ["x670"], chipset: "X670", platform: "AM5", valuation: { newValue: 900 } }),
  createMotherboardEntry({ id: "mb-intel-b460", canonical: "Intel B460 motherboard", aliases: ["b460"], chipset: "B460", platform: "LGA1200", valuation: { usedValue: 180, newValue: 260 } }),
  createMotherboardEntry({ id: "mb-intel-b560", canonical: "Intel B560 motherboard", aliases: ["b560"], chipset: "B560", platform: "LGA1200", valuation: { usedValue: 240, newValue: 340 } }),
  createMotherboardEntry({ id: "mb-intel-h410", canonical: "Intel H410 motherboard", aliases: ["h410"], chipset: "H410", platform: "LGA1200", valuation: { usedValue: 120, newValue: 180 } }),
  createMotherboardEntry({ id: "mb-intel-h610", canonical: "Intel H610 motherboard", aliases: ["h610"], chipset: "H610", platform: "LGA1700", valuation: { newValue: 240 } }),
  createMotherboardEntry({ id: "mb-intel-b660", canonical: "Intel B660 motherboard", aliases: ["b660"], chipset: "B660", platform: "LGA1700", valuation: { newValue: 360 } }),
  createMotherboardEntry({ id: "mb-intel-b760", canonical: "Intel B760 motherboard", aliases: ["b760"], chipset: "B760", platform: "LGA1700", valuation: { newValue: 520 } }),
  createMotherboardEntry({ id: "mb-intel-z690", canonical: "Intel Z690 motherboard", aliases: ["z690"], chipset: "Z690", platform: "LGA1700", valuation: { newValue: 650 } }),
  createMotherboardEntry({ id: "mb-intel-z790", canonical: "Intel Z790 motherboard", aliases: ["z790"], chipset: "Z790", platform: "LGA1700", valuation: { newValue: 900 } }),
];

export const ramMemoryTypes = ["DDR4", "DDR5"] as const;
export const storageKinds = ["NVMe", "SSD", "HDD"] as const;
export const storageInterfaces = ["Gen4", "Gen3", "SATA", "PCIe"] as const;
export const psuEfficiencies = ["80+ Bronze", "80+ Silver", "80+ Gold", "80+ Platinum"] as const;

export const ramCatalog: RamCatalogEntry[] = [
  createRamEntry({ ramGb: 8, memoryType: "DDR4" }),
  createRamEntry({ ramGb: 16, memoryType: "DDR4" }),
  createRamEntry({ ramGb: 16, memoryType: "DDR5" }),
  createRamEntry({ ramGb: 32, memoryType: "DDR4" }),
  createRamEntry({ ramGb: 32, memoryType: "DDR5" }),
  createRamEntry({ ramGb: 64, memoryType: "DDR5" }),
];

export const storageCatalog: StorageCatalogEntry[] = [
  createStorageEntry({ storageGb: 500, storageKind: "SSD", storageInterface: "SATA" }),
  createStorageEntry({ storageGb: 512, storageKind: "NVMe", storageInterface: "PCIe" }),
  createStorageEntry({ storageGb: 1000, storageKind: "NVMe", storageInterface: "Gen3" }),
  createStorageEntry({ storageGb: 1000, storageKind: "NVMe", storageInterface: "Gen4" }),
  createStorageEntry({ storageGb: 2000, storageKind: "NVMe", storageInterface: "Gen4" }),
];

export const psuCatalog: PsuCatalogEntry[] = [
  createPsuEntry({ wattage: 550 }),
  createPsuEntry({ wattage: 650, efficiency: "80+ Bronze" }),
  createPsuEntry({ wattage: 650, efficiency: "80+ Gold" }),
  createPsuEntry({ wattage: 750, efficiency: "80+ Bronze" }),
  createPsuEntry({ wattage: 750, efficiency: "80+ Gold" }),
  createPsuEntry({ wattage: 850, efficiency: "80+ Gold" }),
];

export const cpuAliasMap = buildAliasMap(cpuCatalog);
export const gpuAliasMap = buildAliasMap(gpuCatalog);

const allCatalogComponents = [...cpuCatalog, ...gpuCatalog, ...motherboardCatalog];

function buildAliasMap(catalog: CatalogComponent[]) {
  return catalog.reduce<Record<string, string>>((map, component) => {
    component.aliases.forEach((alias) => {
      map[alias.toLowerCase()] = component.canonical;
    });
    map[component.canonical.toLowerCase()] = component.canonical;
    return map;
  }, {});
}

export function findCatalogComponentByCanonical(canonical: string) {
  const exact = allCatalogComponents.find((entry) => entry.canonical === canonical);
  if (exact) {
    return exact;
  }

  const normalized = normalizeForCatalogLookup(canonical);
  const normalizedExact = allCatalogComponents.find((entry) => normalizeForCatalogLookup(entry.canonical) === normalized);
  if (normalizedExact) {
    return normalizedExact;
  }

  const cpuMeta = getCpuMeta(canonical);
  if (cpuMeta) {
    const cpuMatch = allCatalogComponents.find(
      (entry) => entry.type === "CPU" && normalizeForCatalogLookup(entry.canonical) === normalizeForCatalogLookup(cpuMeta.normalizedName),
    );
    if (cpuMatch) {
      return cpuMatch;
    }
  }

  const gpuMeta = getGpuMeta(canonical);
  if (!gpuMeta) {
    return null;
  }

  const candidateCanonicals = [
    buildFullGpuCatalogName(gpuMeta.normalizedName, gpuMeta.vendor),
    buildFullGpuCatalogName(gpuMeta.baseNormalizedName, gpuMeta.vendor),
  ];

  for (const candidate of candidateCanonicals) {
    const match = allCatalogComponents.find((entry) => normalizeForCatalogLookup(entry.canonical) === normalizeForCatalogLookup(candidate));
    if (match) {
      return match;
    }
  }

  return null;
}

export function findCatalogComponentById(id: string) {
  return allCatalogComponents.find((entry) => entry.id === id) ?? null;
}

export function canonicalPsuName(wattage: number, efficiency?: string) {
  return `${wattage} W${efficiency ? ` ${titleCase(efficiency)}` : ""} PSU`.trim();
}

export function canonicalRamName(ramGb: number, memoryType?: string) {
  return `${ramGb} GB${memoryType ? ` ${memoryType.toUpperCase()}` : ""}`.trim();
}

export function canonicalStorageName(storageGb: number, kind?: string, storageInterface?: string) {
  const sizeLabel = storageGb >= 1000 && storageGb % 1000 === 0 ? `${storageGb / 1000} TB` : `${storageGb} GB`;
  const interfaceLabel = storageInterface ? ` ${storageInterface}` : "";
  const kindLabel = kind ? ` ${kind}` : "";
  return `${sizeLabel}${interfaceLabel}${kindLabel}`.trim();
}

function normalizeForCatalogLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(\d)\s*gb\b/g, "$1gb")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function buildFullGpuCatalogName(shortName: string, vendor: string) {
  if (vendor === "NVIDIA") {
    return `NVIDIA GeForce ${shortName}`;
  }

  if (shortName.startsWith("Radeon ")) {
    return `AMD ${shortName}`;
  }

  return `AMD Radeon ${shortName}`;
}
