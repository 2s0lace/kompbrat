import type { CatalogComponent, ComponentAttributes } from "@/lib/checker/component-catalog";
import {
  canonicalPsuName,
  canonicalRamName,
  canonicalStorageName,
  cpuCatalog,
  gpuCatalog,
  motherboardCatalog,
  psuEfficiencies,
} from "@/lib/checker/component-catalog";
import { findCpuInText, getCpuFamilyHint as getCpuFamilyLabel, getCpuMeta } from "@/lib/checker/cpu-database";
import { findGpuInText, getGpuMeta } from "@/lib/checker/gpu-database";
import { escapeRegExp, normalizeForSearch } from "@/lib/checker/text-preprocessing";
import type { DetectionConfidence, DetectionMethod, DetectionSource, DetectedPart, DetectedPartType, PreprocessedText } from "@/types/checker";

type DetectionCandidate = {
  type: Exclude<DetectedPartType, "CENA">;
  canonicalId?: string;
  canonicalName: string;
  rawMatch: string;
  confidence: DetectionConfidence;
  source: DetectionSource;
  attributes?: ComponentAttributes;
  score: number;
  debug?: {
    method: DetectionMethod;
    label?: string;
    matchedLine?: string;
    pattern?: string;
  };
};

type LabeledLine = {
  label: string;
  normalizedLabel: string;
  value: string;
  rawLine: string;
};

const LABEL_ALIASES: Record<string, string[]> = {
  CPU: ["procesor", "cpu"],
  GPU: ["karta graficzna", "gpu", "grafika", "uklad graficzny", "układ graficzny"],
  PŁYTA: ["plyta glowna", "płyta główna", "plyta", "płyta", "motherboard", "mobo"],
  RAM: ["pamiec ram", "pamięć ram", "ram", "pamiec operacyjna", "pamięć operacyjna"],
  DYSK: ["dysk ssd", "dysk nvme", "dysk", "ssd", "nvme", "m2"],
  PSU: ["zasilacz", "psu"],
  CHŁODZENIE: ["chlodzenie procesora", "chłodzenie procesora", "chlodzenie cpu", "chłodzenie cpu", "chlodzenie", "chłodzenie", "cooler"],
  SYSTEM: ["system", "os", "system operacyjny"],
};

const CPU_INTEL_PATTERN = /\b(?:intel\s+core\s+)?(i[3579])[\s-]?(\d{4,5})(kf|ks|k|f)?\b/i;
const CPU_AMD_PATTERN = /\b(?:amd\s+)?(?:ryzen\s+)?([3579])\s*(\d{4})(x3d|xt|x|g|af|f)?\b/i;
const GPU_NVIDIA_PATTERN = /\b(?:nvidia\s+)?(?:geforce\s+)?(rtx|gtx)\s*([0-9]{3,4})(?:\s*(super|ti))?(?:[^\n\r]{0,60}?)?(?:\b(3|4|6|8|10|12|16|24)\s*gb\b)?/i;
const GPU_AMD_PATTERN = /\b(?:amd\s+)?(?:radeon\s+)?rx\s*([0-9]{3,4})(?:\s*(xt))?(?:[^\n\r]{0,60}?)?(?:\b(4|6|8|10|12|16)\s*gb\b)?/i;
const GPU_ARC_PATTERN = /\b(?:intel\s+)?arc\s+([ab]\d{3})\b/i;
const MOTHERBOARD_MODEL_PATTERN = /\b(?:asus|msi|gigabyte|asrock|biostar|evga)\b[^\n\r]{0,40}\b(?:b|h|z|x|a)\d{3}[a-z]?\b(?:\s*[a-z0-9-]+)?/i;
const CHIPSET_PATTERN = /\b(?:b|h|z|x|a)\d{3}[a-z]?\b/i;
const STORAGE_PATTERN = /\b(120|128|240|250|256|480|500|512|960|1000|1024|2000|2048|1|2|4)\s*(gb|tb)\b(?:[^\n\r]{0,40}?)\b(nvme|m2|m\.2|ssd|hdd|gen4|gen3|pcie|sata)\b/i;
const PSU_PATTERN = /\b(\d{3,4})\s*w\b(?:\s*(80\+\s*(?:bronze|silver|gold|platinum)))?/i;
const COOLER_BRAND_PATTERN = /\b(be\s?quiet!?|noctua|endorfy|silentiumpc|cooler master|arctic|fera|fortis|spartan|navis|aio)\b/i;
const WARRANTY_PATTERN = /\b(gwarancja|pisemna gwarancja|warranty)\b/i;

