import { MedicineService } from "./medicine.services";

// FDA label sections that carry drug-interaction/safety language, checked in this
// priority order (most specific first) when we build the text to search.
const SAFETY_FIELDS = [
  "drug_interactions",
  "warnings_and_cautions",
  "boxed_warning",
  "warnings",
  "precautions",
] as const;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // FDA labels change rarely — a day is safe.

interface LabelCacheEntry {
  text: string | null;
  fetchedAt: number;
}

const labelCache = new Map<string, LabelCacheEntry>();

const normalizeName = (name: string) => name.trim().toLowerCase();

const escapeQuotes = (value: string) => value.replace(/"/g, '\\"');

const escapeForRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function fetchLabelSafetyText(drugName: string): Promise<string | null> {
  const key = normalizeName(drugName);
  if (!key) return null;

  const cached = labelCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.text;
  }

  const escaped = escapeQuotes(key);
  const params = new URLSearchParams({
    search: `(openfda.generic_name:"${escaped}" OR openfda.brand_name:"${escaped}" OR openfda.substance_name:"${escaped}")`,
    limit: "1",
  });

  let text: string | null = null;
  try {
    const response = await fetch(`https://api.fda.gov/drug/label.json?${params.toString()}`);
    if (response.ok) {
      const json = (await response.json()) as { results?: Array<Record<string, unknown>> };
      const result = json.results?.[0];
      if (result) {
        const sections = SAFETY_FIELDS.map((field) => result[field])
          .filter((section): section is string[] => Array.isArray(section))
          .flat()
          .filter((entry): entry is string => typeof entry === "string");
        text = sections.length > 0 ? sections.join("\n") : null;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch openFDA label for "${drugName}":`, err);
    text = null;
  }

  labelCache.set(key, { text, fetchedAt: Date.now() });
  return text;
}

const findMention = (haystack: string, needle: string): string | null => {
  const pattern = new RegExp(`\\b${escapeForRegExp(needle)}\\b`, "i");
  const match = pattern.exec(haystack);
  if (!match) return null;

  const start = Math.max(0, match.index - 80);
  const end = Math.min(haystack.length, match.index + needle.length + 80);
  const snippet = haystack.slice(start, end).trim();
  return (start > 0 ? "…" : "") + snippet + (end < haystack.length ? "…" : "");
};

export interface InteractionWarning {
  otherMedicineName: string;
  otherMedicineId?: string;
  snippet: string;
}

async function findInteractions(
  candidateName: string,
  otherNames: { name: string; medicineId?: string }[]
): Promise<InteractionWarning[]> {
  const candidateKey = normalizeName(candidateName);
  if (!candidateKey || otherNames.length === 0) return [];

  const candidateText = await fetchLabelSafetyText(candidateName);

  const warnings: InteractionWarning[] = [];
  for (const other of otherNames) {
    const otherKey = normalizeName(other.name);
    if (!otherKey || otherKey === candidateKey) continue;

    // Check both directions — brand/generic naming means only one label may mention the other.
    const mentionInCandidate = candidateText ? findMention(candidateText, otherKey) : null;
    if (mentionInCandidate) {
      warnings.push({ otherMedicineName: other.name, otherMedicineId: other.medicineId, snippet: mentionInCandidate });
      continue;
    }

    const otherText = await fetchLabelSafetyText(other.name);
    const mentionInOther = otherText ? findMention(otherText, candidateKey) : null;
    if (mentionInOther) {
      warnings.push({ otherMedicineName: other.name, otherMedicineId: other.medicineId, snippet: mentionInOther });
    }
  }

  return warnings;
}

export const DrugInteractionService = {
  // Used by the medicine add/edit form: checks a candidate medicine name against the
  // user's other active medicines (excluding the one being edited, if any).
  async checkAgainstActiveMedicines(
    userId: string,
    candidateName: string,
    excludeMedicineId?: string
  ): Promise<InteractionWarning[]> {
    const activeMedicines = await MedicineService.getActiveMedicinesByUserId(userId);
    const otherNames = activeMedicines
      .filter((m) => m._id.toString() !== excludeMedicineId)
      .map((m) => ({ name: m.name, medicineId: m._id.toString() }));

    return findInteractions(candidateName, otherNames);
  },

  // Used by the AI assistant to proactively mention interactions among everything
  // the user currently takes, without the user having to ask.
  async checkAllActiveMedicines(userId: string): Promise<{ medicineName: string; warnings: InteractionWarning[] }[]> {
    const activeMedicines = await MedicineService.getActiveMedicinesByUserId(userId);
    if (activeMedicines.length < 2) return [];

    const results: { medicineName: string; warnings: InteractionWarning[] }[] = [];
    const seenPairs = new Set<string>();

    for (const medicine of activeMedicines) {
      const others = activeMedicines
        .filter((m) => m._id.toString() !== medicine._id.toString())
        .map((m) => ({ name: m.name, medicineId: m._id.toString() }));

      const warnings = await findInteractions(medicine.name, others);
      const deduped = warnings.filter((w) => {
        const pairKey = [medicine._id.toString(), w.otherMedicineId].sort().join(":");
        if (seenPairs.has(pairKey)) return false;
        seenPairs.add(pairKey);
        return true;
      });

      if (deduped.length > 0) {
        results.push({ medicineName: medicine.name, warnings: deduped });
      }
    }

    return results;
  },
};
