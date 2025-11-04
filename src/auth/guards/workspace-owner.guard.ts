import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const workspaceId = req.params.id;

    const member = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: user.id },
    });

    if (!member || member.role !== "OWNER") {
      throw new ForbiddenException("Only workspace owner can perform this action");
    }

    req.workspaceMember = member;
    return true;
  }
}
