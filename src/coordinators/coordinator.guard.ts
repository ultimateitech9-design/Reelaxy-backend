import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coordinator } from './coordinator.entity';

export function coordinatorSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error('JWT_SECRET must be configured');
  return `${secret}:reelaxy-coordinator`;
}

@Injectable()
export class CoordinatorGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, @InjectRepository(Coordinator) private readonly coordinators: Repository<Coordinator>) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    try {
      const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new Error();
      const payload = await this.jwt.verifyAsync(token, { secret: coordinatorSecret(), audience: 'coordinator' });
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error();
      const coordinator = await this.coordinators.findOneBy({ id: payload.sub });
      if (!coordinator || coordinator.status !== 'active' || payload.version !== coordinator.sessionVersion) throw new Error();
      request.coordinator = coordinator;
      return true;
    } catch { throw new UnauthorizedException('Please sign in to your coordinator account.'); }
  }
}
