import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { FilterSubscribersDto } from './dto/filter-subscribers.dto';

@Controller({
  path: '/workspaces/:workspaceId/subscribers',
  version: '1'
})
export class SubscribersController {
  constructor(private readonly service: SubscribersService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubscriberDto
  ) {
    return this.service.create(workspaceId, dto);
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query() filter: FilterSubscribersDto
  ) {
    return this.service.findAll(workspaceId, filter);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.service.findOne(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriberDto
  ) {
    return this.service.update(workspaceId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string
  ) {
    return this.service.remove(workspaceId, id);
  }

  // IMPORT CSV
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @Param('workspaceId') workspaceId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.service.importCsv(workspaceId, file);
  }
}
