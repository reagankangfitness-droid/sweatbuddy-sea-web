import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { StreamService } from '../stream/stream.service'
import { Activity, Prisma } from '@prisma/client'

interface CreateActivityData {
  title: string
  description?: string
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city: string
  latitude: number
  longitude: number
  startTime?: Date
  endTime?: Date
  maxPeople?: number
  imageUrl?: string
  price?: number
  currency?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
}

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private streamService: StreamService,
  ) {}

  async findAll() {
    return this.prisma.activity.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            userActivities: {
              where: {
                status: 'JOINED',
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string): Promise<Activity | null> {
    return this.prisma.activity.findUnique({
      where: { id },
    })
  }

  async create(data: CreateActivityData, userId: string): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        imageUrl: data.imageUrl,
        price: data.price ?? 0,
        currency: data.currency ?? 'USD',
        status: data.status ?? 'PUBLISHED',
        userId,
        hostId: userId, // Creator is the host by default
      },
    })
  }

  async update(id: string, data: Prisma.ActivityUpdateInput): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id },
      data,
    })
  }

  async remove(id: string): Promise<Activity> {
    return this.prisma.activity.delete({
      where: { id },
    })
  }

  async joinActivity(activityId: string, userId: string) {
    // Check if activity exists
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      include: {
        userActivities: {
          where: {
            status: 'JOINED',
          },
        },
      },
    })

    if (!activity) {
      throw new NotFoundException('Activity not found')
    }

    // Check if user already joined
    const existingRsvp = await this.prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    })

    if (existingRsvp) {
      throw new BadRequestException('Already joined this activity')
    }

    // Check if activity is full
    if (activity.maxPeople) {
      const currentParticipants = activity.userActivities.length
      if (currentParticipants >= activity.maxPeople) {
        throw new BadRequestException('Activity is full')
      }
    }

    // Create UserActivity record
    const userActivity = await this.prisma.userActivity.create({
      data: {
        userId,
        activityId,
        status: 'JOINED',
      },
    })

    // Add user to Stream Chat channel
    try {
      await this.streamService.addMemberToChannel(activityId, userId)
    } catch (error) {
      // Log error but don't fail the join operation if Stream is not configured
      console.error('Failed to add user to Stream channel:', error)
    }

    return userActivity
  }

  async leaveActivity(activityId: string, userId: string): Promise<void> {
    // Check if UserActivity exists
    const existingRsvp = await this.prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    })

    if (!existingRsvp) {
      throw new BadRequestException('Not joined to this activity')
    }

    // Delete the UserActivity record
    await this.prisma.userActivity.delete({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    })

    // Remove user from Stream Chat channel
    try {
      await this.streamService.removeMemberFromChannel(activityId, userId)
    } catch (error) {
      // Log error but don't fail the leave operation if Stream is not configured
      console.error('Failed to remove user from Stream channel:', error)
    }
  }
}