const priceRegexes = [/\b(\d[\d\s.,]{2,})\s?(zł|zl|pln)\b/i, /\bcena[:\s]+(\d[\d\s.,]{2,})\b/i];

function confidenceRank(confidence: DetectionConfidence) {
  if (confidence === "high") {
    return 3;
  }

  if (confidence === "medium") {
    return 2;
  }

  return 1;
}

function boostConfidence(confidence: DetectionConfidence): DetectionConfidence {
  if (confidence === "low") {
    return "medium";
  }

  return "high";
}

function parseDatabaseConfidence(confidence: number, method: DetectionMethod) {
  if (method === "label") {
    return confidence >= 0.7 ? "high" : "medium";
  }

  if (confidence >= 0.9) {
    return "high";
  }

  if (confidence >= 0.65) {
    return "medium";
  }

  return "low";
}

function detectAlias(preprocessed: PreprocessedText, alias: string) {
  const normalizedAlias = normalizeForSearch(alias);
  const compactAlias = normalizedAlias.replace(/\s+/g, "");

  if (!normalizedAlias) {
    return null;
  }

  const tokenPattern = normalizedAlias
    .split(" ")
    .filter(Boolean)
    .map((token) => escapeRegExp(token))
    .join("[\\s-]*");
  const regex = new RegExp(`(^|\\s)${tokenPattern}(?=$|\\s)`, "i");
  const regexMatch = preprocessed.normalized.match(regex);

  if (regexMatch?.[0]) {
    return {
      matched: regexMatch[0].trim(),
      score: normalizedAlias.split(" ").length * 10 + normalizedAlias.length,
    };
  }

  if (compactAlias && preprocessed.compact.includes(compactAlias)) {
    return {
      matched: alias,
      score: normalizedAlias.split(" ").length * 9 + normalizedAlias.length,
    };
  }

  return null;
}

function detectCatalogComponent(input: {
  preprocessed: PreprocessedText;
  source: DetectionSource;
  catalog: CatalogComponent[];
  method?: DetectionMethod;
  label?: string;
  matchedLine?: string;
}) {
  let best: DetectionCandidate | null = null;

  for (const component of input.catalog) {
    for (const alias of component.aliases) {
      const match = detectAlias(input.preprocessed, alias);

      if (!match) {
        continue;
      }

      const baseConfidence: DetectionConfidence =
        input.method === "label" ? "high" : input.source === "title" ? "high" : alias.split(" ").length >= 3 ? "medium" : "low";
      const candidate: DetectionCandidate = {
        type: component.type,
        canonicalId: component.id,
        canonicalName: component.canonical,
        rawMatch: match.matched,
        confidence: baseConfidence,
        source: input.source,
        attributes: component.attributes,
        score: match.score,
        debug: {
          method: input.method ?? "scan",
          label: input.label,
          matchedLine: input.matchedLine,
          pattern: alias,
        },
      };

      if (!best || candidate.score > best.score) {
        best = candidate;
      }
    }
  }

  return best;
}

function buildCpuFromDatabase(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  const result = findCpuInText(preprocessed.raw);
  if (!result.matched || !result.normalizedName || !result.vendor) {
    return null;
  }

  const meta = getCpuMeta(result.normalizedName);
  const familyLabel = getCpuFamilyLabel(result.normalizedName);
  const modelMatch =
    result.normalizedName.match(/i[3579]-\d{4,5}[A-Z]{0,2}$/i) ??
    result.normalizedName.match(/G\d{4}$/i) ??
    result.normalizedName.match(/FX-\d{4}$/i) ??
    result.normalizedName.match(/\d{4}[A-Z]{0,2}$/i) ??
    result.normalizedName.match(/E[35]-\d{4}\s+v[2345]$/i);
  const confidence = parseDatabaseConfidence(result.confidence, method);

  return {
    type: "CPU",
    canonicalName: result.normalizedName,
    rawMatch: result.rawMatch ?? result.normalizedName,
    confidence,
    source,
    attributes: {
      vendor: result.vendor,
      family:
        meta?.family === "Intel Core"
          ? "Core"
          : meta?.family === "Intel Xeon"
            ? "Xeon"
            : meta?.family === "AMD Ryzen"
              ? "Ryzen"
              : meta?.family?.replace(/^Intel |^AMD /, "") ?? result.family ?? undefined,
      series: familyLabel ?? result.family ?? undefined,
      model: modelMatch?.[0] ?? undefined,
      suffix: result.normalizedName.match(/\b(PRO|T|GE|G|X|XT)\b/i)?.[0]?.toUpperCase(),
      platform: meta?.socketHint ?? undefined,
    },
    score: Math.round(72 + result.confidence * 18 + (meta?.tags.includes("Xeon") ? 4 : 0)),
    debug: {
      method,
      label,
      matchedLine,
      pattern: "CPU_DATABASE",
    },
  } satisfies DetectionCandidate;
}

