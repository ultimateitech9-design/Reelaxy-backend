import type { User, UserPlan } from '../users/user.entity';

export type PlanEntitlements = {
  likesPerDay: number;
  messagesPerUser: number | null;
  matches: number;
  profilePhotos: number;
  /** Time-limited calls to matches per month (see PLAN_CALL_SECONDS). */
  audioCallsPerMonth: number;
  videoCallsPerMonth: number;
  sharedImagesPerMonth: number;
  superLikesPerMonth: number;
  rewindsPerMonth: number;
  firstImpressionsPerMonth: number;
  boostsPerMonth: number;
  voiceMessages: boolean;
  verifiedBadge: boolean;
  /** false: plan calls have no time limit (women). */
  limitedCalls: boolean;
};

/** Length of each plan call. Not shown on the plan cards, only enforced. */
export const PLAN_CALL_SECONDS = { audio: 30, video: 20 } as const;

/**
 * Reelaxy has a single plan for everyone: likes, matches and messages are
 * free and unlimited. The only paid product is the wallet (coins), which is
 * charged per minute for audio/video calls in direct-calls.service.ts.
 * Super Like, First Impression, Rewind and Boost are not part of Reelaxy.
 */
const UNLIMITED = Number.MAX_SAFE_INTEGER;
const REELAXY_ENTITLEMENTS: PlanEntitlements = {
  likesPerDay: UNLIMITED,
  messagesPerUser: null,
  matches: UNLIMITED,
  profilePhotos: 10,
  // Plan calls are gone: every call is a wallet-paid direct call.
  audioCallsPerMonth: 0,
  videoCallsPerMonth: 0,
  sharedImagesPerMonth: UNLIMITED,
  superLikesPerMonth: 0,
  rewindsPerMonth: 0,
  firstImpressionsPerMonth: 0,
  boostsPerMonth: 0,
  voiceMessages: true,
  verifiedBadge: false,
  limitedCalls: true,
};

export const PLAN_ENTITLEMENTS: Record<UserPlan, PlanEntitlements> = {
  free: REELAXY_ENTITLEMENTS,
  gold: REELAXY_ENTITLEMENTS,
  platinum: REELAXY_ENTITLEMENTS,
};

export function isWoman(user: Pick<User, 'gender'>): boolean {
  const gender = String(user.gender || '').trim().toLowerCase();
  return ['female', 'woman', 'women', 'girl', 'ladies', 'f'].includes(gender);
}

/** Reelaxy has no subscription plans; everyone is on the single free plan. */
export function activePlan(_user?: Pick<User, 'plan' | 'planExpiresAt'>): UserPlan {
  return 'free';
}

export function entitlementsFor(_user?: Pick<User, 'plan' | 'planExpiresAt'> & Partial<Pick<User, 'gender'>>): PlanEntitlements {
  return REELAXY_ENTITLEMENTS;
}

export function monthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** First day of the current month at midnight India time. */
export function monthStartIndia(): Date {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return new Date(`${value('year')}-${value('month')}-01T00:00:00+05:30`);
}

export function dayStart(): Date {
  // Plans are sold to the India audience; daily call and like allowances reset
  // together at midnight India time even when the API host runs in UTC.
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return new Date(`${value('year')}-${value('month')}-${value('day')}T00:00:00+05:30`);
}
