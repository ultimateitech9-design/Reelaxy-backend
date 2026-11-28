import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { LocationsService } from './locations.service';

/** Public data for the /video-chat location pages and sitemaps. */
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('states') states() { return this.locations.listStates(); }
  @Get('top-cities') topCities(@Query('limit') limit?: string) { return this.locations.topCities(Number(limit) || 24); }
  @Get('search') search(@Query('q') q?: string) { return this.locations.search(String(q || '')); }
  @Get('resolve') resolve(@Query('kind') kind?: string, @Query('slug') slug?: string) { return this.locations.resolveLegacy(String(kind || ''), String(slug || '')); }
  @Get('sitemap') sitemapInfo() { return this.locations.sitemapInfo(); }
  @Get('sitemap/:page') sitemapPage(@Param('page', ParseIntPipe) page: number) { return this.locations.sitemapPage(page); }
  @Get('page/:state') state(@Param('state') state: string) { return this.locations.statePage(state); }
  @Get('page/:state/:city') city(@Param('state') state: string, @Param('city') city: string, @Query('page') page?: string) {
    return this.locations.cityPage(state, city, Number(page) || 1);
  }
  @Get('page/:state/:city/:locality') locality(@Param('state') state: string, @Param('city') city: string, @Param('locality') locality: string) {
    return this.locations.localityPage(state, city, locality);
  }
}

/** Super-admin: upload CSVs and manage states, cities and localities. */
@Controller('admin/locations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('super_admin')
export class LocationsAdminController {
  constructor(private readonly locations: LocationsService) {}

  @Get('stats') stats() { return this.locations.stats(); }
  @Get('imports') imports() { return this.locations.listImports(); }
  @Post('imports') start(@Body() body: { fileName?: string; mode?: string; totalRows?: number }, @Req() req: any) {
    return this.locations.startImport(body || {}, req.user?.email || req.user?.userId || null);
  }
  @Post('imports/:id/rows') rows(@Param('id', ParseIntPipe) id: number, @Body() body: { rows?: unknown }) {
    return this.locations.importRows(id, body?.rows);
  }
  @Post('imports/:id/finish') finish(@Param('id', ParseIntPipe) id: number, @Body() body: { error?: string }) {
    return this.locations.finishImport(id, body?.error);
  }
  @Post('recount') recount() { return this.locations.recountAll().then(() => ({ ok: true })); }
  @Get(':kind') list(@Param('kind') kind: string, @Query() query: { q?: string; stateId?: string; cityId?: string; page?: string }) {
    return this.locations.adminList(kind, query);
  }
  @Patch(':kind/:id') update(@Param('kind') kind: string, @Param('id', ParseIntPipe) id: number, @Body() body: { isActive?: boolean; name?: string }) {
    return this.locations.adminUpdate(kind, id, body || {});
  }
  @Delete(':kind/:id') remove(@Param('kind') kind: string, @Param('id', ParseIntPipe) id: number) {
    return this.locations.adminDelete(kind, id);
  }
}
