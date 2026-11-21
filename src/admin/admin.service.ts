import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CoinTransaction } from '../users/coin-transaction.entity';
import { User } from '../users/user.entity';
import { Contact } from '../support/contact.entity';
import { Payment } from '../platform/payment.entity';
import { VerificationRequest } from '../platform/verification-request.entity';
import * as bcrypt from 'bcryptjs';
import { CreateManagementUserDto } from './dto/create-management-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(VerificationRequest)
    private readonly verificationRepo: Repository<VerificationRequest>,
  ) {}

  async getStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const recharges = this.userRepo.manager.getRepository(CoinTransaction);
    const [totalUsers, activeUsers, openTickets, buyers, revenue] = await Promise.all([
      this.userRepo.count({ where: { role: 'user' } }),
      this.userRepo.count({ where: { role: 'user', status: 'active' } }),
      this.contactRepo.count({ where: { status: 'open' } }),
      recharges.createQueryBuilder('tx').select('COUNT(DISTINCT tx.userId)', 'n')
        .where("tx.type = 'recharge' AND tx.status = 'completed'").getRawOne(),
      recharges.createQueryBuilder('tx').select('COALESCE(SUM(tx.amountPaise), 0)', 'total')
        .where("tx.type = 'recharge' AND tx.status = 'completed'")
        .andWhere('tx.createdAt >= :monthStart', { monthStart }).getRawOne(),
    ]);
    return {
      totalUsers,
      // Members who bought at least one coin pack (Reelaxy's only paid product).
      premiumUsers: Number(buyers?.n || 0),
      activeUsers,
      openTickets,
      revenueMtd: Number(revenue?.total || 0) / 100,
    };
  }

  async getAllUsers(page = 1, limit = 20) {
    const safePage = Math.max(1, page || 1);
    const safeLimit = Math.min(100, Math.max(1, limit || 20));
    const total = await this.userRepo.count();
    const rows = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id', 'user.name', 'user.email', 'user.role', 'user.plan', 'user.coinBalance',
        'user.status', 'user.isVerified', 'user.city', 'user.createdAt', 'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .addOrderBy('user.id', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getMany();
    return {
      users: rows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        coinBalance: user.coinBalance ?? 0,
        status: user.status,
        isVerified: user.isVerified,
        city: user.city,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async createManagementUser(body: CreateManagementUserDto, creatorRole?: string) {
    if ((body.role === 'admin' || body.role === 'user') && creatorRole !== 'super_admin') {
      throw new ForbiddenException('Only a Super Admin can create Admin or User accounts.');
    }
    const email = body.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new ConflictException('An ID with this email already exists.');

    const isRegularUser = body.role === 'user';
    const user = await this.userRepo.save(this.userRepo.create({
      name: body.name.trim(),
      email,
      password: await bcrypt.hash(body.password, 12),
      role: body.role,
      plan: isRegularUser ? 'free' : 'platinum',
      status: 'active',
      isVerified: !isRegularUser,
      onboardingCompleted: !isRegularUser,
    }));

    const { password: _, ...safeUser } = user as any;
    return { message: isRegularUser ? 'User account created successfully.' : 'Management ID created successfully.', user: safeUser };
  }

  async updateUserStatus(id: string, status: string) {
    await this.userRepo.update(id, { status: status as any });
    return { message: `User ${id} status updated to ${status}` };
  }

  async getAllContacts() {
    return this.contactRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getPayments() {
    const payments = await this.paymentRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return payments.map((payment) => ({
      id: payment.id,
      userId: payment.userId,
      user: payment.user ? { id: payment.user.id, name: payment.user.name, email: payment.user.email } : null,
      planName: payment.planName,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
    }));
  }

  async getVerificationQueue() {
    const queue = await this.verificationRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return queue.map((request) => ({
      id: request.id,
      userId: request.userId,
      user: request.user ? {
        id: request.user.id,
        name: request.user.name,
        email: request.user.email,
        isVerified: request.user.isVerified,
      } : null,
      idType: request.idType,
      priority: request.priority,
      status: request.status,
      createdAt: request.createdAt,
    }));
  }

  /** Wallet recharges (coin packs) — replaces the old subscription list. */
  async getSubscriptions() {
    const rows = await this.userRepo.manager.getRepository(CoinTransaction).find({
      where: { type: 'recharge', status: 'completed' },
      order: { createdAt: 'DESC' },
      take: 300,
    });
    const ids = [...new Set(rows.map((row) => row.userId).filter(Boolean))] as string[];
    const users = ids.length ? await this.userRepo.find({ where: { id: In(ids) }, select: ['id', 'name', 'email'] }) : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const revenue = rows.reduce((sum, row) => sum + Number(row.amountPaise || 0) / 100, 0);
    return {
      totals: { recharges: rows.length, buyers: ids.length, revenue },
      users: rows.map((row) => ({
        id: row.id,
        name: (row.userId && byId.get(row.userId)?.name) || 'Deleted user',
        email: (row.userId && byId.get(row.userId)?.email) || '',
        plan: `${(row.userCoins || row.grossCoins).toLocaleString('en-IN')} coins · \u20B9${(Number(row.amountPaise || 0) / 100).toLocaleString('en-IN')}`,
        joined: row.createdAt,
      })),
    };
  }

  async getAnalytics() {
    const users = await this.userRepo.find();
    const genderRatio = Object.entries(users.reduce<Record<string, number>>((acc, user) => {
      const key = user.gender || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    const geo = Object.entries(users.reduce<Record<string, number>>((acc, user) => {
      const key = user.city || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([city, count]) => ({ city, users: count }));

    const payments = await this.paymentRepo.find({ where: { status: 'successful' } });
    const revenueMonthly = payments.reduce<Record<string, number>>((acc, payment) => {
      const month = payment.createdAt.toLocaleString('en-US', { month: 'short' });
      acc[month] = (acc[month] || 0) + Number(payment.amount);
      return acc;
    }, {});

    return {
      genderRatio,
      geo,
      revenueMonthly: Object.entries(revenueMonthly).map(([m, rev]) => ({ m, rev })),
    };
  }
}
