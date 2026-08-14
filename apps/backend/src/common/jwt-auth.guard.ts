/** JWT Guard: protects routes; the verified payload ends up in req.user ({ sub, email }). */
import {
  CanActivate, ExecutionContext, Injectable, UnauthorizedException,
  createParamDecorator
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('MISSING_TOKEN');
    try {
      req.user = this.jwt.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN');
    }
  }
}

/** @CurrentUser() → authenticated user id (`sub` claim of the JWT). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest().user?.sub
);
