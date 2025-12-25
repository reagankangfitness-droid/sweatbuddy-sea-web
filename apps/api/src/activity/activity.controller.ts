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
  address?: string
  latitude: number
  longitude: number
  startTime?: string
  endTime?: string
  maxPeople?: number
  imageUrl?: string
  // Pricing fields
  isFree?: boolean
  price?: number
  currency?: string
  // PayNow fields
  paynowEnabled?: boolean
  paynowNumber?: string
  paynowName?: string
  paynowQrCode?: string
  // Stripe fields
  stripeEnabled?: boolean
  stripePriceId?: string
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
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
      maxPeople: data.maxPeople,
      imageUrl: data.imageUrl,
      // Pricing fields
      isFree: data.isFree,
      price: data.price,
      currency: data.currency,
      // PayNow fields
      paynowEnabled: data.paynowEnabled,
      paynowNumber: data.paynowNumber,
      paynowName: data.paynowName,
      paynowQrCode: data.paynowQrCode,
      // Stripe fields
      stripeEnabled: data.stripeEnabled,
      stripePriceId: data.stripePriceId,
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

  // TODO: Add join and leave endpoints when UserActivity model is added to schema
}
