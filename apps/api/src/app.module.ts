import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ActivityModule } from './activity/activity.module'
import { PrismaService } from './prisma.service'

@Module({
  imports: [ActivityModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
