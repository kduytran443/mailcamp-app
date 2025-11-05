import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { CurrentUser } from "src/auth/current-user.decorator";
import { PaginationDto } from "src/app/dto/pagination.dto";
import { WorkspaceMemberGuard } from "src/auth/guards/workspace-member.guard";
import { WorkspaceOwnerGuard } from "src/auth/guards/workspace-owner.guard";
import { WorkspacesService } from "./workspaces.service";

@Controller({
  path: 'workspaces',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspaceService: WorkspacesService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: any,
  ) {
    return this.workspaceService.createWorkspace(dto, user.id);
  }

  @Get()
  async list(
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.workspaceService.getWorkspaceList(
      user.id,
      query.page,
      query.pageSize,
    );
  }

  @Get(":id")
  @UseGuards(WorkspaceMemberGuard)
  async detail(@Param("id") id: string) {
    return this.workspaceService.getWorkspaceById(id);
  }

  @Patch(":id")
  @UseGuards(WorkspaceOwnerGuard)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaceService.updateWorkspace(id, dto);
  }

  @Delete(":id")
  @UseGuards(WorkspaceOwnerGuard)
  async delete(@Param("id") id: string) {
    return this.workspaceService.deleteWorkspace(id);
  }
}
