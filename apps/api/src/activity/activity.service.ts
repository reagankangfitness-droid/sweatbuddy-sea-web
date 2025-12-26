import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { Activity, Prisma } from '@prisma/client'

interface CreateActivityData {
  title: string
  description?: string
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city: string
  address?: string
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
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
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
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        startTime: data.startTime,
        endTime: data.endTime,
        maxPeople: data.maxPeople,
        imageUrl: data.imageUrl,
        price: data.price ?? 0,
        currency: data.currency ?? 'SGD',
        status: data.status ?? 'PUBLISHED',
        userId,
        hostId: userId,
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

  // TODO: Add joinActivity and leaveActivity when UserActivity model is added to schema
}
