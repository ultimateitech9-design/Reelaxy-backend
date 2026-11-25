import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CoinTransaction } from '../users/coin-transaction.entity';
import { hasGender, isFemaleGender } from '../common/gender';

/** Reward for both people, decided by who joined: a woman 100, anyone else 50 (1 coin = ₹1). */
export const REFERRAL_REWARD_FEMALE = 100;
export const REFERRAL_REWARD_OTHER = 50;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Referral program.
 * - Everyone (members, guests, women) gets a share code.
 * - A new account remembers who invited it (once, never yourself).
 * - The reward is paid once, when the invited person has a permanent (non-guest)
 *   account with a gender set — so endless guest accounts can't farm rewards.
 * - Women receive rewards as withdrawable earnings; men and guests receive
 *   spendable coins (they cannot withdraw).
 */
@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(CoinTransaction) private readonly transactions: Repository<CoinTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  normalizeCode(code?: string | null) {
    const value = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return value.length >= 4 && value.length <= 16 ? value : '';
  }

  /** The user's share code, created on first use. */
  async ensureCode(userId: string) {
    const user = await this.users.findOne({ where: { id: userId }, select: ['id', 'referralCode'] });
    if (!user) return '';
    if (user.referralCode) return user.referralCode;
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = Array.from({ length: 7 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
      try {
        const result = await this.users.createQueryBuilder().update(User).set({ referralCode: code })
          .where('id = :id AND referralCode IS NULL', { id: userId }).execute();
        if (result.affected) return code;
        const again = await this.users.findOne({ where: { id: userId }, select: ['id', 'referralCode'] });
        if (again?.referralCode) return again.referralCode;
      } catch {
        // Duplicate code (unique index): try another one.
      }
    }
    throw new Error('Could not create a referral code.');
  }

  /** Remember who invited a freshly created account. Silently ignores bad or self codes. */
  async attach(newUserId: string, rawCode?: string | null) {
    const code = this.normalizeCode(rawCode);
    if (!code) return;
    const referrer = await this.users.findOne({ where: { referralCode: code }, select: ['id', 'status'] });
    if (!referrer || referrer.id === newUserId || referrer.status !== 'active') return;
    await this.users.createQueryBuilder().update(User).set({ referredById: referrer.id })
      .where('id = :id AND referredById IS NULL', { id: newUserId }).execute();
  }

  /** Pay the referral reward if this account now qualifies. Safe to call any number of times. */
  async tryReward(userId: string) {
    try {
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(User);
        const referee = await repo.findOne({ where: { id: userId }, lock: { mode: 'pessimistic_write' } });
        if (!referee?.referredById || referee.referralRewardedAt || referee.isGuest || !hasGender(referee.gender)) return;
        const referrer = await repo.findOne({ where: { id: referee.referredById }, lock: { mode: 'pessimistic_write' } });
        if (!referrer || referrer.id === referee.id) return;

        const coins = isFemaleGender(referee.gender) ? REFERRAL_REWARD_FEMALE : REFERRAL_REWARD_OTHER;
        for (const person of [referrer, referee]) {
          if (isFemaleGender(person.gender) && !person.isGuest) person.earnedCoinBalance += coins;
          else person.coinBalance += coins;
        }
        referee.referralRewardedAt = new Date();
        await repo.save([referrer, referee]);

        const txRepo = manager.getRepository(CoinTransaction);
        await txRepo.save([
          txRepo.create({
            type: 'referral', status: 'completed', userId: referrer.id, senderId: referrer.id, receiverId: referee.id,
            grossCoins: coins, userCoins: coins, platformCoins: 0,
            label: `Referral bonus: ${referee.name} joined`.slice(0, 120), payoutAccount: null,
          }),
          txRepo.create({
            type: 'referral', status: 'completed', userId: referee.id, senderId: referrer.id, receiverId: referee.id,
            grossCoins: coins, userCoins: coins, platformCoins: 0,
            label: `Referral bonus: joined with ${referrer.name}'s invite`.slice(0, 120), payoutAccount: null,
          }),
        ]);
      });
    } catch (error) {
      // A reward problem must never break sign-up or profile saving.
      this.logger.error(`Referral reward failed for ${userId}: ${error instanceof Error ? error.message : error}`);
    }
  }

  /** Share code, reward rules and the people this user invited. */
  async mine(userId: string) {
    const code = await this.ensureCode(userId);
    const invited = await this.users.find({
      where: { referredById: userId },
      select: ['id', 'name', 'createdAt', 'referralRewardedAt', 'isGuest'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const earned = await this.transactions.createQueryBuilder('t')
      .select('COALESCE(SUM(t.grossCoins), 0)', 'total')
      .where('t.userId = :userId AND t.type = :type', { userId, type: 'referral' })
      .getRawOne<{ total: string }>();
    return {
      code,
      rewardFemale: REFERRAL_REWARD_FEMALE,
      rewardOther: REFERRAL_REWARD_OTHER,
      earnedCoins: Number(earned?.total || 0),
      invitedCount: invited.length,
      rewardedCount: invited.filter((user) => user.referralRewardedAt).length,
      invited: invited.map((user) => ({
        name: (user.name || 'New member').split(' ')[0],
        joinedAt: user.createdAt,
        status: user.referralRewardedAt ? 'rewarded' : 'pending',
      })),
    };
  }
}
