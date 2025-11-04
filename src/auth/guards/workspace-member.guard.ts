import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const workspaceId = req.params.id;

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!member) {
      throw new ForbiddenException("You are not a member of this workspace");
    }

    req.workspaceMember = member; // attach for controller using
    return true;
  }
}
