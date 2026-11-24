import { normalizeLanguages } from '../common/spoken-languages';
import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { User } from '../users/user.entity';
import { Coordinator, CoordinatorEmailChallenge } from './coordinator.entity';
import { coordinatorSecret } from './coordinator.guard';
import { CoordinatorBulkUsersDto, CoordinatorLoginDto, CoordinatorRegisterDto, CoordinatorResetDto, CoordinatorUsersQueryDto } from './coordinators.dto';
import { UserActivityService } from '../users/user-activity.service';
import { AuditLog } from '../platform/audit-log.entity';
import { VideoCall } from '../messages/video-call.entity';
import { CoinTransaction } from '../users/coin-transaction.entity';
import { monthStartIndia } from '../plans/plan-entitlements';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class CoordinatorsService {
  private readonly limits = new Map<string, { count: number; until: number }>();
  constructor(
    @InjectRepository(Coordinator) private readonly coordinators: Repository<Coordinator>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly db: DataSource, private readonly jwt: JwtService,
    private readonly activity: UserActivityService,
    private readonly gateway: MessagesGateway,
  ) {}

  throttle(key: string, max: number) {
    const now = Date.now();
    for (const [k, value] of this.limits) if (value.until <= now) this.limits.delete(k);
    const value = this.limits.get(key) || { count: 0, until: now + 15 * 60_000 };
    if (++value.count > max) throw new HttpException('Too many attempts. Please try again in 15 minutes.', 429);
    this.limits.set(key, value);
  }
  /**
   * Coins this coordinator earned from direct calls to the users it created:
   * wallet balance, this month / all-time totals, per-user totals and the
   * latest entries.
   */
  async earnings(coordinatorId: string) {
    const coordinator = await this.coordinators.findOne({ where: { id: coordinatorId } });
    if (!coordinator) throw new NotFoundException('Coordinator not found.');
    const tx = () => this.db.getRepository(CoinTransaction).createQueryBuilder('tx').where("tx.type = 'call' AND tx.coordinatorId = :coordinatorId", { coordinatorId });
    const monthStart = monthStartIndia();
    const [month, allTime, byUser, recent] = await Promise.all([
      tx().andWhere('tx.createdAt >= :monthStart', { monthStart }).select('COALESCE(SUM(tx.coordinatorCoins), 0)', 'coins').getRawOne(),
      tx().select('COALESCE(SUM(tx.coordinatorCoins), 0)', 'coins').addSelect('COUNT(*)', 'minutes').getRawOne(),
      tx().leftJoin(User, 'user', 'user.id = tx.receiverId')
        .select('tx.receiverId', 'userId').addSelect('user.name', 'name')
        .addSelect('SUM(tx.coordinatorCoins)', 'coins').addSelect('COUNT(*)', 'minutes')
        .groupBy('tx.receiverId').addGroupBy('user.name')
        .orderBy('coins', 'DESC').limit(20).getRawMany(),
      tx().leftJoin(User, 'user', 'user.id = tx.receiverId')
        .select(['tx.id AS id', 'tx.createdAt AS createdAt', 'tx.coordinatorCoins AS coins', 'tx.label AS label', 'user.name AS name'])
        .orderBy('tx.createdAt', 'DESC').limit(20).getRawMany(),
    ]);
    return {
      balance: coordinator.earnedCoinBalance,
      thisMonth: Number(month?.coins) || 0,
      allTime: Number(allTime?.coins) || 0,
      paidMinutes: Number(allTime?.minutes) || 0,
      byUser: byUser.map((row) => ({ userId: row.userId, name: row.name, coins: Number(row.coins) || 0, minutes: Number(row.minutes) || 0 })),
      recent: recent.map((row) => ({ id: row.id, createdAt: row.createdAt, coins: Number(row.coins) || 0, label: row.label, name: row.name })),
    };
  }

  publicCoordinator(coordinator: Coordinator) { return { id: coordinator.id, name: coordinator.name, email: coordinator.email, createdAt: coordinator.createdAt }; }
  private session(coordinator: Coordinator) {
    return { coordinator: this.publicCoordinator(coordinator), token: this.jwt.sign({ sub: coordinator.id, version: coordinator.sessionVersion }, { secret: coordinatorSecret(), audience: 'coordinator', expiresIn: '12h' }) };
  }
  private hash(email: string, purpose: string, code: string) {
    return createHmac('sha256', coordinatorSecret()).update(`${purpose}:${email}:${code}`).digest('hex');
  }

  async sendCode(email: string, purpose: 'signup' | 'reset') {
    const coordinator = await this.coordinators.findOneBy({ email });
    if (purpose === 'signup' && coordinator) throw new ConflictException('This email already has an coordinator account. Please sign in.');
    const message = 'If this email is eligible, a verification code has been sent. It expires in 10 minutes.';
    if (purpose === 'reset' && !coordinator) return { message };
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass) throw new ServiceUnavailableException('Email delivery is not configured. Please contact support.');
    const code = randomInt(100000, 1000000).toString();
    const now = new Date();
    const challenge = await this.db.transaction(async (manager) => {
      const repo = manager.getRepository(CoordinatorEmailChallenge);
      const current = await repo.findOne({ where: { email, purpose }, lock: { mode: 'pessimistic_write' } });
      if (current && now.getTime() - current.sentAt.getTime() < 60_000) throw new HttpException('Please wait 60 seconds before requesting another code.', 429);
      const sameWindow = current && now.getTime() - current.windowStartedAt.getTime() < 3600_000;
      if (sameWindow && current.sends >= 5) throw new HttpException('Too many email requests. Please try again in one hour.', 429);
      return repo.save(repo.create({ id: current?.id, email, purpose, codeHash: this.hash(email, purpose, code), expiresAt: new Date(now.getTime() + 600_000), sentAt: now, attempts: 0, sends: sameWindow ? current.sends + 1 : 1, windowStartedAt: sameWindow ? current.windowStartedAt : now }));
    });
    const port = Number(process.env.SMTP_PORT || 465);
    const mailer = nodemailer.createTransport({ host, port, secure: (process.env.SMTP_SECURE || String(port === 465)) === 'true', auth: { user, pass }, connectionTimeout: 15000, socketTimeout: 20000 });
    try {
      await mailer.sendMail({ from: process.env.SMTP_FROM?.trim() || user, to: email, subject: `${code} - Reelaxy Coordinator ${purpose === 'signup' ? 'verification' : 'password reset'}`, text: `Your Reelaxy Coordinator ${purpose === 'signup' ? 'verification' : 'password reset'} code is ${code}. It expires in 10 minutes. Never share this code. If you did not request it, ignore this email.` });
    } catch {
      await this.db.getRepository(CoordinatorEmailChallenge).delete({ id: challenge.id, codeHash: challenge.codeHash });
      throw new ServiceUnavailableException('We could not send the email. Please try again.');
    } finally { mailer.close(); }
    return { message };
  }

  // Return verification failures so attempt counters commit even when a code is incorrect.
  private async consume(manager: EntityManager, email: string, purpose: string, otp: string) {
    const repo = manager.getRepository(CoordinatorEmailChallenge);
    const challenge = await repo.findOne({ where: { email, purpose }, lock: { mode: 'pessimistic_write' } });
    if (!challenge || challenge.expiresAt.getTime() <= Date.now() || challenge.attempts >= 5) return false;
    const correct = timingSafeEqual(Buffer.from(challenge.codeHash, 'hex'), Buffer.from(this.hash(email, purpose, otp), 'hex'));
    if (!correct) { await repo.increment({ id: challenge.id }, 'attempts', 1); return false; }
    // Preserve send counters until the hourly window ends.
    await repo.update(challenge.id, { expiresAt: new Date(0), attempts: 5 });
    return true;
  }
  private async writeConflict<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') throw new ConflictException('An account with one of these emails already exists. No accounts were added.');
      throw error;
    }
  }
  async register(dto: CoordinatorRegisterDto) {
    const password = await bcrypt.hash(dto.password, 12);
    const coordinator = await this.writeConflict(() => this.db.transaction(async (manager) => {
      if (!await this.consume(manager, dto.email, 'signup', dto.otp)) return null;
      return manager.save(Coordinator, manager.create(Coordinator, { name: dto.name, email: dto.email, password }));
    }));
    if (!coordinator) throw new UnauthorizedException('The code is incorrect or expired. Request a new code after five attempts.');
    return this.session(coordinator);
  }
  async login(dto: CoordinatorLoginDto) {
    const coordinator = await this.coordinators.createQueryBuilder('coordinator').addSelect('coordinator.password').where('coordinator.email = :email', { email: dto.email }).getOne();
    if (!coordinator || !await bcrypt.compare(dto.password, coordinator.password)) throw new UnauthorizedException('Incorrect email or password.');
    if (coordinator.status !== 'active') throw new UnauthorizedException('This coordinator account is not active. Please contact support.');
    return this.session(coordinator);
  }
  async reset(dto: CoordinatorResetDto) {
    const password = await bcrypt.hash(dto.password, 12);
    const ok = await this.db.transaction(async (manager) => {
      if (!await this.consume(manager, dto.email, 'reset', dto.otp)) return false;
      await manager.createQueryBuilder().update(Coordinator).set({ password, sessionVersion: () => 'sessionVersion + 1' }).where('email = :email', { email: dto.email }).execute();
      return true;
    });
    if (!ok) throw new UnauthorizedException('The code is incorrect or expired. Request a new code after five attempts.');
    return { message: 'Password reset successfully. Please sign in with your new password.' };
  }
  async logout(id: string) { await this.coordinators.increment({ id }, 'sessionVersion', 1); return { success: true }; }

  async listUsers(coordinatorId: string, query: CoordinatorUsersQueryDto) {
    const builder = this.users.createQueryBuilder('user').select(['user.id', 'user.name', 'user.email', 'user.phone', 'user.birthDate', 'user.gender', 'user.city', 'user.profession', 'user.bio', 'user.status', 'user.createdAt', 'user.onboardingCompleted', 'user.coordinatorEmailChangedAt']).where('user.createdByCoordinatorId = :coordinatorId', { coordinatorId }).andWhere('user.role = :role', { role: 'user' });
    if (query.search.trim()) builder.andWhere('(user.name LIKE :search OR user.email LIKE :search OR user.city LIKE :search)', { search: `%${query.search.trim()}%` });
    const [users, total] = await builder.orderBy('user.createdAt', 'DESC').skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    const totalAccounts = await this.users.countBy({ createdByCoordinatorId: coordinatorId, role: 'user' });
    const activeAccounts = await this.users.countBy({ createdByCoordinatorId: coordinatorId, status: 'active', role: 'user' });
    return { users, total, totalAccounts, activeAccounts, page: query.page, pages: Math.max(1, Math.ceil(total / query.limit)) };
  }
  async createUsers(coordinatorId: string, dto: CoordinatorBulkUsersDto) {
    if (!dto.consentConfirmed) throw new BadRequestException('Confirm that each adult user has agreed to account creation and profile publication.');
    const emails = dto.users.map(user => user.email);
    if (new Set(emails).size !== emails.length) throw new BadRequestException('Each user must have a different email address.');
    for (const user of dto.users) {
      const birth = new Date(user.birthDate);
      const today = new Date();
      let age = today.getUTCFullYear() - birth.getUTCFullYear();
      if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(user.birthDate) || !Number.isFinite(age) || age < 18 || age > 90) throw new BadRequestException(`${user.name}: users must be between 18 and 90 years old.`);
      for (const photo of user.photos || []) {
        if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo)) throw new BadRequestException(`${user.name}: upload a JPG, PNG or WebP photo.`);
      }
    }
    const prepared = [];
    for (const user of dto.users) prepared.push({ ...user, spokenLanguages: normalizeLanguages(user.spokenLanguages), photos: user.photos || [], photosVisibleToNonMatches: true, password: await bcrypt.hash(user.password, 12), createdByCoordinatorId: coordinatorId, role: 'user' as const, status: 'active' as const, onboardingCompleted: false, isVerified: false });
    const result = await this.writeConflict(() => this.db.transaction(async manager => {
      const coordinator = await manager.findOne(Coordinator, { where: { id: coordinatorId }, lock: { mode: 'pessimistic_write' } });
      if (!coordinator || coordinator.status !== 'active') throw new UnauthorizedException('This coordinator account is not active.');
      const saved = await manager.save(User, prepared.map(user => manager.create(User, user)));
      await manager.save(AuditLog, saved.map(user => manager.create(AuditLog, {
        user: coordinator.name, userId: user.id, activity: `Coordinator ${coordinatorId} created user ${user.id}`,
        action: 'Create', module: 'Coordinator Users', role: 'coordinator',
      })));
      return saved.map(user => ({ id: user.id, name: user.name, email: user.email, status: user.status, onboardingCompleted: user.onboardingCompleted, createdAt: user.createdAt }));
    }));
    return { users: result, message: `${result.length} account${result.length === 1 ? '' : 's'} created. Users can sign in with their email and assigned password.` };
  }

  async exportUsers(coordinatorId: string, cursor?: string) {
    const query = this.users.createQueryBuilder('user').select(['user.id', 'user.createdAt'])
      .where('user.createdByCoordinatorId = :coordinatorId AND user.role = :role', { coordinatorId, role: 'user' });
    if (cursor) {
      let marker: { id: string; at: string };
      try {
        marker = JSON.parse(Buffer.from(cursor, 'base64url').toString());
        if (typeof marker.id !== 'string' || marker.id.length !== 36 || !Number.isFinite(Date.parse(marker.at))) throw new Error();
      } catch { throw new BadRequestException('Invalid user export cursor.'); }
      query.andWhere('(user.createdAt < :at OR (user.createdAt = :at AND user.id < :id))', { at: marker.at, id: marker.id });
    }
    const ranked = await query.addSelect("DATE_FORMAT(user.createdAt, '%Y-%m-%d %H:%i:%s.%f')", 'cursorAt')
      .orderBy('user.createdAt', 'DESC').addOrderBy('user.id', 'DESC').take(6).getRawAndEntities();
    const page = ranked.entities;
    const ids = page.slice(0, 5).map(user => user.id);
    const records = ids.length ? await this.users.createQueryBuilder('user')
      .select(['user.id', 'user.name', 'user.email', 'user.phone', 'user.birthDate', 'user.gender', 'user.city', 'user.profession', 'user.bio', 'user.photos', 'user.status', 'user.createdAt', 'user.onboardingCompleted', 'user.coordinatorEmailChangedAt'])
      .where('user.id IN (:...ids) AND user.createdByCoordinatorId = :coordinatorId AND user.role = :role', { ids, coordinatorId, role: 'user' }).getMany() : [];
    const byId = new Map(records.map(user => [user.id, user]));
    const users = ids.map(id => byId.get(id)).filter((user): user is User => Boolean(user));
    const last = page[Math.min(page.length, 5) - 1];
    const lastRaw = last ? ranked.raw.find(row => row.user_id === last.id) : undefined;
    return { users, nextCursor: page.length > 5 && last ? Buffer.from(JSON.stringify({ id: last.id, at: lastRaw.cursorAt })).toString('base64url') : null };
  }

  async userDetails(coordinatorId: string, id: string) {
    const user = await this.users.findOne({
      where: { id, createdByCoordinatorId: coordinatorId, role: 'user' },
      select: ['id', 'name', 'email', 'phone', 'birthDate', 'gender', 'city', 'profession', 'bio', 'photos', 'status', 'createdAt', 'onboardingCompleted', 'coordinatorEmailChangedAt'],
    });
    if (!user) throw new NotFoundException('User not found in your workspace.');
    return { user: { ...user, activity: await this.activity.get(id) } };
  }

  async updatePhoto(coordinatorId: string, id: string, photo: string) {
    await this.db.transaction(async manager => {
      const repo = manager.getRepository(User);
      const user = await repo.findOne({ where: { id, createdByCoordinatorId: coordinatorId, role: 'user' }, lock: { mode: 'pessimistic_write' } });
      if (!user) throw new NotFoundException('User not found in your workspace.');
      if (user.photos?.[0] === photo) return;
      // An incomplete, photo-less coordinator profile still has its initial DB defaults.
      if (!user.onboardingCompleted && !user.photos?.length) user.photosVisibleToNonMatches = true;
      user.photos = [photo, ...(user.photos || []).slice(1).filter(existing => existing !== photo)];
      user.isVerified = false;
      user.kycMatched = false;
      user.kycLivePhoto = null;
      user.kycMatchScore = null;
      user.kycVerifiedAt = null;
      await repo.save(user);
    });
    return { ...await this.userDetails(coordinatorId, id), message: 'Profile photo saved successfully.' };
  }

  async userActivity(coordinatorId: string, id: string, page: number) {
    if (!await this.users.existsBy({ id, createdByCoordinatorId: coordinatorId, role: 'user' })) throw new NotFoundException('User not found in your workspace.');
    return this.activity.get(id, page);
  }

  async moderateUser(coordinatorId: string, id: string, action: 'ban' | 'delete') {
    await this.db.transaction(async manager => {
      const repo = manager.getRepository(User);
      const user = await repo.findOne({ where: { id, createdByCoordinatorId: coordinatorId, role: 'user' }, lock: { mode: 'pessimistic_write' } });
      if (!user) throw new NotFoundException('User not found in your workspace.');
      await manager.save(AuditLog, manager.create(AuditLog, {
        user: user.name, userId: user.id, activity: `Coordinator ${coordinatorId} ${action === 'ban' ? 'banned' : 'deleted'} user ${id}`,
        action: action === 'ban' ? 'Ban' : 'Delete', module: 'Coordinator Users', role: 'coordinator',
      }));
      if (action === 'delete') await repo.remove(user);
      else {
        await repo.update(id, { status: 'banned', isOnline: false });
        await manager.createQueryBuilder().update(VideoCall).set({
          status: () => "CASE WHEN status = 'active' THEN 'ended' ELSE 'missed' END",
          endedAt: new Date(),
        }).where('(callerId = :id OR receiverId = :id) AND status IN (:...statuses)', { id, statuses: ['active', 'ringing'] }).execute();
      }
    });
    this.gateway.disconnectUser(id);
    return { success: true, message: action === 'ban' ? 'User has been banned.' : 'User has been permanently deleted.' };
  }
}
