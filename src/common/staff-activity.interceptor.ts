import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Observable, tap } from 'rxjs';
import { AuditLog } from '../platform/audit-log.entity';
import { User } from '../users/user.entity';
import { requestContext, StaffActor } from './request-context';

const STAFF_ROLES = new Set(['super_admin', 'admin', 'sales', 'support']);
const SAFE_FIELDS = ['status', 'role', 'scope', 'reason', 'action', 'amount', 'coins', 'discountPercent', 'code', 'name', 'title', 'plan', 'applicablePlan', 'enabled', 'priority'];

/**
 * Records every change a staff member makes (POST/PATCH/PUT/DELETE) in audit_logs,
 * with their name, role and email. Handlers that write their own descriptive entry
 * (via requestContext.markAudited) are not logged twice. Logins are logged by AuthService.
 */
@Injectable()
export class StaffActivityInterceptor implements NestInterceptor {
  private readonly names = new Map<string, { name: string; email: string }>();
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const role = String(req?.user?.role || '');
    if (!STAFF_ROLES.has(role)) return next.handle();

    const actorBase = {
      userId: String(req.user.userId || ''),
      role,
      email: String(req.user.email || ''),
      ip: String(req.headers?.['x-forwarded-for'] || req.ip || '').split(',')[0].trim().slice(0, 80) || 'unknown',
      device: String(req.headers?.['user-agent'] || '').slice(0, 255),
    };
    const method = String(req.method || 'GET').toUpperCase();
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const path = String(req.originalUrl || req.url || '').split('?')[0];
    const ctx: { actor?: StaffActor; audited?: boolean } = {};

    return new Observable((subscriber) => {
      void this.resolveActor(actorBase).then((actor) => {
        ctx.actor = actor;
        requestContext.run(ctx, () => {
          next.handle().pipe(
            tap({
              next: () => { if (mutating && !ctx.audited) void this.write(actor, method, path, req.body, null); },
              error: (err) => { if (mutating) void this.write(actor, method, path, req.body, err); },
            }),
          ).subscribe(subscriber);
        });
      });
    });
  }

  private async resolveActor(base: Omit<StaffActor, 'name'>): Promise<StaffActor> {
    let cached = this.names.get(base.userId);
    if (!cached && base.userId) {
      try {
        const user = await this.dataSource.getRepository(User).findOne({ where: { id: base.userId }, select: ['id', 'name', 'email'] });
        cached = { name: user?.name || base.email || 'Staff', email: user?.email || base.email };
        this.names.set(base.userId, cached);
        if (this.names.size > 500) this.names.clear();
      } catch { cached = { name: base.email || 'Staff', email: base.email }; }
    }
    return { ...base, name: cached?.name || base.email || 'Staff', email: cached?.email || base.email };
  }

  private async write(actor: StaffActor, method: string, path: string, body: any, error: any) {
    if (path.startsWith('/auth/') || path === '/api/health') return;
    const segments = path.split('/').filter(Boolean).filter((s) => !['api', 'admin', 'super-admin'].includes(s));
    const isId = (s: string) => /^[0-9a-f-]{8,}$/i.test(s) || /^\d+$/.test(s);
    const words = segments.filter((s) => !isId(s));
    const module = (words[0] || 'General').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80);
    const verb = method === 'POST' ? 'Create' : method === 'DELETE' ? 'Delete' : 'Update';
    const detail = words.length > 1 ? ` ${words.slice(1).join(' ').replace(/-/g, ' ')}` : '';
    const target = segments.find(isId);
    const fields = body && typeof body === 'object'
      ? SAFE_FIELDS.filter((key) => body[key] !== undefined && body[key] !== '').map((key) => `${key}: ${String(body[key]).slice(0, 40)}`)
      : [];
    const activity = [
      `${verb}${detail} ${module.toLowerCase()}`.trim(),
      target ? `#${target.slice(0, 8)}` : '',
      fields.length ? `(${fields.join(', ')})` : '',
      error ? `— failed: ${String(error?.message || error).slice(0, 80)}` : '',
    ].filter(Boolean).join(' ');
    try {
      await this.dataSource.getRepository(AuditLog).save(this.dataSource.getRepository(AuditLog).create({
        userId: actor.userId || null as any,
        user: actor.name.slice(0, 150),
        email: actor.email || null,
        role: actor.role,
        module,
        action: error ? 'Failed' : verb,
        activity: activity.slice(0, 255),
        ipAddress: actor.ip,
        device: actor.device,
      }));
    } catch { /* never block the request because of logging */ }
  }
}
