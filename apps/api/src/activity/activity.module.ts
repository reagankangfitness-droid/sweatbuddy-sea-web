import { Module } from '@nestjs/common'
import { ActivityController } from './activity.controller'
import { ActivityService } from './activity.service'
import { PrismaService } from '../prisma.service'
import { StreamModule } from '../stream/stream.module'

@Module({
  imports: [StreamModule],
  controllers: [ActivityController],
  providers: [ActivityService, PrismaService],
})
export class ActivityModule {}
