import { Body, Controller, Post } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignsService } from './campaigns.service';

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
}
