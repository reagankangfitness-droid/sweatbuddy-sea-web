import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UnauthorizedException,
} from '@nestjs/common'
import { StreamService } from './stream.service'
import { verifyToken } from '@clerk/backend'

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('token')
  async getToken(
    @Headers('authorization') authorization?: string,
  ): Promise<{ token: string }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required')
    }

    const userId = await this.extractUserIdFromToken(authorization)

    if (!userId) {
      throw new UnauthorizedException('Invalid token')
    }

    const token = await this.streamService.generateUserToken(userId)

    return { token }
  }

  @Post('users')
  async createOrUpdateUser(
    @Body() body: { userId: string; name?: string; image?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: boolean }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required')
    }

    await this.streamService.createOrUpdateUser(body.userId, {
      name: body.name,
      image: body.image,
    })

    return { success: true }
  }

  @Post('channels')
  async createChannel(
    @Body() body: { groupId: string; name: string; members: string[] },
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: boolean }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required')
    }

    await this.streamService.createChannel(body.groupId, {
      name: body.name,
      members: body.members,
    })

    return { success: true }
  }

  @Post('channels/members')
  async addMemberToChannel(
    @Body() body: { groupId: string; userId: string },
    @Headers('authorization') authorization?: string,
  ): Promise<{ success: boolean }> {
    if (!authorization) {
      throw new UnauthorizedException('Authorization header required')
    }

    await this.streamService.addMemberToChannel(body.groupId, body.userId)

    return { success: true }
  }

  private async extractUserIdFromToken(authorization: string): Promise<string | null> {
    try {
      const token = authorization.replace('Bearer ', '')

      // Verify the Clerk JWT token
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      })

      // Extract user ID from the verified token
      return payload.sub
    } catch (error) {
      console.error('Failed to verify Clerk token:', error)
      return null
    }
  }
}
