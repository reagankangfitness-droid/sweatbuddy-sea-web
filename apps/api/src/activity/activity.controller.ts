import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ActivityService } from './activity.service'
import { Activity, Prisma } from '@prisma/client'

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async findAll(): Promise<Activity[]> {
    return this.activityService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Activity | null> {
    return this.activityService.findOne(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: Prisma.ActivityCreateInput): Promise<Activity> {
    return this.activityService.create(data)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ActivityUpdateInput,
  ): Promise<Activity> {
    return this.activityService.update(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.activityService.remove(id)
  }
}
