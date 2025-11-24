import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignsService } from './campaigns.service';
import { ListCampaignsQueryDto } from './dto/campaign.dto';

@Controller({
  path: 'campaigns',
  version: '1'
})
export class CampaignsController {

  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.createCampaign(dto);
  }

  @Get()
  async findAll(@Query() query: ListCampaignsQueryDto) {
    const { workspaceId, page, pageSize, search } = query;
    return this.campaignsService.findAll(workspaceId, page, pageSize, search);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    return this.campaignsService.findOne(id, workspaceId);
  }
}