function detectRam(preprocessed: PreprocessedText, source: DetectionSource) {
  const normalizedRaw = preprocessed.raw
    .replace(/\bGB\(/gi, "GB (")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/(\d)\s*[xX]\s*(\d)/g, "$1x$2")
    .replace(/\s+/g, " ")
    .trim();
  const explicitTotalMatch = normalizedRaw.match(/\b(8|16|24|32|48|64|96|128)\s*GB\b/i);
  const kitMatch = normalizedRaw.match(/\b(\d)\s*[xX]\s*(4|8|12|16|24|32)\s*(?:GB)?\b/i);
  const memoryTypeMatch = normalizedRaw.match(/\b(DDR3|DDR4|DDR5)\b/i);
  const speedMatch = normalizedRaw.match(/\b(2666|3000|3200|3600|5200|5600|6000|6400)\s*MHZ\b/i);
  const brandMatch = normalizedRaw.match(/\b(g\.?\s*skill\s+aegis|g\.?\s*skill|kingston fury|kingston|corsair vengeance|corsair|crucial|patriot|lexar|goodram|adata|xpg)\b/i);

  const explicitTotal = explicitTotalMatch ? Number(explicitTotalMatch[1]) : null;
  const sticks = kitMatch ? Number(kitMatch[1]) : null;
  const perStickGb = kitMatch ? Number(kitMatch[2]) : null;
  const computedTotal = sticks && perStickGb ? sticks * perStickGb : null;

  if (!explicitTotal && !computedTotal) {
    return null;
  }

  const ramGb = explicitTotal ?? computedTotal ?? null;
  if (!ramGb) {
    return null;
  }

  const memoryType = memoryTypeMatch ? String(memoryTypeMatch[1]).toUpperCase() as "DDR4" | "DDR5" | "DDR3" : undefined;
  const speedMhz = speedMatch ? Number(speedMatch[1]) : undefined;
  const model = brandMatch
    ? brandMatch[1]
        .replace(/g\.?\s*skill/i, "G.SKILL")
        .replace(/\s+/g, " ")
        .replace(/\bcorsair\b/i, "Corsair")
        .replace(/\bkingston fury\b/i, "Kingston Fury")
        .replace(/\bkingston\b/i, "Kingston")
        .replace(/\bcrucial\b/i, "Crucial")
        .replace(/\bpatriot\b/i, "Patriot")
        .replace(/\blexar\b/i, "Lexar")
        .replace(/\bgoodram\b/i, "GOODRAM")
        .replace(/\badata\b/i, "ADATA")
        .replace(/\bxpg\b/i, "XPG")
        .replace(/\baegis\b/i, "Aegis")
        .trim()
    : undefined;

  let confidence: DetectionConfidence = source === "title" ? "high" : memoryType ? "medium" : "low";

  if (explicitTotal && computedTotal) {
    confidence = explicitTotal === computedTotal ? "high" : "medium";
  } else if (explicitTotal || computedTotal) {
    confidence = memoryType ? "medium" : "low";
  }

  if (source === "title" && confidence === "medium") {
    confidence = "high";
  }

  return {
    type: "RAM",
    canonicalName: canonicalRamName(ramGb, memoryType),
    rawMatch: normalizedRaw,
    confidence,
    source,
    attributes: {
      ramGb,
      memoryType,
      ramSticks: sticks ?? undefined,
      ramPerStickGb: perStickGb ?? undefined,
      ramSpeedMhz: speedMhz,
      model,
    },
    score: ramGb + (memoryType ? 15 : 0) + (sticks && perStickGb ? 8 : 0) + (speedMhz ? 4 : 0),
  } satisfies DetectionCandidate;
}

