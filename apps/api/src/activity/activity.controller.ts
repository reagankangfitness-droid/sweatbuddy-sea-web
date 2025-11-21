import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { ActivityService } from './activity.service'
import { Activity, Prisma } from '@prisma/client'

interface CreateActivityDto {
  title: string
  description?: string
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city: string
  latitude: number
  longitude: number
  startTime?: string
  endTime?: string
  maxPeople?: number
  imageUrl?: string
  price?: number
  currency?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
}

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async findAll() {
    return this.activityService.findAll()
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<Activity | null> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }
    return this.activityService.findOne(id)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() data: CreateActivityDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<Activity> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }

    // Convert string dates to Date objects
    const activityData = {
      title: data.title,
      description: data.description,
      type: data.type,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      maxPeople: data.maxPeople,
      imageUrl: data.imageUrl,
      price: data.price,
      currency: data.currency,
      status: data.status,
    }

    return this.activityService.create(activityData, userId)
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Prisma.ActivityUpdateInput,
    @Headers('x-user-id') userId?: string,
  ): Promise<Activity> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }
    return this.activityService.update(id, data)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }
    await this.activityService.remove(id)
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  async join(
    @Param('id') activityId: string,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }
    return this.activityService.joinActivity(activityId, userId)
  }

  @Delete(':id/join')
  @HttpCode(HttpStatus.NO_CONTENT)
  async leave(
    @Param('id') activityId: string,
    @Headers('x-user-id') userId?: string,
  ): Promise<void> {
    if (!userId) {
      throw new UnauthorizedException('User ID is required')
    }
    await this.activityService.leaveActivity(activityId, userId)
  }
}
