import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(dto: CreateWorkspaceDto, userId: string) {
    return this.prisma.workspace.create({
      data: {
        ...dto,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });
  }

  async getWorkspaceList(userId: string, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where: { members: { some: { userId } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workspace.count({
        where: { members: { some: { userId } } },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getWorkspaceById(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            role: true,
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        tags: true,
        mailAccounts: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    return workspace;
  }

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async deleteWorkspace(id: string) {
    return this.prisma.workspace.delete({
      where: { id },
    });
  }
}
