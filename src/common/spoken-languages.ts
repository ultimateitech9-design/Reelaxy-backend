/** Normalise a member's spoken languages: trimmed, Title Case, de-duplicated, max 10. */
export function normalizeLanguages(input: unknown): string[] {
  const values = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[,|]/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const name = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!name || !/^[\p{L}\s().'-]+$/u.test(name)) continue;
    const pretty = name.toLowerCase().replace(/(^|[\s(-])(\p{L})/gu, (_m, sep, ch) => sep + ch.toUpperCase());
    const key = pretty.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(pretty);
    if (out.length >= 10) break;
  }
  return out;
}
