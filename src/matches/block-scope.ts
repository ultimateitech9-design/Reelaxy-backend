import { ForbiddenException } from '@nestjs/common';
import { MatchRelation, MatchStatus } from './match.entity';

export type BlockScope = 'all' | 'calls' | 'messages';

export function parseBlockScope(value: unknown): BlockScope {
  return value === 'calls' || value === 'messages' ? value : 'all';
}

/** The scope currently in force on a relation (null = not blocked). */
export function activeBlockScope(relation?: Pick<MatchRelation, 'status' | 'blockScope'> | null): BlockScope | null {
  if (!relation) return null;
  if (relation.status === MatchStatus.BLOCKED) return 'all';
  return relation.blockScope === 'calls' || relation.blockScope === 'messages' ? relation.blockScope : null;
}

export const callsBlocked = (relation?: Pick<MatchRelation, 'status' | 'blockScope'> | null) => {
  const scope = activeBlockScope(relation);
  return scope === 'all' || scope === 'calls';
};

export const messagesBlocked = (relation?: Pick<MatchRelation, 'status' | 'blockScope'> | null) => {
  const scope = activeBlockScope(relation);
  return scope === 'all' || scope === 'messages';
};

/**
 * Applies a block to an existing relation (mutates; caller saves).
 * 'all' sets status BLOCKED; 'calls' / 'messages' keep the status so the rest keeps working.
 */
export function applyBlock(relation: MatchRelation, blockerId: string, scope: BlockScope): MatchRelation {
  const current = activeBlockScope(relation);
  const blocker = relation.blockedByUserId || (relation.status === MatchStatus.BLOCKED ? relation.senderId : null);
  if (current && blocker && blocker !== blockerId) {
    if (current === 'all') throw new ForbiddenException('This user has blocked this conversation.');
    // The other person already restricted one channel: combine both restrictions.
    if (current !== scope) scope = 'all';
  }

  if (scope === 'all') {
    if (relation.status !== MatchStatus.BLOCKED) relation.statusBeforeBlock = relation.status;
    relation.status = MatchStatus.BLOCKED;
  } else if (relation.status === MatchStatus.BLOCKED) {
    // Going from a full block to a partial one: restore the previous status.
    relation.status = relation.statusBeforeBlock || MatchStatus.MATCHED;
    relation.statusBeforeBlock = null;
  }
  relation.blockScope = scope;
  relation.blockedByUserId = blockerId;
  return relation;
}

/** Removes any block placed by `userId` (mutates; caller saves). */
export function removeBlock(relation: MatchRelation, userId: string): MatchRelation {
  const current = activeBlockScope(relation);
  if (!current) return relation;
  const blocker = relation.blockedByUserId || relation.senderId;
  if (blocker !== userId) throw new ForbiddenException('Only the user who blocked this conversation can unblock it.');
  if (relation.status === MatchStatus.BLOCKED) {
    relation.status = relation.statusBeforeBlock || MatchStatus.MATCHED;
    relation.statusBeforeBlock = null;
  }
  relation.blockScope = null;
  relation.blockedByUserId = null;
  return relation;
}
