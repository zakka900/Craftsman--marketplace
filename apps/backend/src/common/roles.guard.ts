/** RBAC: @Roles('ADMIN') su un controller/handler protetto da JwtAuthGuard — legge il claim `role` del JWT. */
import { CanActivate, ExecutionContext, Injectable, SetMetadata, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Array<'CLIENT' | 'ADMIN'>) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass()
    ]);
    if (!required || required.length === 0) return true;

    const user = ctx.switchToHttp().getRequest().user;
    if (!user?.role || !required.includes(user.role)) {
      throw new ForbiddenException('INSUFFICIENT_ROLE');
    }
    return true;
  }
}
