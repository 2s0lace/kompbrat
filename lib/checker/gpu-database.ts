type GpuVendor = "NVIDIA" | "AMD";

export type GpuTierHint = "ancient" | "very_weak" | "weak" | "entry" | "mid" | "upper_mid" | "high_end" | "enthusiast";

export type GpuDatabaseEntry = {
  id: string;
  vendor: GpuVendor;
  normalizedName: string;
  shortName: string;
  family: string;
  series: string;
  architectureEra: string;
  releaseYear: number;
  tags: string[];
  variants: string[];
  aliases: string[];
  desktopGaming: true;
  tierHint: GpuTierHint;
};

type SourceEntry = {
  name: string;
  tags?: string[];
  variants?: string[];
  aliases?: string[];
};

type SearchCandidate = {
  vendor: GpuVendor;
  series: string;
  tags: string[];
  normalizedName: string;
  baseNormalizedName: string;
  aliases: string[];
  regexes: RegExp[];
  confidence: number;
};

const GPU_TEXT_NOISE = [
  "asus",
  "msi",
  "gigabyte",
  "aorus",
  "asrock",
  "zotac",
  "palit",
  "gainward",
  "inno3d",
  "sapphire",
  "powercolor",
  "xfx",
  "biostar",
  "yeston",
  "tul",
  "tuf",
  "rog",
  "strix",
  "dual",
  "duo",
  "eagle",
  "ventus",
  "windforce",
  "gaming",
  "gamingx",
  "gaming z",
  "gaming x",
  "gaming oc",
  "oc",
  "phoenix",
  "armor",
  "mech",
  "pulse",
  "nitro",
  "nitro\\+",
  "hellhound",
  "red devil",
  "fighter",
  "challenger",
  "steel legend",
  "swift",
  "qick",
  "merc",
  "white",
  "black",
  "v2",
  "lhr",
  "karta",
  "graficzna",
  "graphics",
  "graphic",
  "card",
  "gpu",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/(\d)(gb|g)\b/g, "$1 gb")
    .replace(/\b2048\s*sp\b/g, "2048sp")
    .replace(/\b640\s*sp\b/g, "640sp")
    .replace(/\bm\.?2\b/g, "m2")
    .replace(/[()[\],/+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function prepareGpuSearchText(value: string) {
  const normalized = normalizeText(value)
    .replace(/(\d)(ti|xt|gre|gme|super)\b/g, "$1 $2")
    .replace(/\b(geforce|radeon)\b/g, "$1")
    .replace(new RegExp(`\\b(?:${GPU_TEXT_NOISE.join("|")})\\b`, "g"), " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    normalized,
    compact: normalized.replace(/\s+/g, ""),
  };
}

function hasExplicitVariant(entry: SourceEntry) {
  return /\b\d+\s*gb\b/i.test(entry.name);
}

function extractPrefix(name: string) {
  const match = name.match(/^(GTX|RTX|GT|RX|R7|R9)\s+(.+)$/i);
  if (!match) {
    return null;
  }

  return {
    prefix: match[1].toUpperCase(),
    rest: match[2],
  };
}

function buildVariantName(baseName: string, variant: string) {
  return `${baseName} ${variant}`.replace(/\s+/g, " ").trim();
}

function buildAliasSet(name: string, vendor: GpuVendor, manualAliases: string[] = []) {
  const aliases = new Set<string>();
  const normalizedName = normalizeText(name);
  const compactName = compact(name);

  aliases.add(normalizedName);
  aliases.add(compactName);

  if (vendor === "NVIDIA") {
    aliases.add(normalizeText(`geforce ${name}`));
    aliases.add(normalizeText(`nvidia geforce ${name}`));
  } else {
    aliases.add(normalizeText(`radeon ${name}`));
    aliases.add(normalizeText(`amd radeon ${name}`));
  }

  const prefixed = extractPrefix(name);
  if (prefixed) {
    const restNormalized = normalizeText(prefixed.rest);
    const restCompact = compact(prefixed.rest);
    const fullCompact = `${prefixed.prefix.toLowerCase()}${restCompact}`;

    aliases.add(normalizeText(`${prefixed.prefix} ${prefixed.rest}`));
    aliases.add(fullCompact);

    if (/\b(super|ti|xt|gre|gme|2048sp|640sp|vega|fury|nano|vii|liquid cooled|50th anniversary|oem|china|\d+\s*gb)\b/i.test(restNormalized)) {
      aliases.add(restNormalized);
      aliases.add(restCompact);
    }

    const numberMatch = restNormalized.match(/^(\d{3,4})(?:\s+(super|ti|xt|gre|gme))?(?:\s+(super|ti))?(?:\s+(\d+\s*gb|2048sp|640sp))?/i);
    if (numberMatch) {
      const digits = numberMatch[1];
      const suffixA = (numberMatch[2] ?? "").toLowerCase();
      const suffixB = (numberMatch[3] ?? "").toLowerCase();
      const memory = (numberMatch[4] ?? "").replace(/\s+/g, "").toLowerCase();
      const suffixChain = [suffixA, suffixB].filter(Boolean).join("");

      if (suffixChain === "super") {
        aliases.add(`${digits}s`);
      }

      if (suffixChain === "ti") {
        aliases.add(`${digits}ti`);
      }

      if (suffixChain === "tisuper" || suffixChain === "superti") {
        aliases.add(`${digits}ti super`);
        aliases.add(`${digits}tisuper`);
      }

      if (suffixChain === "xt") {
        aliases.add(`${digits}xt`);
      }

      if (suffixChain === "gre") {
        aliases.add(`${digits}gre`);
      }

      if (suffixChain === "gme") {
        aliases.add(`${digits}gme`);
      }

      if (memory) {
        aliases.add(`${digits} ${memory.replace(/gb$/, " gb")}`);
        aliases.add(`${digits}${memory}`);
        if (suffixChain) {
          aliases.add(`${digits}${suffixChain}${memory}`);
          aliases.add(`${digits} ${suffixChain} ${memory.replace(/gb$/, " gb")}`);
        }
      }
    }
  } else if (/^Radeon VII$/i.test(name)) {
    aliases.add("radeonvii");
  }

  for (const alias of manualAliases) {
    aliases.add(normalizeText(alias));
    aliases.add(compact(alias));
  }

  return unique([...aliases]);
}

function buildAliasRegex(alias: string) {
  const normalized = normalizeText(alias);
  const compactAlias = compact(alias);
  const tokenPattern = normalized
    .split(" ")
    .filter(Boolean)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s-]*");

  return unique([
    `(^|[^a-z0-9])(${tokenPattern})(?=$|[^a-z0-9])`,
    compactAlias && compactAlias !== normalized ? `(^|[^a-z0-9])(${compactAlias})(?=$|[^a-z0-9])` : "",
  ])
    .filter(Boolean)
    .map((pattern) => new RegExp(pattern, "i"));
}

function inferTierHint(name: string, releaseYear: number): GpuTierHint {
  const normalized = normalizeText(name);

  if (/(5090|4090|3090 ti|7900 xtx)/.test(normalized)) {
    return "enthusiast";
  }

  if (/(5080|4080 super|4080|3090|3080 ti|7900 xt|7900 gre|9070 xt|5070 ti|6950 xt|6900 xt)/.test(normalized)) {
    return "high_end";
  }

  if (/(4070 ti super|4070 ti|4070 super|4070|7800 xt|7700 xt|6800 xt|6800|3080|3070 ti|9070|5070|9060 xt|vega 64|radeon vii)/.test(normalized)) {
    return "upper_mid";
  }

  if (/(3070|3060 ti|6750 xt|6700 xt|6700|6650 xt|6600 xt|5700 xt|5700|2080 ti|2080 super|2080|2070 super|2070|9060|5060 ti|5060|4060 ti|4060|7600 xt|7600|7650 gre|590|vega 56|fury x|fury|nano)/.test(normalized)) {
    return "mid";
  }

  if (/(3060|3050|2060 super|2060|1660 ti|1660 super|1660|1650 super|5600 xt|5500 xt|580|580x|570x|570|480|390x|390|380x|380|1080 ti|1080|1070 ti|1070|980 ti|980|970)/.test(normalized)) {
    return "entry";
  }

  if (/(1650|1630|1060|1050 ti|1050|960|950|560 xt|560x|560d|560|550x|550|460|455|370x|370|360|r9 285|1030|6400|6500 xt|5300 xt|5300|6300|7400|7700 oem)/.test(normalized)) {
    return releaseYear <= 2015 ? "very_weak" : "weak";
  }

  return releaseYear <= 2015 ? "ancient" : "very_weak";
}

function makeEntry(input: {
  vendor: GpuVendor;
  series: string;
  architectureEra: string;
  releaseYear: number;
  entry: SourceEntry;
}) {
  const aliases = unique([
    ...buildAliasSet(input.entry.name, input.vendor, input.entry.aliases ?? []),
    ...(input.entry.variants ?? []).flatMap((variant) => buildAliasSet(buildVariantName(input.entry.name, variant), input.vendor)),
  ]);
  const tags = input.entry.tags ?? [];

  return {
    id: slugify(`${input.vendor}-${input.entry.name}-${tags.join("-") || "base"}`),
    vendor: input.vendor,
    normalizedName: input.entry.name,
    shortName: input.entry.name,
    family: input.vendor === "NVIDIA" ? "GeForce" : "Radeon",
    series: input.series,
    architectureEra: input.architectureEra,
    releaseYear: input.releaseYear,
    tags,
    variants: input.entry.variants ?? [],
    aliases,
    desktopGaming: true,
    tierHint: inferTierHint(input.entry.name, input.releaseYear),
  } satisfies GpuDatabaseEntry;
}

function buildEntries() {
  const entries: GpuDatabaseEntry[] = [];
  const pushGroup = (
    vendor: GpuVendor,
    series: string,
    architectureEra: string,
    releaseYear: number,
    cards: SourceEntry[],
  ) => {
    cards.forEach((entry) => entries.push(makeEntry({ vendor, series, architectureEra, releaseYear, entry })));
  };

  pushGroup("NVIDIA", "GeForce Maxwell", "Maxwell", 2014, [
    { name: "GTX 745 OEM", tags: ["OEM"] },
    { name: "GTX 750" },
    { name: "GTX 750 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce 900", "Maxwell", 2015, [
    { name: "GTX 950" },
    { name: "GTX 950 OEM", tags: ["OEM"] },
    { name: "GTX 960" },
    { name: "GTX 960 OEM", tags: ["OEM"] },
    { name: "GTX 970" },
    { name: "GTX 980" },
    { name: "GTX 980 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce 10", "Pascal", 2016, [
    { name: "GT 1030" },
    { name: "GTX 1050" },
    { name: "GTX 1050 Ti" },
    { name: "GTX 1060", variants: ["3 GB", "6 GB"] },
    { name: "GTX 1070" },
    { name: "GTX 1070 Ti" },
    { name: "GTX 1080" },
    { name: "GTX 1080 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce GTX 16", "Turing", 2019, [
    { name: "GTX 1630" },
    { name: "GTX 1650" },
    { name: "GTX 1650 Super" },
    { name: "GTX 1660" },
    { name: "GTX 1660 Super" },
    { name: "GTX 1660 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce RTX 20", "Turing", 2019, [
    { name: "RTX 2060", variants: ["12 GB"] },
    { name: "RTX 2060 Super" },
    { name: "RTX 2070" },
    { name: "RTX 2070 Super" },
    { name: "RTX 2080" },
    { name: "RTX 2080 Super" },
    { name: "RTX 2080 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce RTX 30", "Ampere", 2021, [
    { name: "RTX 3050", variants: ["6 GB", "8 GB"] },
    { name: "RTX 3050 OEM", tags: ["OEM"] },
    { name: "RTX 3060", variants: ["8 GB", "12 GB"] },
    { name: "RTX 3060 Ti" },
    { name: "RTX 3070" },
    { name: "RTX 3070 Ti" },
    { name: "RTX 3080", variants: ["10 GB", "12 GB"] },
    { name: "RTX 3080 Ti" },
    { name: "RTX 3090" },
    { name: "RTX 3090 Ti" },
  ]);

  pushGroup("NVIDIA", "GeForce RTX 40", "Ada Lovelace", 2023, [
    { name: "RTX 4060" },
    { name: "RTX 4060 Ti", variants: ["8 GB", "16 GB"] },
    { name: "RTX 4070" },
    { name: "RTX 4070 Super" },
    { name: "RTX 4070 Ti" },
    { name: "RTX 4070 Ti Super" },
    { name: "RTX 4080" },
    { name: "RTX 4080 Super" },
    { name: "RTX 4090" },
  ]);

  pushGroup("NVIDIA", "GeForce RTX 50", "Blackwell", 2025, [
    { name: "RTX 5050" },
    { name: "RTX 5060" },
    { name: "RTX 5060 Ti", variants: ["8 GB", "16 GB"] },
    { name: "RTX 5070" },
    { name: "RTX 5070 Ti" },
    { name: "RTX 5080" },
    { name: "RTX 5090" },
  ]);

  pushGroup("AMD", "Radeon 200", "GCN", 2014, [{ name: "R9 285" }]);

  pushGroup("AMD", "Radeon 300 / Fury", "GCN", 2015, [
    { name: "R7 360" },
    { name: "R7 370" },
    { name: "R9 360" },
    { name: "R9 370" },
    { name: "R9 370X" },
    { name: "R9 380" },
    { name: "R9 380X" },
    { name: "R9 390" },
    { name: "R9 390X" },
    { name: "R9 Nano" },
    { name: "R9 Fury" },
    { name: "R9 Fury X" },
  ]);

  pushGroup("AMD", "Radeon RX 400", "Polaris", 2016, [
    { name: "RX 455 OEM", tags: ["OEM"] },
    { name: "RX 460" },
    { name: "RX 470D", tags: ["China"] },
    { name: "RX 470" },
    { name: "RX 480" },
  ]);

  pushGroup("AMD", "Radeon RX 500", "Polaris", 2017, [
    { name: "RX 540 OEM", tags: ["OEM"] },
    { name: "RX 540X OEM", tags: ["OEM"] },
    { name: "RX 550" },
    { name: "RX 550 640SP" },
    { name: "RX 550X" },
    { name: "RX 550X 640SP OEM", tags: ["OEM"] },
    { name: "RX 560" },
    { name: "RX 560D OEM", tags: ["OEM", "China"] },
    { name: "RX 560X" },
    { name: "RX 560 XT", tags: ["China"] },
    { name: "RX 570", variants: ["4 GB", "8 GB"] },
    { name: "RX 570X" },
    { name: "RX 580 2048SP", tags: ["China"] },
    { name: "RX 580", variants: ["4 GB", "8 GB"] },
    { name: "RX 580X" },
    { name: "RX 590 GME", tags: ["China"] },
    { name: "RX 590" },
  ]);

  pushGroup("AMD", "Radeon Vega / VII", "Vega", 2018, [
    { name: "RX Vega 56" },
    { name: "RX Vega 64" },
    { name: "RX Vega 64 Liquid Cooled", aliases: ["vega 64 lc"] },
    { name: "Radeon VII" },
  ]);

  pushGroup("AMD", "Radeon RX 5000", "RDNA", 2019, [
    { name: "RX 5300 OEM", tags: ["OEM"] },
    { name: "RX 5300 XT OEM", tags: ["OEM"] },
    { name: "RX 5500" },
    { name: "RX 5500 XT", variants: ["4 GB", "8 GB"] },
    { name: "RX 5600 OEM", tags: ["OEM"] },
    { name: "RX 5600 XT" },
    { name: "RX 5700" },
    { name: "RX 5700 XT" },
    { name: "RX 5700 XT 50th Anniversary Edition", aliases: ["5700 xt 50th", "50th anniversary 5700 xt"] },
  ]);

  pushGroup("AMD", "Radeon RX 6000", "RDNA 2", 2021, [
    { name: "RX 6300 OEM", tags: ["OEM"] },
    { name: "RX 6400" },
    { name: "RX 6500 XT" },
    { name: "RX 6600" },
    { name: "RX 6600 XT" },
    { name: "RX 6650 XT" },
    { name: "RX 6700" },
    { name: "RX 6700 XT" },
    { name: "RX 6750 XT" },
    { name: "RX 6800" },
    { name: "RX 6800 XT" },
    { name: "RX 6900 XT" },
    { name: "RX 6950 XT" },
  ]);

  pushGroup("AMD", "Radeon RX 7000", "RDNA 3", 2023, [
    { name: "RX 7400 OEM", tags: ["OEM"] },
    { name: "RX 7600" },
    { name: "RX 7650 GRE", tags: ["China"] },
    { name: "RX 7600 XT" },
    { name: "RX 7700 OEM", tags: ["OEM"] },
    { name: "RX 7700 XT" },
    { name: "RX 7800 XT" },
    { name: "RX 7900 GRE" },
    { name: "RX 7900 XT" },
    { name: "RX 7900 XTX" },
  ]);

  pushGroup("AMD", "Radeon RX 9000", "RDNA 4", 2025, [
    { name: "RX 9060" },
    { name: "RX 9060 XT", variants: ["8 GB", "16 GB"] },
    { name: "RX 9070 GRE" },
    { name: "RX 9070" },
    { name: "RX 9070 XT" },
  ]);

  return entries;
}

const entries = buildEntries();

function buildSearchIndex(databaseEntries: GpuDatabaseEntry[]) {
  const candidates: SearchCandidate[] = [];
  const exactMetaIndex = new Map<string, SearchCandidate>();

  for (const entry of databaseEntries) {
    const baseCandidate: SearchCandidate = {
      vendor: entry.vendor,
      series: entry.series,
      tags: entry.tags,
      normalizedName: entry.normalizedName,
      baseNormalizedName: entry.normalizedName,
      aliases: entry.aliases,
      regexes: entry.aliases.flatMap((alias) => buildAliasRegex(alias)),
      confidence: 0.93,
    };
    candidates.push(baseCandidate);
    exactMetaIndex.set(normalizeText(entry.normalizedName), baseCandidate);

    for (const variant of entry.variants) {
      const exactName = buildVariantName(entry.normalizedName, variant);
      const variantAliases = buildAliasSet(exactName, entry.vendor);
      const candidate: SearchCandidate = {
        vendor: entry.vendor,
        series: entry.series,
        tags: entry.tags,
        normalizedName: exactName,
        baseNormalizedName: entry.normalizedName,
        aliases: variantAliases,
        regexes: variantAliases.flatMap((alias) => buildAliasRegex(alias)),
        confidence: 0.98,
      };
      candidates.push(candidate);
      exactMetaIndex.set(normalizeText(exactName), candidate);
    }
  }

  return {
    candidates: candidates.sort(
      (left, right) =>
        right.normalizedName.length - left.normalizedName.length ||
        right.aliases.join(" ").length - left.aliases.join(" ").length,
    ),
    exactMetaIndex,
  };
}

const { candidates: searchCandidates, exactMetaIndex } = buildSearchIndex(entries);

function findBestCandidate(text: string) {
  const prepared = prepareGpuSearchText(text);
  let best:
    | {
        candidate: SearchCandidate;
        rawMatch: string;
        score: number;
      }
    | null = null;

  for (const candidate of searchCandidates) {
    for (const regex of candidate.regexes) {
      const match = prepared.normalized.match(regex);
      if (!match?.[2]) {
        continue;
      }

      const rawMatch = match[2].trim();
      const score =
        candidate.normalizedName.length * 3 +
        rawMatch.length +
        (candidate.normalizedName !== candidate.baseNormalizedName ? 18 : 10) +
        candidate.tags.length * 4;

      if (!best || score > best.score) {
        best = {
          candidate,
          rawMatch,
          score,
        };
      }
    }
  }

  return best;
}

function resolveMeta(name: string) {
  const normalized = normalizeText(name);
  const direct = exactMetaIndex.get(normalized);
  if (direct) {
    return direct;
  }

  return findBestCandidate(name)?.candidate ?? null;
}

export const gpuDatabase = {
  entries,
  byId: new Map(entries.map((entry) => [entry.id, entry])),
  byNormalizedName: new Map(entries.map((entry) => [normalizeText(entry.normalizedName), entry])),
} as const;

export function normalizeGpuName(input: string): string | null {
  return findGpuInText(input).normalizedName;
}

export function findGpuInText(text: string): {
  matched: boolean;
  normalizedName: string | null;
  vendor: "NVIDIA" | "AMD" | null;
  series: string | null;
  tags: string[];
  confidence: number;
  rawMatch: string | null;
} {
  const best = findBestCandidate(text);

  if (!best) {
    return {
      matched: false,
      normalizedName: null,
      vendor: null,
      series: null,
      tags: [],
      confidence: 0,
      rawMatch: null,
    };
  }

  return {
    matched: true,
    normalizedName: best.candidate.normalizedName,
    vendor: best.candidate.vendor,
    series: best.candidate.series,
    tags: best.candidate.tags,
    confidence: best.candidate.confidence,
    rawMatch: best.rawMatch,
  };
}

export function getGpuMeta(name: string): (GpuDatabaseEntry & { baseNormalizedName: string }) | null {
  const candidate = resolveMeta(name);
  if (!candidate) {
    return null;
  }

  const baseEntry = gpuDatabase.byNormalizedName.get(normalizeText(candidate.baseNormalizedName));
  if (!baseEntry) {
    return null;
  }

  return {
    ...baseEntry,
    normalizedName: candidate.normalizedName,
    shortName: candidate.normalizedName,
    baseNormalizedName: candidate.baseNormalizedName,
  };
}

export function isDesktopGamingGpu(name: string) {
  return Boolean(getGpuMeta(name)?.desktopGaming);
}

export function getGpuTierHint(name: string): GpuTierHint | null {
  return getGpuMeta(name)?.tierHint ?? null;
}