function titleCaseComponent(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((chunk) => {
      if (chunk === "bequiet") {
        return "be quiet!";
      }

      if (/[0-9]/.test(chunk) || chunk === chunk.toUpperCase()) {
        return chunk.toUpperCase();
      }

      return chunk.charAt(0).toUpperCase() + chunk.slice(1);
    })
    .join(" ");
}

function buildCpuFallback(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  const intelMatch = preprocessed.raw.match(CPU_INTEL_PATTERN);

  if (intelMatch) {
    const tier = intelMatch[1].toLowerCase();
    const model = intelMatch[2];
    const suffix = (intelMatch[3] ?? "").toUpperCase();
    const modelLabel = `${model}${suffix}`;

    return {
      type: "CPU",
      canonicalName: `Intel Core ${tier}-${modelLabel}`,
      rawMatch: intelMatch[0],
      confidence: method === "label" ? "high" : "medium",
      source,
      attributes: {
        vendor: "Intel",
        family: "Core",
        series: tier.toUpperCase(),
        model: modelLabel,
        suffix: suffix || undefined,
      },
      score: 80,
      debug: {
        method,
        label,
        matchedLine,
        pattern: "CPU_INTEL_PATTERN",
      },
    } satisfies DetectionCandidate;
  }

  const amdMatch = preprocessed.raw.match(CPU_AMD_PATTERN);

  if (!amdMatch) {
    return null;
  }

  const tier = amdMatch[1];
  const model = amdMatch[2];
  const suffix = (amdMatch[3] ?? "").toUpperCase();
  const modelLabel = `${model}${suffix}`;

  return {
    type: "CPU",
    canonicalName: `AMD Ryzen ${tier} ${modelLabel}`,
    rawMatch: amdMatch[0],
    confidence: method === "label" ? "high" : "medium",
    source,
    attributes: {
      vendor: "AMD",
      family: "Ryzen",
      series: `Ryzen ${tier}`,
      model: modelLabel,
      suffix: suffix || undefined,
    },
    score: 78,
    debug: {
      method,
      label,
      matchedLine,
      pattern: "CPU_AMD_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function detectCpu(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  return (
    buildCpuFromDatabase(preprocessed, source, method, label, matchedLine) ??
    detectCatalogComponent({
      preprocessed,
      source,
      catalog: cpuCatalog,
      method,
      label,
      matchedLine,
    }) ?? buildCpuFallback(preprocessed, source, method, label, matchedLine)
  );
}

function toCheckerGpuCanonicalName(normalizedName: string, vendor: "NVIDIA" | "AMD") {
  if (vendor === "NVIDIA") {
    return `NVIDIA GeForce ${normalizedName}`;
  }

  if (normalizedName.startsWith("Radeon ")) {
    return `AMD ${normalizedName}`;
  }

  return `AMD Radeon ${normalizedName}`;
}

function parseGpuConfidence(confidence: number, method: DetectionMethod): DetectionConfidence {
  if (method === "label") {
    return confidence >= 0.7 ? "high" : "medium";
  }

  if (confidence >= 0.9) {
    return "high";
  }

  if (confidence >= 0.65) {
    return "medium";
  }

  return "low";
}

function buildGpuFromDatabase(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  const result = findGpuInText(preprocessed.raw);
  if (!result.matched || !result.normalizedName || !result.vendor) {
    return null;
  }

  const meta = getGpuMeta(result.normalizedName);
  const explicitVramMatch = preprocessed.raw.match(/\b(3|4|6|8|10|12|16|24)\s*GB\b/i);
  const normalizedName =
    explicitVramMatch && !/\b\d{1,2}\s*GB\b/i.test(result.normalizedName)
      ? `${result.normalizedName} ${explicitVramMatch[1]} GB`
      : result.normalizedName;
  const vramMatch = normalizedName.match(/\b(\d{1,2})\s*GB\b/i);
  const confidence = parseGpuConfidence(result.confidence, method);

  return {
    type: "GPU",
    canonicalName: toCheckerGpuCanonicalName(normalizedName, result.vendor),
    rawMatch: result.rawMatch ?? normalizedName,
    confidence,
    source,
    attributes: {
      vendor: result.vendor,
      family: result.vendor === "NVIDIA" ? "GeForce" : "Radeon",
      series: meta?.series ?? result.series ?? undefined,
      model: meta?.baseNormalizedName ?? result.normalizedName,
      vramGb: vramMatch ? Number(vramMatch[1]) : undefined,
    },
    score: Math.round(70 + result.confidence * 20 + (normalizedName !== (meta?.baseNormalizedName ?? normalizedName) ? 8 : 0)),
    debug: {
      method,
      label,
      matchedLine,
      pattern: "GPU_DATABASE",
    },
  } satisfies DetectionCandidate;
}

function buildGpuFallback(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  const nvidiaMatch = preprocessed.raw.match(GPU_NVIDIA_PATTERN);

  if (nvidiaMatch) {
    const line = String(nvidiaMatch[1]).toUpperCase();
    const model = nvidiaMatch[2];
    const suffix = nvidiaMatch[3] ? ` ${String(nvidiaMatch[3]).toUpperCase()}` : "";
    const vramGb = nvidiaMatch[4] ? Number(nvidiaMatch[4]) : undefined;

    return {
      type: "GPU",
      canonicalName: `NVIDIA GeForce ${line} ${model}${suffix}`,
      rawMatch: nvidiaMatch[0],
      confidence: method === "label" ? "high" : "medium",
      source,
      attributes: {
        vendor: "NVIDIA",
        family: "GeForce",
        series: line,
        model,
        suffix: suffix.trim() || undefined,
        vramGb,
      },
      score: 75,
      debug: {
        method,
        label,
        matchedLine,
        pattern: "GPU_NVIDIA_PATTERN",
      },
    } satisfies DetectionCandidate;
  }

  const amdMatch = preprocessed.raw.match(GPU_AMD_PATTERN);

  if (amdMatch) {
    const model = amdMatch[1];
    const suffix = amdMatch[2] ? " XT" : "";
    const vramGb = amdMatch[3] ? Number(amdMatch[3]) : undefined;

    return {
      type: "GPU",
      canonicalName: `AMD Radeon RX ${model}${suffix}`,
      rawMatch: amdMatch[0],
      confidence: method === "label" ? "high" : "medium",
      source,
      attributes: {
        vendor: "AMD",
        family: "Radeon",
        series: "RX",
        model,
        suffix: suffix.trim() || undefined,
        vramGb,
      },
      score: 72,
      debug: {
        method,
        label,
        matchedLine,
        pattern: "GPU_AMD_PATTERN",
      },
    } satisfies DetectionCandidate;
  }

  const arcMatch = preprocessed.raw.match(GPU_ARC_PATTERN);

  if (!arcMatch) {
    return null;
  }

  const model = arcMatch[1].toUpperCase();

  return {
    type: "GPU",
    canonicalName: `Intel Arc ${model}`,
    rawMatch: arcMatch[0],
    confidence: method === "label" ? "high" : "medium",
    source,
    attributes: {
      vendor: "Intel",
      family: "Arc",
      series: "Arc",
      model,
    },
    score: 68,
    debug: {
      method,
      label,
      matchedLine,
      pattern: "GPU_ARC_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function detectGpu(preprocessed: PreprocessedText, source: DetectionSource, method: DetectionMethod, label?: string, matchedLine?: string) {
  return (
    buildGpuFromDatabase(preprocessed, source, method, label, matchedLine) ??
    detectCatalogComponent({
      preprocessed,
      source,
      catalog: gpuCatalog,
      method,
      label,
      matchedLine,
    }) ?? buildGpuFallback(preprocessed, source, method, label, matchedLine)
  );
}

function detectStorage(preprocessed: PreprocessedText, source: DetectionSource) {
  const match = preprocessed.normalized.match(
    /\b(120|128|240|250|256|480|500|512|960|1000|1024|2000|2048|1|2|4)\s*(gb|tb)\b(?:\s*(nvme|ssd|hdd|gen4|gen3|pcie|sata))?/i,
  );

  if (!match) {
    return null;
  }

  const rawSize = Number(match[1]);
  const unit = String(match[2]).toUpperCase();
  const storageGb = unit === "TB" ? rawSize * 1000 : rawSize;
  const tech = match[3]?.toLowerCase();
  const normalizedText = preprocessed.normalized;
  const storageKind =
    tech === "hdd" ? "HDD" : tech === "ssd" ? "SSD" : normalizedText.includes("hdd") ? "HDD" : normalizedText.includes("ssd") ? "SSD" : "NVMe";
  const storageInterface = normalizedText.includes("gen4")
    ? "Gen4"
    : normalizedText.includes("gen3")
      ? "Gen3"
      : normalizedText.includes("pcie")
        ? "PCIe"
        : normalizedText.includes("sata")
          ? "SATA"
          : undefined;
  const confidence: DetectionConfidence =
    source === "title" ? "medium" : storageKind === "NVMe" ? "medium" : "low";

  return {
    type: "DYSK",
    canonicalName: canonicalStorageName(storageGb, storageKind, storageInterface),
    rawMatch: match[0],
    confidence,
    source,
    attributes: {
      storageGb,
      storageKind,
      storageInterface,
    },
    score: storageGb / 10 + (storageInterface === "Gen4" ? 20 : 0),
  } satisfies DetectionCandidate;
}

function detectMotherboard(preprocessed: PreprocessedText, source: DetectionSource) {
  return detectCatalogComponent({
    preprocessed,
    source,
    catalog: motherboardCatalog,
  });
}

function detectPsu(preprocessed: PreprocessedText, source: DetectionSource) {
  const match = preprocessed.normalized.match(/\b(\d{3,4})\s*w\b(?:\s*(80\+\s*(?:bronze|silver|gold|platinum)))?/i);

  if (!match) {
    return null;
  }

  const wattage = Number(match[1]);
  const efficiency = psuEfficiencies.find((entry) => normalizeForSearch(entry) === normalizeForSearch(match[2] ?? ""));
  const confidence: DetectionConfidence =
    source === "title" ? (efficiency ? "high" : "medium") : efficiency ? "medium" : "low";

  return {
    type: "PSU",
    canonicalName: canonicalPsuName(wattage, efficiency),
    rawMatch: match[0],
    confidence,
    source,
    attributes: {
      wattage,
      efficiency,
    },
    score: wattage / 10 + (efficiency ? 18 : 0),
  } satisfies DetectionCandidate;
}

function detectMotherboardFromLabel(preprocessed: PreprocessedText, source: DetectionSource, label: string, matchedLine: string) {
  const catalogHit = detectCatalogComponent({
    preprocessed,
    source,
    catalog: motherboardCatalog,
    method: "label",
    label,
    matchedLine,
  });

  const raw = matchedLine.trim();
  const modelMatch = raw.match(MOTHERBOARD_MODEL_PATTERN);

  if (modelMatch) {
    const chipset = raw.match(CHIPSET_PATTERN)?.[0]?.toUpperCase();

    return {
      type: "PŁYTA",
      canonicalId: catalogHit?.canonicalId,
      canonicalName: titleCaseComponent(modelMatch[0].replace(/\s+/g, " ").trim()),
      rawMatch: raw,
      confidence: "high",
      source,
      attributes: {
        ...catalogHit?.attributes,
        chipset: chipset ?? catalogHit?.attributes?.chipset,
      },
      score: 82,
      debug: {
        method: "label",
        label,
        matchedLine,
        pattern: "MOTHERBOARD_MODEL_PATTERN",
      },
    } satisfies DetectionCandidate;
  }

  const chipsetMatch = raw.match(CHIPSET_PATTERN);
  if (!chipsetMatch) {
    return catalogHit;
  }

  return {
    type: "PŁYTA",
    canonicalId: catalogHit?.canonicalId,
    canonicalName: chipsetMatch[0].toUpperCase(),
    rawMatch: raw,
    confidence: "high",
    source,
    attributes: {
      ...catalogHit?.attributes,
      chipset: chipsetMatch[0].toUpperCase(),
    },
    score: 76,
    debug: {
      method: "label",
      label,
      matchedLine,
      pattern: "CHIPSET_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function detectStorageFromLabel(preprocessed: PreprocessedText, source: DetectionSource, label: string, matchedLine: string) {
  const match = preprocessed.raw.match(STORAGE_PATTERN) ?? preprocessed.normalized.match(STORAGE_PATTERN);
  if (!match) {
    return detectStorage(preprocessed, source);
  }

  const rawSize = Number(match[1]);
  const unit = String(match[2]).toUpperCase();
  const storageGb = unit === "TB" ? rawSize * 1000 : rawSize;
  const rawLine = normalizeForSearch(preprocessed.raw);
  const storageKind =
    /hdd/.test(rawLine) ? "HDD" : /ssd/.test(rawLine) || /nvme|m2|m 2/.test(rawLine) ? (/nvme|m2|m 2/.test(rawLine) ? "NVMe" : "SSD") : "NVMe";
  const storageInterface =
    /gen4/.test(rawLine) ? "Gen4" : /gen3/.test(rawLine) ? "Gen3" : /pcie|nvme|m2|m 2/.test(rawLine) ? "PCIe" : /sata/.test(rawLine) ? "SATA" : undefined;

  return {
    type: "DYSK",
    canonicalName: canonicalStorageName(storageGb, storageKind, storageInterface),
    rawMatch: matchedLine,
    confidence: "high",
    source,
    attributes: {
      storageGb,
      storageKind,
      storageInterface,
    },
    score: 70,
    debug: {
      method: "label",
      label,
      matchedLine,
      pattern: "STORAGE_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function detectPsuFromLabel(preprocessed: PreprocessedText, source: DetectionSource, label: string, matchedLine: string) {
  const match = preprocessed.raw.match(PSU_PATTERN);
  if (!match) {
    return detectPsu(preprocessed, source);
  }

  const wattage = Number(match[1]);
  const efficiency = psuEfficiencies.find((entry) => normalizeForSearch(entry) === normalizeForSearch(match[2] ?? ""));

  return {
    type: "PSU",
    canonicalName: canonicalPsuName(wattage, efficiency),
    rawMatch: matchedLine,
    confidence: efficiency ? "high" : "medium",
    source,
    attributes: {
      wattage,
      efficiency,
    },
    score: 66,
    debug: {
      method: "label",
      label,
      matchedLine,
      pattern: "PSU_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function detectCoolerFromLabel(preprocessed: PreprocessedText, source: DetectionSource, label: string, matchedLine: string) {
  const match = preprocessed.raw.match(COOLER_BRAND_PATTERN);
  if (!match) {
    return null;
  }

  const brand = normalizeForSearch(match[1]) === "bequiet" || normalizeForSearch(match[1]) === "be quiet"
    ? "be quiet!"
    : titleCaseComponent(match[1].replace(/\s+/g, " ").trim());

  return {
    type: "CHŁODZENIE",
    canonicalName: brand,
    rawMatch: matchedLine,
    confidence: brand === "be quiet!" ? "high" : "medium",
    source,
    score: 50,
    debug: {
      method: "label",
      label,
      matchedLine,
      pattern: "COOLER_BRAND_PATTERN",
    },
  } satisfies DetectionCandidate;
}

function buildDetectedPart(candidate: DetectionCandidate): DetectedPart {
  return {
    type: candidate.type,
    name: candidate.canonicalName,
    confidence: candidate.confidence,
    source: candidate.source,
    canonicalId: candidate.canonicalId,
    rawMatch: candidate.rawMatch,
    attributes: candidate.attributes,
    debug: candidate.debug,
  };
}

function chooseBetterPart(existing: DetectedPart, next: DetectedPart) {
  const existingRank = confidenceRank(existing.confidence);
  const nextRank = confidenceRank(next.confidence);

  if (nextRank > existingRank) {
    return next;
  }

  if (nextRank < existingRank) {
    return existing;
  }

  const existingAttrCount = Object.keys(existing.attributes ?? {}).length;
  const nextAttrCount = Object.keys(next.attributes ?? {}).length;

  if (nextAttrCount > existingAttrCount) {
    return next;
  }

  return next.name.length > existing.name.length ? next : existing;
}

export function pushPart(parts: DetectedPart[], candidate: DetectedPart) {
  const existing = parts.find((part) => part.type === candidate.type);

  if (!existing) {
    parts.push(candidate);
    return;
  }

  const better = chooseBetterPart(existing, candidate);

  if (better !== existing) {
    const index = parts.indexOf(existing);
    parts[index] = better;
  }
}

export function extractStructuredDetections(preprocessed: PreprocessedText, source: DetectionSource) {
  const detections: Array<DetectionCandidate | null> = [
    detectCpu(preprocessed, source, "scan"),
    detectGpu(preprocessed, source, "scan"),
    detectRam(preprocessed, source),
    detectStorage(preprocessed, source),
    detectMotherboard(preprocessed, source),
    detectPsu(preprocessed, source),
  ];

  return detections.filter((candidate): candidate is DetectionCandidate => Boolean(candidate)).map(buildDetectedPart);
}

function extractLabeledLines(rawText: string) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([^:–—-]{2,40})\s*[:–—-]\s*(.+)$/);
      if (!match) {
        return null;
      }

      return {
        label: match[1].trim(),
        normalizedLabel: normalizeForSearch(match[1]),
        value: match[2].trim(),
        rawLine: line,
      } satisfies LabeledLine;
    })
    .filter((line): line is LabeledLine => Boolean(line));
}

function getLabelType(normalizedLabel: string) {
  for (const [type, aliases] of Object.entries(LABEL_ALIASES)) {
    if (aliases.some((alias) => normalizedLabel === normalizeForSearch(alias))) {
      return type;
    }
  }

  return null;
}

function detectLabeledLine(line: LabeledLine, source: DetectionSource) {
  const preprocessed = {
    raw: line.value,
    normalized: normalizeForSearch(line.value),
    compact: normalizeForSearch(line.value).replace(/\s+/g, ""),
  } satisfies PreprocessedText;
  const type = getLabelType(line.normalizedLabel);

  switch (type) {
    case "CPU":
      return detectCpu(preprocessed, source, "label", line.label, line.rawLine);
    case "GPU":
      return detectGpu(preprocessed, source, "label", line.label, line.rawLine);
    case "PŁYTA":
      return detectMotherboardFromLabel(preprocessed, source, line.label, line.value);
    case "RAM": {
      const detected = detectRam(preprocessed, source);
      return detected
        ? {
            ...detected,
            confidence: "high",
            debug: {
              method: "label",
              label: line.label,
              matchedLine: line.rawLine,
              pattern: "RAM_LABEL",
            },
          }
        : null;
    }
    case "DYSK":
      return detectStorageFromLabel(preprocessed, source, line.label, line.value);
    case "PSU":
      return detectPsuFromLabel(preprocessed, source, line.label, line.value);
    case "CHŁODZENIE":
      return detectCoolerFromLabel(preprocessed, source, line.label, line.value);
    default:
      return null;
  }
}

export function extractOfferDetections(rawText: string, source: DetectionSource) {
  const preprocessed = {
    raw: rawText,
    normalized: normalizeForSearch(rawText),
    compact: normalizeForSearch(rawText).replace(/\s+/g, ""),
  } satisfies PreprocessedText;

  const labeledDetections = extractLabeledLines(rawText)
    .map((line) => detectLabeledLine(line, source))
    .filter((candidate): candidate is DetectionCandidate => Boolean(candidate))
    .map(buildDetectedPart);

  const fallbackDetections = extractStructuredDetections(preprocessed, source);

  return mergeDetectedParts(labeledDetections, fallbackDetections);
}

export function mergeDetectedParts(titleParts: DetectedPart[], descriptionParts: DetectedPart[]) {
  const merged: DetectedPart[] = [];

  [...titleParts, ...descriptionParts].forEach((part) => pushPart(merged, part));

  return merged.map((part) => {
    const titlePart = titleParts.find((item) => item.type === part.type);
    const descriptionPart = descriptionParts.find((item) => item.type === part.type);

    if (titlePart && descriptionPart && titlePart.name === descriptionPart.name) {
      const methodHint = titlePart.debug?.method ?? descriptionPart.debug?.method;
      const shouldBoostConfidence =
        !(part.type === "PSU" && methodHint === "label" && !(part.attributes?.efficiency && part.attributes.efficiency.length > 0));

      return {
        ...part,
        source: "merged" as const,
        confidence: shouldBoostConfidence
          ? boostConfidence(chooseBetterPart(titlePart, descriptionPart).confidence)
          : chooseBetterPart(titlePart, descriptionPart).confidence,
      };
    }

    return part;
  });
}

export function parsePrice(...preprocessedTexts: PreprocessedText[]) {
  for (const preprocessed of preprocessedTexts) {
    for (const regex of priceRegexes) {
      const raw = preprocessed.raw.match(regex)?.[1];

      if (!raw) {
        continue;
      }

      const digitsOnly = raw.replace(/[^\d]/g, "");
      const value = Number(digitsOnly);

      if (Number.isFinite(value) && value >= 100 && value <= 100_000) {
        return value;
      }
    }
  }

  return undefined;
}

export function buildPricePart(price: number, source: DetectionSource): DetectedPart {
  return {
    type: "CENA",
    name: `${price} zł`,
    confidence: source === "explicit" ? "high" : "medium",
    source,
    attributes: {
      vendor: "PLN",
    },
  };
}
