type CpuVendor = "Intel" | "AMD";

export type CpuTierHint = "trash" | "very_weak" | "weak" | "entry" | "mid" | "strong_old" | "modern_mid" | "high_end_old";

export type CpuDatabaseEntry = {
  id: string;
  vendor: CpuVendor;
  normalizedName: string;
  family: string;
  subfamily: string;
  releaseEra: string;
  socketHint: string | null;
  releaseYear: number | null;
  tags: string[];
  aliases: string[];
  desktop: true;
  oemCommon: boolean;
  xeonPopularWithGamers: boolean;
  tierHint: CpuTierHint;
};

type SourceCpuEntry = {
  name: string;
  tags?: string[];
  aliases?: string[];
};

type SearchCandidate = {
  vendor: CpuVendor;
  family: string;
  generationHint: string | null;
  tags: string[];
  normalizedName: string;
  aliases: string[];
  regexes: RegExp[];
  confidence: number;
};

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
    .replace(/[()[\],/+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAliasRegex(alias: string) {
  const normalized = normalizeText(alias);
  const compactAlias = compact(alias);
  const tokenPattern = normalized
    .split(" ")
    .filter(Boolean)
    .map((token) => escapeRegex(token))
    .join("[\\s-]*");

  return unique([
    `(^|[^a-z0-9])(${tokenPattern})(?=$|[^a-z0-9])`,
    compactAlias && compactAlias !== normalized ? `(^|[^a-z0-9])(${escapeRegex(compactAlias)})(?=$|[^a-z0-9])` : "",
  ])
    .filter(Boolean)
    .map((pattern) => new RegExp(pattern, "i"));
}

function inferTierHint(name: string): CpuTierHint {
  const normalized = normalizeText(name);

  if (/(celeron g1610|celeron g1820|celeron g1840|celeron g3900)/.test(normalized)) {
    return "trash";
  }

  if (/(pentium g3220|pentium g3240|pentium g3250|fx 6300|i3 2100|i3 2120|i3 3220|i3 4130|i3 6100|i3 7100)/.test(normalized)) {
    return "very_weak";
  }

  if (/(pentium g4400|athlon 3000g|athlon gold 3150g|athlon gold 3150ge|fx 8300|fx 8350|i5 2400|i5 2500|i5 3470|i5 3570|i5 4440|i5 4570|i5 4590)/.test(normalized)) {
    return "weak";
  }

  if (/(i7 2600|i7 3770|i7 4770|i5 6400|i5 6500t|i5 6500|i7 6700|i5 7400|i5 7500t|i5 7500|i7 7700|i3 8100|i5 8400|i5 8500|ryzen 3 2200g|ryzen 5 2400g|ryzen 3 3200g|ryzen 5 3400g|ryzen 5 1600|ryzen 5 2600|ryzen 7 1700|ryzen 7 2700|xeon e3 1230 v2|xeon e3 1240 v3|xeon e3 1245 v3)/.test(normalized)) {
    return "entry";
  }

  if (/(i7 8700|i3 9100|i5 9400|i5 10400|i7 9700|xeon e3 1245 v5|xeon e5 2620 v3|xeon e5 2630 v3|xeon e5 2630 v4|xeon e5 2640 v3|xeon e5 2640 v4|xeon e5 2666 v3|xeon e5 2670 v3|xeon e5 2680 v3|xeon e5 2690 v3|ryzen 5 3600|ryzen 7 3700x|ryzen 3 pro 4350g|ryzen 5 pro 4650g|ryzen 7 pro 4750g|ryzen 5 5600g|ryzen 7 5700g)/.test(normalized)) {
    return "mid";
  }

  if (/(i7 10700|xeon e5 2670 v3|xeon e5 2680 v3|xeon e5 2690 v3|ryzen 7 3700x|ryzen 7 5700g)/.test(normalized)) {
    return "strong_old";
  }

  return "weak";
}

function buildIntelCoreAliases(name: string, manualAliases: string[] = []) {
  const match = name.match(/^Intel Core (i[3579])-(\d{4,5})([A-Z]{0,2})$/i);
  if (!match) {
    return [];
  }

  const tier = match[1].toLowerCase();
  const sku = match[2];
  const suffix = match[3].toUpperCase();
  const skuWithSuffix = `${sku}${suffix}`;

  return unique([
    `intel core ${tier} ${skuWithSuffix}`,
    `core ${tier} ${skuWithSuffix}`,
    `${tier} ${skuWithSuffix}`,
    `${tier}-${skuWithSuffix}`,
    `${tier}${skuWithSuffix}`,
    suffix ? `${skuWithSuffix}` : "",
    suffix ? `${sku} ${suffix}` : "",
    ...manualAliases,
  ]);
}

function buildPentiumCeleronAliases(name: string, manualAliases: string[] = []) {
  const match = name.match(/^Intel (Pentium|Celeron) ([A-Z]\d{4})$/i);
  if (!match) {
    return [];
  }

  const family = match[1];
  const sku = match[2].toUpperCase();
  return unique([
    `intel ${family} ${sku}`,
    `${family} ${sku}`,
    sku,
    `${sku[0]} ${sku.slice(1)}`,
    ...manualAliases,
  ]);
}

function buildXeonAliases(name: string, manualAliases: string[] = []) {
  const match = name.match(/^Intel Xeon (E[35])-(\d{4}) (v[2345])$/i);
  if (!match) {
    return [];
  }

  const family = match[1].toUpperCase();
  const sku = match[2];
  const version = match[3].toLowerCase();

  return unique([
    `intel xeon ${family} ${sku} ${version}`,
    `xeon ${family} ${sku} ${version}`,
    `${family} ${sku} ${version}`,
    `${family.toLowerCase()}${sku}${version}`,
    `xeon${sku}${version}`,
    `${sku}${version}`,
    ...manualAliases,
  ]);
}

function buildRyzenAliases(name: string, manualAliases: string[] = []) {
  const proMatch = name.match(/^AMD Ryzen (\d) PRO (\d{4})([A-Z]{0,2})$/i);
  if (proMatch) {
    const tier = proMatch[1];
    const sku = proMatch[2];
    const suffix = proMatch[3].toUpperCase();
    const skuWithSuffix = `${sku}${suffix}`;

    return unique([
      `amd ryzen ${tier} pro ${skuWithSuffix}`,
      `ryzen ${tier} pro ${skuWithSuffix}`,
      `r${tier} pro ${skuWithSuffix}`,
      `pro ${skuWithSuffix}`,
      `${skuWithSuffix} pro`,
      `ryzen${tier}pro${skuWithSuffix}`,
      ...manualAliases,
    ]);
  }

  const match = name.match(/^AMD Ryzen (\d) (\d{4})([A-Z]{0,3})$/i);
  if (!match) {
    return [];
  }

  const tier = match[1];
  const sku = match[2];
  const suffix = match[3].toUpperCase();
  const skuWithSuffix = `${sku}${suffix}`;

  return unique([
    `amd ryzen ${tier} ${skuWithSuffix}`,
    `ryzen ${tier} ${skuWithSuffix}`,
    `r${tier} ${skuWithSuffix}`,
    `ryzen${tier}${skuWithSuffix}`,
    ...manualAliases,
  ]);
}

function buildAthlonAliases(name: string, manualAliases: string[] = []) {
  const goldMatch = name.match(/^AMD Athlon Gold (\d{4})([A-Z]{0,2})$/i);
  if (goldMatch) {
    const sku = `${goldMatch[1]}${goldMatch[2].toUpperCase()}`;
    return unique([
      `amd athlon gold ${sku}`,
      `athlon gold ${sku}`,
      `gold ${sku}`,
      sku,
      ...manualAliases,
    ]);
  }

  const match = name.match(/^AMD Athlon (\d{4})([A-Z]{0,2})$/i);
  if (!match) {
    return [];
  }

  const sku = `${match[1]}${match[2].toUpperCase()}`;
  return unique([
    `amd athlon ${sku}`,
    `athlon ${sku}`,
    sku,
    ...manualAliases,
  ]);
}

function buildFxAliases(name: string, manualAliases: string[] = []) {
  const match = name.match(/^AMD FX-(\d{4})$/i);
  if (!match) {
    return [];
  }

  return unique([
    `amd fx ${match[1]}`,
    `fx ${match[1]}`,
    `fx-${match[1]}`,
    `fx${match[1]}`,
    ...manualAliases,
  ]);
}

function buildAliasSet(name: string, manualAliases: string[] = []) {
  const aliases = new Set<string>();
  aliases.add(normalizeText(name));
  aliases.add(compact(name));

  [
    ...buildIntelCoreAliases(name, manualAliases),
    ...buildPentiumCeleronAliases(name, manualAliases),
    ...buildXeonAliases(name, manualAliases),
    ...buildRyzenAliases(name, manualAliases),
    ...buildAthlonAliases(name, manualAliases),
    ...buildFxAliases(name, manualAliases),
  ].forEach((alias) => {
    aliases.add(normalizeText(alias));
    aliases.add(compact(alias));
  });

  manualAliases.forEach((alias) => {
    aliases.add(normalizeText(alias));
    aliases.add(compact(alias));
  });

  return unique([...aliases]);
}

function inferGenerationHint(name: string) {
  const normalized = normalizeText(name);

  if (/^intel core i[3579]-2/.test(normalized)) return "Intel 2nd gen";
  if (/^intel core i[3579]-3/.test(normalized)) return "Intel 3rd gen";
  if (/^intel core i[3579]-4/.test(normalized)) return "Intel 4th gen";
  if (/^intel core i[3579]-6/.test(normalized)) return "Intel 6th gen";
  if (/^intel core i[3579]-7/.test(normalized)) return "Intel 7th gen";
  if (/^intel core i[3579]-8/.test(normalized)) return "Intel 8th gen";
  if (/^intel core i[3579]-9/.test(normalized)) return "Intel 9th gen";
  if (/^intel core i[3579]-10/.test(normalized)) return "Intel 10th gen";
  if (/^intel xeon e3-/.test(normalized)) return "Intel Xeon E3";
  if (/^intel xeon e5-/.test(normalized)) return "Intel Xeon E5";
  if (/^amd ryzen/.test(normalized)) return "AMD Ryzen";
  if (/^amd athlon/.test(normalized)) return "AMD Athlon";
  if (/^amd fx-/.test(normalized)) return "AMD FX";
  if (/^intel pentium/.test(normalized)) return "Intel Pentium";
  if (/^intel celeron/.test(normalized)) return "Intel Celeron";

  return null;
}

function makeEntry(input: {
  vendor: CpuVendor;
  family: string;
  subfamily: string;
  releaseEra: string;
  socketHint: string | null;
  releaseYear: number | null;
  entry: SourceCpuEntry;
}) {
  const tags = input.entry.tags ?? [];
  const aliases = buildAliasSet(input.entry.name, input.entry.aliases ?? []);
  const normalizedName = input.entry.name;

  return {
    id: slugify(`${input.vendor}-${normalizedName}`),
    vendor: input.vendor,
    normalizedName,
    family: input.family,
    subfamily: input.subfamily,
    releaseEra: input.releaseEra,
    socketHint: input.socketHint,
    releaseYear: input.releaseYear,
    tags,
    aliases,
    desktop: true,
    oemCommon: tags.includes("OEM") || tags.includes("PopularUsed") || input.family === "Intel Core" || input.family === "Intel Pentium" || input.family === "Intel Celeron" || input.family === "AMD Athlon" || input.family === "AMD Ryzen",
    xeonPopularWithGamers: tags.includes("Xeon"),
    tierHint: inferTierHint(normalizedName),
  } satisfies CpuDatabaseEntry;
}

function buildEntries() {
  const entries: CpuDatabaseEntry[] = [];
  const pushGroup = (
    vendor: CpuVendor,
    family: string,
    subfamily: string,
    releaseEra: string,
    socketHint: string | null,
    releaseYear: number | null,
    cpus: SourceCpuEntry[],
  ) => {
    cpus.forEach((entry) => entries.push(makeEntry({ vendor, family, subfamily, releaseEra, socketHint, releaseYear, entry })));
  };

  pushGroup("Intel", "Intel Core", "2nd Gen", "Sandy Bridge", "LGA1155", 2011, [
    { name: "Intel Core i3-2100", tags: ["OEM", "PopularUsed", "OldButCommon"] },
    { name: "Intel Core i3-2120", tags: ["OEM", "PopularUsed", "OldButCommon"] },
    { name: "Intel Core i5-2400", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i5-2500", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i7-2600", tags: ["OEM", "PopularUsed", "OldButCommon"] },
  ]);

  pushGroup("Intel", "Intel Core", "3rd Gen", "Ivy Bridge", "LGA1155", 2012, [
    { name: "Intel Core i3-3220", tags: ["OEM", "PopularUsed", "OldButCommon"] },
    { name: "Intel Core i5-3470", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i5-3570", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i7-3770", tags: ["OEM", "PopularUsed", "OldButCommon"] },
  ]);

  pushGroup("Intel", "Intel Core", "4th Gen", "Haswell", "LGA1150", 2013, [
    { name: "Intel Core i3-4130", tags: ["OEM", "PopularUsed", "OldButCommon"] },
    { name: "Intel Core i5-4440", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i5-4570", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i5-4590", tags: ["OEM", "PopularUsed", "Budget", "OldButCommon"] },
    { name: "Intel Core i7-4770", tags: ["OEM", "PopularUsed", "OldButCommon"] },
  ]);

  pushGroup("Intel", "Intel Core", "6th Gen", "Skylake", "LGA1151", 2015, [
    { name: "Intel Core i3-6100", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i5-6400", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-6500", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-6500T", tags: ["OEM", "PopularUsed", "T"] },
    { name: "Intel Core i7-6700", tags: ["OEM", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Core", "7th Gen", "Kaby Lake", "LGA1151", 2017, [
    { name: "Intel Core i3-7100", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i5-7400", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-7500", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-7500T", tags: ["OEM", "PopularUsed", "T"] },
    { name: "Intel Core i7-7700", tags: ["OEM", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Core", "8th Gen", "Coffee Lake", "LGA1151", 2018, [
    { name: "Intel Core i3-8100", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-8400", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i5-8500", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i7-8700", tags: ["OEM", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Core", "9th/10th Gen", "Coffee Lake / Comet Lake", "LGA1151/LGA1200", 2019, [
    { name: "Intel Core i3-9100", tags: ["OEM", "PopularUsed", "Budget"] },
    { name: "Intel Core i5-9400", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i5-10400", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i7-9700", tags: ["OEM", "PopularUsed"] },
    { name: "Intel Core i7-10700", tags: ["OEM", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Pentium", "Desktop", "Haswell / Skylake / Kaby Lake", "LGA1150/LGA1151", 2013, [
    { name: "Intel Pentium G3220", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Pentium G3240", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Pentium G3250", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Pentium G4400", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Pentium G4560", tags: ["OEM", "Budget", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Celeron", "Desktop", "Sandy Bridge / Haswell / Skylake", "LGA1155/LGA1150/LGA1151", 2012, [
    { name: "Intel Celeron G1610", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Celeron G1820", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Celeron G1840", tags: ["OEM", "Budget", "OldButCommon"] },
    { name: "Intel Celeron G3900", tags: ["OEM", "Budget", "OldButCommon"] },
  ]);

  pushGroup("AMD", "AMD FX", "Piledriver", "Vishera", "AM3+", 2012, [
    { name: "AMD FX-6300", tags: ["PopularUsed", "Budget", "OldButCommon"] },
    { name: "AMD FX-8300", tags: ["PopularUsed", "Budget", "OldButCommon"] },
    { name: "AMD FX-8350", tags: ["PopularUsed", "OldButCommon"] },
  ]);

  pushGroup("AMD", "AMD Athlon", "Desktop APU", "Zen+", "AM4", 2019, [
    { name: "AMD Athlon 3000G", tags: ["APU", "Budget", "PopularUsed"] },
    { name: "AMD Athlon Gold 3150G", tags: ["APU", "Budget", "OEM"] },
    { name: "AMD Athlon Gold 3150GE", tags: ["APU", "Budget", "OEM"] },
  ]);

  pushGroup("AMD", "AMD Ryzen", "Ryzen APU", "Zen / Zen+", "AM4", 2018, [
    { name: "AMD Ryzen 3 2200G", tags: ["APU", "PopularUsed", "Budget"] },
    { name: "AMD Ryzen 5 2400G", tags: ["APU", "PopularUsed", "Budget"] },
    { name: "AMD Ryzen 3 3200G", tags: ["APU", "PopularUsed", "Budget"] },
    { name: "AMD Ryzen 5 3400G", tags: ["APU", "PopularUsed"] },
  ]);

  pushGroup("AMD", "AMD Ryzen", "Ryzen Desktop", "Zen / Zen+", "AM4", 2017, [
    { name: "AMD Ryzen 5 1600", tags: ["PopularUsed", "Budget", "OldButCommon"] },
    { name: "AMD Ryzen 5 2600", tags: ["PopularUsed", "Budget"] },
    { name: "AMD Ryzen 5 3600", tags: ["PopularUsed"] },
    { name: "AMD Ryzen 7 1700", tags: ["PopularUsed", "OldButCommon"] },
    { name: "AMD Ryzen 7 2700", tags: ["PopularUsed"] },
    { name: "AMD Ryzen 7 3700X", tags: ["PopularUsed"] },
  ]);

  pushGroup("AMD", "AMD Ryzen", "Ryzen PRO", "Renoir", "AM4", 2020, [
    { name: "AMD Ryzen 3 PRO 4350G", tags: ["PRO", "APU", "OEM", "PopularUsed"] },
    { name: "AMD Ryzen 5 PRO 4650G", tags: ["PRO", "APU", "OEM", "PopularUsed"], aliases: ["4650g pro"] },
    { name: "AMD Ryzen 7 PRO 4750G", tags: ["PRO", "APU", "OEM", "PopularUsed"] },
  ]);

  pushGroup("AMD", "AMD Ryzen", "Ryzen APU", "Cezanne", "AM4", 2021, [
    { name: "AMD Ryzen 5 5600G", tags: ["APU", "PopularUsed"] },
    { name: "AMD Ryzen 7 5700G", tags: ["APU", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Xeon", "Xeon E3", "Ivy Bridge / Haswell / Skylake", "LGA1155/LGA1150/LGA1151", 2012, [
    { name: "Intel Xeon E3-1230 v2", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E3-1240 v3", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E3-1245 v3", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E3-1245 v5", tags: ["Xeon", "PopularUsed"] },
  ]);

  pushGroup("Intel", "Intel Xeon", "Xeon E5", "Haswell-EP / Broadwell-EP", "LGA2011-3", 2014, [
    { name: "Intel Xeon E5-2620 v3", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E5-2670 v3", tags: ["Xeon", "PopularUsed"] },
    { name: "Intel Xeon E5-2680 v3", tags: ["Xeon", "PopularUsed"] },
    { name: "Intel Xeon E5-2690 v3", tags: ["Xeon", "PopularUsed"] },
    { name: "Intel Xeon E5-2666 v3", tags: ["Xeon", "PopularUsed"] },
    { name: "Intel Xeon E5-2630 v3", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E5-2630 v4", tags: ["Xeon", "PopularUsed", "Budget"] },
    { name: "Intel Xeon E5-2640 v3", tags: ["Xeon", "PopularUsed"] },
    { name: "Intel Xeon E5-2640 v4", tags: ["Xeon", "PopularUsed"] },
  ]);

  return entries;
}

const entries = buildEntries();

function buildSearchIndex(databaseEntries: CpuDatabaseEntry[]) {
  const candidates: SearchCandidate[] = databaseEntries.map((entry) => ({
    vendor: entry.vendor,
    family: entry.family,
      generationHint: inferGenerationHint(entry.normalizedName),
    tags: entry.tags,
    normalizedName: entry.normalizedName,
    aliases: entry.aliases,
    regexes: entry.aliases.flatMap((alias) => buildAliasRegex(alias)),
    confidence: 0.98,
  }));

  return candidates.sort(
    (left, right) =>
      right.normalizedName.length - left.normalizedName.length ||
      right.aliases.join(" ").length - left.aliases.join(" ").length,
  );
}

const searchCandidates = buildSearchIndex(entries);

function findBestCandidate(text: string) {
  const normalized = normalizeText(text);
  let best:
    | {
        candidate: SearchCandidate;
        rawMatch: string;
        score: number;
      }
    | null = null;

  for (const candidate of searchCandidates) {
    for (const regex of candidate.regexes) {
      const match = normalized.match(regex);
      if (!match?.[2]) {
        continue;
      }

      const rawMatch = match[2].trim();
      const score = candidate.normalizedName.length * 3 + rawMatch.length + candidate.tags.length * 2;

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
  const normalizedName = normalizeText(name);
  const direct = entries.find((entry) => normalizeText(entry.normalizedName) === normalizedName);
  if (direct) {
    return direct;
  }

  return findBestCandidate(name)?.candidate ?? null;
}

export const cpuDatabase = {
  entries,
  byId: new Map(entries.map((entry) => [entry.id, entry])),
  byNormalizedName: new Map(entries.map((entry) => [normalizeText(entry.normalizedName), entry])),
} as const;

export function normalizeCpuName(input: string): string | null {
  return findCpuInText(input).normalizedName;
}

export function findCpuInText(text: string): {
  matched: boolean;
  normalizedName: string | null;
  vendor: "Intel" | "AMD" | null;
  family: string | null;
  generationHint: string | null;
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
      family: null,
      generationHint: null,
      tags: [],
      confidence: 0,
      rawMatch: null,
    };
  }

  return {
    matched: true,
    normalizedName: best.candidate.normalizedName,
    vendor: best.candidate.vendor,
    family: best.candidate.family,
    generationHint: best.candidate.generationHint,
    tags: best.candidate.tags,
    confidence: best.candidate.confidence,
    rawMatch: best.rawMatch,
  };
}

export function getCpuMeta(name: string): CpuDatabaseEntry | null {
  const resolved = resolveMeta(name);
  if (!resolved) {
    return null;
  }

  if ("normalizedName" in resolved && "desktop" in resolved) {
    return resolved;
  }

  return cpuDatabase.byNormalizedName.get(normalizeText(resolved.normalizedName)) ?? null;
}

export function isKnownDesktopCpu(name: string) {
  return Boolean(getCpuMeta(name)?.desktop);
}

export function getCpuTierHint(name: string): CpuTierHint | null {
  return getCpuMeta(name)?.tierHint ?? null;
}

export function getCpuFamilyHint(name: string): string | null {
  return getCpuMeta(name)?.family ? inferFamilyLabel(getCpuMeta(name)!) : null;
}

export function isXeonPopularInUsedGaming(name: string) {
  const meta = getCpuMeta(name);
  return Boolean(meta?.xeonPopularWithGamers);
}

export function isWeakOldOfficeCpu(name: string) {
  const meta = getCpuMeta(name);
  if (!meta) {
    return false;
  }

  return ["trash", "very_weak", "weak"].includes(meta.tierHint) && (meta.tags.includes("OEM") || meta.tags.includes("OldButCommon"));
}

function inferFamilyLabel(entry: CpuDatabaseEntry) {
  if (entry.family === "Intel Core") {
    const match = entry.normalizedName.match(/^Intel Core (i[3579])-/i);
    return match ? `Intel Core ${match[1]}` : "Intel Core";
  }

  if (entry.family === "Intel Xeon") {
    const match = entry.normalizedName.match(/^Intel Xeon (E[35])-/i);
    return match ? `Intel Xeon ${match[1]}` : "Intel Xeon";
  }

  if (entry.family === "AMD Ryzen") {
    const proMatch = entry.normalizedName.match(/^AMD Ryzen (\d) PRO /i);
    if (proMatch) {
      return `AMD Ryzen ${proMatch[1]} PRO`;
    }

    const match = entry.normalizedName.match(/^AMD Ryzen (\d) /i);
    return match ? `AMD Ryzen ${match[1]}` : "AMD Ryzen";
  }

  return entry.family;
}
