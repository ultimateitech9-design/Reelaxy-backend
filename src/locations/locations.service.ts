import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LocationCity, LocationImportJob, LocationLocality, LocationState } from './location.entity';
import { cleanRow } from './location-names';

const LOCALITIES_PER_PAGE = 300;
const SITEMAP_PAGE = 45_000;

type StateRow = { id: number; name: string; slug: string; cityCount: number; localityCount: number };
type CityRow = { id: number; stateId: number; name: string; slug: string; localityCount: number; updatedAt?: Date };

/** Public reads for the location pages plus the super-admin import/manage actions. */
@Injectable()
export class LocationsService {
  /** Per-import caches of slug -> id so each chunk doesn't re-query known states/cities. */
  private readonly importCache = new Map<number, { states: Map<string, number>; cities: Map<string, number> }>();

  constructor(
    @InjectRepository(LocationState) private readonly states: Repository<LocationState>,
    @InjectRepository(LocationCity) private readonly cities: Repository<LocationCity>,
    @InjectRepository(LocationLocality) private readonly localities: Repository<LocationLocality>,
    @InjectRepository(LocationImportJob) private readonly jobs: Repository<LocationImportJob>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────── Public pages ─────────────────────────

  private async activeState(slug: string) {
    const state = await this.states.findOne({ where: { slug: String(slug || '').toLowerCase(), isActive: true } });
    if (!state) throw new NotFoundException('State not found.');
    return state;
  }

  private async activeCity(stateId: number, slug: string) {
    const city = await this.cities.findOne({ where: { stateId, slug: String(slug || '').toLowerCase(), isActive: true } });
    if (!city) throw new NotFoundException('City not found.');
    return city;
  }

  private pickState(s: LocationState): StateRow {
    return { id: s.id, name: s.name, slug: s.slug, cityCount: s.cityCount, localityCount: s.localityCount };
  }

  async listStates() {
    const rows = await this.states.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return rows.map((s) => ({ name: s.name, slug: s.slug, cityCount: s.cityCount, localityCount: s.localityCount }));
  }

  /** Biggest cities across India (by number of localities) for the directory page. */
  async topCities(limit = 24) {
    const rows: (CityRow & { stateName: string; stateSlug: string })[] = await this.dataSource.query(
      `SELECT c.name, c.slug, c.localityCount, s.name AS stateName, s.slug AS stateSlug
       FROM location_cities c JOIN location_states s ON s.id = c.stateId
       WHERE c.isActive = 1 AND s.isActive = 1
       ORDER BY c.localityCount DESC, c.name ASC LIMIT ?`,
      [Math.min(Math.max(limit, 1), 100)],
    );
    return rows.map((c) => ({ name: c.name, slug: c.slug, localityCount: Number(c.localityCount), stateName: c.stateName, stateSlug: c.stateSlug }));
  }

  async statePage(stateSlug: string) {
    const state = await this.activeState(stateSlug);
    const [cities, otherStates] = await Promise.all([
      this.cities.find({ where: { stateId: state.id, isActive: true }, order: { name: 'ASC' }, select: ['name', 'slug', 'localityCount'] }),
      this.states.find({ where: { isActive: true }, order: { name: 'ASC' }, select: ['id', 'name', 'slug'] }),
    ]);
    return {
      state: this.pickState(state),
      cities: cities.map((c) => ({ name: c.name, slug: c.slug, localityCount: c.localityCount })),
      otherStates: otherStates.filter((s) => s.id !== state.id).map((s) => ({ name: s.name, slug: s.slug })),
    };
  }

  async cityPage(stateSlug: string, citySlug: string, page = 1) {
    const state = await this.activeState(stateSlug);
    const city = await this.activeCity(state.id, citySlug);
    const total = await this.localities.count({ where: { cityId: city.id, isActive: true } });
    const pages = Math.max(1, Math.ceil(total / LOCALITIES_PER_PAGE));
    const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
    const [localities, nearbyCities] = await Promise.all([
      this.localities.find({
        where: { cityId: city.id, isActive: true },
        order: { name: 'ASC' },
        select: ['name', 'slug'],
        skip: (current - 1) * LOCALITIES_PER_PAGE,
        take: LOCALITIES_PER_PAGE,
      }),
      this.dataSource.query(
        `SELECT name, slug, localityCount FROM location_cities
         WHERE stateId = ? AND isActive = 1 AND id <> ?
         ORDER BY localityCount DESC, name ASC LIMIT 24`,
        [state.id, city.id],
      ),
    ]);
    return {
      state: this.pickState(state),
      city: { name: city.name, slug: city.slug, localityCount: city.localityCount },
      localities: localities.map((l) => ({ name: l.name, slug: l.slug })),
      page: current,
      pages,
      totalLocalities: total,
      nearbyCities: (nearbyCities as CityRow[]).map((c) => ({ name: c.name, slug: c.slug, localityCount: Number(c.localityCount) })),
    };
  }

  async localityPage(stateSlug: string, citySlug: string, localitySlug: string) {
    const state = await this.activeState(stateSlug);
    const city = await this.activeCity(state.id, citySlug);
    const locality = await this.localities.findOne({ where: { cityId: city.id, slug: String(localitySlug || '').toLowerCase(), isActive: true } });
    if (!locality) throw new NotFoundException('Locality not found.');
    // Neighbours in alphabetical order around this locality, so every locality links to
    // others and is linked from them (no orphan pages).
    const [before, after, cityCount, otherCities, sameName] = await Promise.all([
      this.dataSource.query(
        'SELECT name, slug FROM location_localities WHERE cityId = ? AND isActive = 1 AND name < ? ORDER BY name DESC LIMIT 12',
        [city.id, locality.name],
      ),
      this.dataSource.query(
        'SELECT name, slug FROM location_localities WHERE cityId = ? AND isActive = 1 AND name > ? ORDER BY name ASC LIMIT 12',
        [city.id, locality.name],
      ),
      this.localities.count({ where: { cityId: city.id, isActive: true } }),
      this.dataSource.query(
        `SELECT name, slug, localityCount FROM location_cities
         WHERE stateId = ? AND isActive = 1 AND id <> ? ORDER BY localityCount DESC, name ASC LIMIT 12`,
        [state.id, city.id],
      ),
      // Same locality name in other cities: linked so the pages read as distinct places.
      this.dataSource.query(
        `SELECT l.name, l.slug, c.name AS cityName, c.slug AS citySlug, s.name AS stateName, s.slug AS stateSlug
         FROM location_localities l
         JOIN location_cities c ON c.id = l.cityId AND c.isActive = 1
         JOIN location_states s ON s.id = l.stateId AND s.isActive = 1
         WHERE l.slug = ? AND l.isActive = 1 AND l.id <> ? LIMIT 8`,
        [locality.slug, locality.id],
      ),
    ]);
    return {
      state: this.pickState(state),
      city: { name: city.name, slug: city.slug, localityCount: cityCount },
      locality: { name: locality.name, slug: locality.slug },
      nearbyLocalities: [...(before as any[]).reverse(), ...(after as any[])].map((l) => ({ name: l.name, slug: l.slug })),
      otherCities: (otherCities as CityRow[]).map((c) => ({ name: c.name, slug: c.slug, localityCount: Number(c.localityCount) })),
      sameNameElsewhere: (sameName as any[]).map((l) => ({ cityName: l.cityName, citySlug: l.citySlug, stateName: l.stateName, stateSlug: l.stateSlug, slug: l.slug })),
    };
  }

  /** Search box on the directory page: states, cities and localities by name. */
  async search(rawQuery: string) {
    const q = String(rawQuery || '').trim().slice(0, 60);
    if (q.length < 2) return { results: [] };
    const like = `${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const [states, cities, localities] = await Promise.all([
      this.dataSource.query('SELECT name, slug FROM location_states WHERE isActive = 1 AND name LIKE ? ORDER BY name LIMIT 5', [like]),
      this.dataSource.query(
        `SELECT c.name, c.slug, s.name AS stateName, s.slug AS stateSlug FROM location_cities c
         JOIN location_states s ON s.id = c.stateId AND s.isActive = 1
         WHERE c.isActive = 1 AND c.name LIKE ? ORDER BY c.localityCount DESC LIMIT 10`, [like]),
      this.dataSource.query(
        `SELECT l.name, l.slug, c.name AS cityName, c.slug AS citySlug, s.name AS stateName, s.slug AS stateSlug
         FROM location_localities l
         JOIN location_cities c ON c.id = l.cityId AND c.isActive = 1
         JOIN location_states s ON s.id = l.stateId AND s.isActive = 1
         WHERE l.isActive = 1 AND l.name LIKE ? ORDER BY l.name LIMIT 10`, [like]),
    ]);
    return {
      results: [
        ...(states as any[]).map((s) => ({ kind: 'state', name: s.name, context: 'State', path: `/video-chat/${s.slug}` })),
        ...(cities as any[]).map((c) => ({ kind: 'city', name: c.name, context: c.stateName, path: `/video-chat/${c.stateSlug}/${c.slug}` })),
        ...(localities as any[]).map((l) => ({ kind: 'locality', name: l.name, context: `${l.cityName}, ${l.stateName}`, path: `/video-chat/${l.stateSlug}/${l.citySlug}/${l.slug}` })),
      ],
    };
  }

  /** Old /video-chat/city/<slug> and /video-chat/state/<slug> URLs -> new path (for 301s). */
  async resolveLegacy(kind: string, rawSlug: string) {
    const slug = String(rawSlug || '').toLowerCase();
    if (kind === 'state') {
      const state = await this.states.findOne({ where: { slug, isActive: true } });
      return { path: state ? `/video-chat/${state.slug}` : null };
    }
    const rows = await this.dataSource.query(
      `SELECT c.slug, s.slug AS stateSlug FROM location_cities c JOIN location_states s ON s.id = c.stateId AND s.isActive = 1
       WHERE c.slug = ? AND c.isActive = 1 ORDER BY c.localityCount DESC LIMIT 1`, [slug]);
    if (rows[0]) return { path: `/video-chat/${rows[0].stateSlug}/${rows[0].slug}` };
    const locality = await this.dataSource.query(
      `SELECT l.slug, c.slug AS citySlug, s.slug AS stateSlug FROM location_localities l
       JOIN location_cities c ON c.id = l.cityId AND c.isActive = 1 JOIN location_states s ON s.id = l.stateId AND s.isActive = 1
       WHERE l.slug = ? AND l.isActive = 1 LIMIT 1`, [slug]);
    return { path: locality[0] ? `/video-chat/${locality[0].stateSlug}/${locality[0].citySlug}/${locality[0].slug}` : null };
  }

  /** State and city URLs use separate sitemap files. Localities come later. */
  async sitemapInfo(kind: string) {
    if (kind !== 'states' && kind !== 'cities') throw new BadRequestException('Unknown sitemap kind.');
    const [{ n }] = kind === 'states'
      ? await this.dataSource.query('SELECT COUNT(*) AS n FROM location_states WHERE isActive = 1')
      : await this.dataSource.query('SELECT COUNT(*) AS n FROM location_cities c JOIN location_states s ON s.id = c.stateId AND s.isActive = 1 WHERE c.isActive = 1');
    const total = Number(n);
    return { total, pageSize: SITEMAP_PAGE, pages: Math.max(1, Math.ceil(total / SITEMAP_PAGE)) };
  }

  async sitemapPage(kind: string, rawPage: number) {
    if (kind !== 'states' && kind !== 'cities') throw new BadRequestException('Unknown sitemap kind.');
    const page = Math.max(0, Math.floor(rawPage) || 0);
    const offset = page * SITEMAP_PAGE;
    const rows = kind === 'states'
      ? await this.dataSource.query('SELECT slug, updatedAt FROM location_states WHERE isActive = 1 ORDER BY id LIMIT ? OFFSET ?', [SITEMAP_PAGE, offset])
      : await this.dataSource.query(
        `SELECT c.slug, s.slug AS stateSlug, c.updatedAt FROM location_cities c
         JOIN location_states s ON s.id = c.stateId AND s.isActive = 1
         WHERE c.isActive = 1 ORDER BY c.id LIMIT ? OFFSET ?`, [SITEMAP_PAGE, offset]);
    return {
      urls: (rows as any[]).map((row) => ({
        path: kind === 'states' ? `/video-chat/${row.slug}` : `/video-chat/${row.stateSlug}/${row.slug}`,
        updatedAt: row.updatedAt,
      })),
    };
  }

  // ───────────────────────── Super-admin: import ─────────────────────────

  async startImport(input: { fileName?: string; mode?: string; totalRows?: number }, createdBy: string | null) {
    const mode = input.mode === 'replace' ? 'replace' : 'merge';
    const running = await this.jobs.findOne({ where: { status: 'running' } });
    if (running) {
      // A job left running for 30+ minutes (closed tab) is treated as abandoned.
      if (Date.now() - new Date(running.createdAt).getTime() < 30 * 60_000) {
        throw new BadRequestException('Another location upload is still running. Wait for it to finish.');
      }
      await this.jobs.update(running.id, { status: 'failed', error: 'Abandoned (upload stopped).', finishedAt: new Date() });
    }
    if (mode === 'replace') {
      await this.dataSource.query('TRUNCATE TABLE location_localities');
      await this.dataSource.query('TRUNCATE TABLE location_cities');
      await this.dataSource.query('TRUNCATE TABLE location_states');
    }
    const job = await this.jobs.save(this.jobs.create({
      fileName: String(input.fileName || 'locations.csv').slice(0, 200),
      mode,
      totalRows: Math.max(0, Math.floor(Number(input.totalRows) || 0)),
      createdBy: createdBy ? createdBy.slice(0, 160) : null,
    }));
    this.importCache.set(job.id, { states: new Map(), cities: new Map() });
    return job;
  }

  /** One chunk of rows: [locality, city, state] each. Duplicates are ignored safely. */
  async importRows(jobId: number, rows: unknown) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job || job.status !== 'running') throw new BadRequestException('This upload is not running.');
    if (!Array.isArray(rows) || rows.length > 10_000) throw new BadRequestException('Send between 1 and 10,000 rows per chunk.');
    const cache = this.importCache.get(job.id) ?? { states: new Map<string, number>(), cities: new Map<string, number>() };
    this.importCache.set(job.id, cache);

    const clean = rows.map((row) => (Array.isArray(row) ? cleanRow(row[0], row[1], row[2]) : null));
    const valid = clean.filter((row): row is NonNullable<typeof row> => Boolean(row));
    let skipped = rows.length - valid.length;
    let newStates = 0;
    let newCities = 0;
    let newLocalities = 0;

    // States
    const stateNames = new Map<string, string>();
    for (const row of valid) if (!cache.states.has(row.stateSlug)) stateNames.set(row.stateSlug, row.state);
    if (stateNames.size) {
      const values = [...stateNames.entries()];
      const result = await this.dataSource.query(
        `INSERT IGNORE INTO location_states (name, slug) VALUES ${values.map(() => '(?, ?)').join(',')}`,
        values.flatMap(([slug, name]) => [name, slug]),
      );
      newStates += Number(result?.affectedRows || 0);
      const found = await this.dataSource.query(
        `SELECT id, slug FROM location_states WHERE slug IN (${values.map(() => '?').join(',')})`, values.map(([slug]) => slug));
      for (const s of found as any[]) cache.states.set(s.slug, Number(s.id));
    }

    // Cities (unique per state)
    const cityNames = new Map<string, { stateId: number; name: string; slug: string }>();
    for (const row of valid) {
      const stateId = cache.states.get(row.stateSlug);
      if (!stateId) continue;
      const key = `${stateId}:${row.citySlug}`;
      if (!cache.cities.has(key) && !cityNames.has(key)) cityNames.set(key, { stateId, name: row.city, slug: row.citySlug });
    }
    if (cityNames.size) {
      const values = [...cityNames.values()];
      for (let i = 0; i < values.length; i += 1000) {
        const batch = values.slice(i, i + 1000);
        const result = await this.dataSource.query(
          `INSERT IGNORE INTO location_cities (stateId, name, slug) VALUES ${batch.map(() => '(?, ?, ?)').join(',')}`,
          batch.flatMap((c) => [c.stateId, c.name, c.slug]),
        );
        newCities += Number(result?.affectedRows || 0);
        const found = await this.dataSource.query(
          `SELECT id, stateId, slug FROM location_cities WHERE (stateId, slug) IN (${batch.map(() => '(?, ?)').join(',')})`,
          batch.flatMap((c) => [c.stateId, c.slug]),
        );
        for (const c of found as any[]) cache.cities.set(`${c.stateId}:${c.slug}`, Number(c.id));
      }
    }

    // Localities (unique per city; the same name in another city is a separate row)
    const localityRows = new Map<string, [number, number, string, string]>();
    for (const row of valid) {
      if (!row.localitySlug) continue;
      const stateId = cache.states.get(row.stateSlug);
      const cityId = stateId ? cache.cities.get(`${stateId}:${row.citySlug}`) : undefined;
      if (!stateId || !cityId) { skipped++; continue; }
      const key = `${cityId}:${row.localitySlug}`;
      if (!localityRows.has(key)) localityRows.set(key, [cityId, stateId, row.locality, row.localitySlug]);
    }
    const localityValues = [...localityRows.values()];
    for (let i = 0; i < localityValues.length; i += 1000) {
      const batch = localityValues.slice(i, i + 1000);
      const result = await this.dataSource.query(
        `INSERT IGNORE INTO location_localities (cityId, stateId, name, slug) VALUES ${batch.map(() => '(?, ?, ?, ?)').join(',')}`,
        batch.flat(),
      );
      newLocalities += Number(result?.affectedRows || 0);
    }

    await this.dataSource.query(
      `UPDATE location_import_jobs SET processedRows = processedRows + ?, skippedRows = skippedRows + ?,
       newStates = newStates + ?, newCities = newCities + ?, newLocalities = newLocalities + ? WHERE id = ?`,
      [rows.length, skipped, newStates, newCities, newLocalities, job.id],
    );
    return { processed: rows.length, skipped, newStates, newCities, newLocalities };
  }

  async finishImport(jobId: number, failed?: string) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Upload not found.');
    this.importCache.delete(job.id);
    if (job.status === 'running') {
      await this.recountAll();
      await this.jobs.update(job.id, { status: failed ? 'failed' : 'completed', error: failed ? failed.slice(0, 300) : null, finishedAt: new Date() });
    }
    return this.jobs.findOne({ where: { id: jobId } });
  }

  /** Refresh the cached city/locality counts shown on pages and used for ordering. */
  async recountAll() {
    await this.dataSource.query(
      `UPDATE location_cities c LEFT JOIN (
         SELECT cityId, COUNT(*) AS n FROM location_localities WHERE isActive = 1 GROUP BY cityId
       ) l ON l.cityId = c.id SET c.localityCount = COALESCE(l.n, 0)`);
    await this.dataSource.query(
      `UPDATE location_states s
       LEFT JOIN (SELECT stateId, COUNT(*) AS n FROM location_cities WHERE isActive = 1 GROUP BY stateId) c ON c.stateId = s.id
       LEFT JOIN (SELECT stateId, COUNT(*) AS n FROM location_localities WHERE isActive = 1 GROUP BY stateId) l ON l.stateId = s.id
       SET s.cityCount = COALESCE(c.n, 0), s.localityCount = COALESCE(l.n, 0)`);
  }

  listImports() {
    return this.jobs.find({ order: { id: 'DESC' }, take: 20 });
  }

  // ───────────────────────── Super-admin: manage ─────────────────────────

  async stats() {
    const [[s], [c], [l]] = await Promise.all([
      this.dataSource.query('SELECT COUNT(*) AS total, SUM(isActive = 1) AS active FROM location_states'),
      this.dataSource.query('SELECT COUNT(*) AS total, SUM(isActive = 1) AS active FROM location_cities'),
      this.dataSource.query('SELECT COUNT(*) AS total, SUM(isActive = 1) AS active FROM location_localities'),
    ]);
    const n = (row: any) => ({ total: Number(row?.total || 0), active: Number(row?.active || 0) });
    return { states: n(s), cities: n(c), localities: n(l) };
  }

  async adminList(kind: string, query: { q?: string; stateId?: string; cityId?: string; page?: string }) {
    const page = Math.max(1, Math.floor(Number(query.page) || 1));
    const take = 50;
    const q = String(query.q || '').trim().slice(0, 80);
    const like = `%${q.replace(/[%_\\]/g, (ch) => `\\${ch}`)}%`;
    const params: unknown[] = [];
    let from = '';
    let where = 'WHERE 1=1';
    let select = '';
    if (kind === 'states') {
      select = 's.id, s.name, s.slug, s.isActive, s.cityCount, s.localityCount, s.updatedAt';
      from = 'FROM location_states s';
      if (q) { where += ' AND s.name LIKE ?'; params.push(like); }
    } else if (kind === 'cities') {
      select = 'c.id, c.name, c.slug, c.isActive, c.localityCount, c.updatedAt, c.stateId, s.name AS stateName, s.slug AS stateSlug';
      from = 'FROM location_cities c JOIN location_states s ON s.id = c.stateId';
      if (q) { where += ' AND c.name LIKE ?'; params.push(like); }
      if (query.stateId) { where += ' AND c.stateId = ?'; params.push(Number(query.stateId)); }
    } else if (kind === 'localities') {
      select = 'l.id, l.name, l.slug, l.isActive, l.updatedAt, l.cityId, l.stateId, c.name AS cityName, c.slug AS citySlug, s.name AS stateName, s.slug AS stateSlug';
      from = 'FROM location_localities l JOIN location_cities c ON c.id = l.cityId JOIN location_states s ON s.id = l.stateId';
      if (q) { where += ' AND l.name LIKE ?'; params.push(like); }
      if (query.stateId) { where += ' AND l.stateId = ?'; params.push(Number(query.stateId)); }
      if (query.cityId) { where += ' AND l.cityId = ?'; params.push(Number(query.cityId)); }
    } else {
      throw new BadRequestException('Unknown list.');
    }
    const alias = kind[0];
    const [rows, [{ n }]] = await Promise.all([
      this.dataSource.query(`SELECT ${select} ${from} ${where} ORDER BY ${alias}.name ASC LIMIT ? OFFSET ?`, [...params, take, (page - 1) * take]),
      this.dataSource.query(`SELECT COUNT(*) AS n ${from} ${where}`, params),
    ]);
    return { rows, total: Number(n), page, pages: Math.max(1, Math.ceil(Number(n) / take)) };
  }

  private repo(kind: string) {
    if (kind === 'states') return this.states;
    if (kind === 'cities') return this.cities;
    if (kind === 'localities') return this.localities;
    throw new BadRequestException('Unknown list.');
  }

  /** Show/hide or rename. The URL slug never changes, so existing links keep working. */
  async adminUpdate(kind: string, id: number, input: { isActive?: boolean; name?: string }) {
    const repo = this.repo(kind) as Repository<any>;
    const row = await repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Not found.');
    const patch: Record<string, unknown> = {};
    if (typeof input.isActive === 'boolean') patch.isActive = input.isActive;
    if (typeof input.name === 'string') {
      const name = input.name.replace(/\s+/g, ' ').trim();
      if (name.length < 2 || name.length > 200) throw new BadRequestException('Name must be 2–200 characters.');
      patch.name = name;
    }
    if (Object.keys(patch).length) await repo.update(id, patch);
    if ('isActive' in patch) await this.recountAll();
    return repo.findOne({ where: { id } });
  }

  /** Delete a state/city (with everything under it) or one locality. */
  async adminDelete(kind: string, id: number) {
    if (kind === 'states') {
      await this.dataSource.query('DELETE FROM location_localities WHERE stateId = ?', [id]);
      await this.dataSource.query('DELETE FROM location_cities WHERE stateId = ?', [id]);
      await this.states.delete(id);
    } else if (kind === 'cities') {
      await this.dataSource.query('DELETE FROM location_localities WHERE cityId = ?', [id]);
      await this.cities.delete(id);
    } else if (kind === 'localities') {
      await this.localities.delete(id);
    } else {
      throw new BadRequestException('Unknown list.');
    }
    await this.recountAll();
    return { deleted: true };
  }
}
