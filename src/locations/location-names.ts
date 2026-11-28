/**
 * Cleaning rules for uploaded location rows. Keep slugify in sync with
 * Reelaxy-frontend/src/lib/locationPaths.ts.
 */

export function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

/** Collapse spaces, trim and drop stray quotes. */
export function cleanName(value: unknown) {
  return String(value ?? '').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim();
}

const COMPASS = new Set(['north', 'south', 'east', 'west', 'central', 'north east', 'north west', 'south east', 'south west', 'northeast', 'northwest', 'southeast', 'southwest']);
/** URL segments used by other pages under /video-chat. */
const RESERVED_STATE_SLUGS = new Set(['world', 'city', 'state', 'search']);

export type CleanRow = { state: string; stateSlug: string; city: string; citySlug: string; locality: string; localitySlug: string } | null;

/**
 * Turn one CSV row into clean names + slugs, or null when the row should be skipped.
 * - District names like "East" (Delhi) become "East Delhi".
 * - "(Un-Inhabited)" localities are skipped.
 * - A locality with the city's own name is skipped (it would duplicate the city page);
 *   the city itself is still created.
 */
export function cleanRow(rawLocality: unknown, rawCity: unknown, rawState: unknown): CleanRow {
  const state = cleanName(rawState);
  let city = cleanName(rawCity);
  let locality = cleanName(rawLocality);
  if (!state || !city || state.length > 120 || city.length > 160) return null;
  if (COMPASS.has(city.toLowerCase())) city = `${city} ${state}`;
  const stateSlug = slugify(state);
  const citySlug = slugify(city);
  if (!stateSlug || !citySlug || RESERVED_STATE_SLUGS.has(stateSlug)) return null;

  if (/un-?inhabited/i.test(locality)) locality = '';
  if (locality.length > 200) locality = '';
  let localitySlug = locality ? slugify(locality) : '';
  const rawCityName = cleanName(rawCity).toLowerCase();
  if (localitySlug && (localitySlug === citySlug || locality.toLowerCase() === rawCityName || localitySlug === stateSlug)) {
    locality = '';
    localitySlug = '';
  }
  return { state, stateSlug, city, citySlug, locality, localitySlug };
}
