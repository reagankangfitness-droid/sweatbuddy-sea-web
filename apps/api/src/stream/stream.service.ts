import { Injectable } from '@nestjs/common'
import { StreamChat } from 'stream-chat'

@Injectable()
export class StreamService {
  private client: StreamChat | null = null
  private isConfigured: boolean

  constructor() {
    const apiKey = process.env.STREAM_API_KEY
    const apiSecret = process.env.STREAM_SECRET_KEY

    this.isConfigured = !!(apiKey && apiSecret)

    if (this.isConfigured && apiKey && apiSecret) {
      this.client = StreamChat.getInstance(apiKey, apiSecret)
      console.log('Stream Chat service initialized')
    } else {
      console.warn('Stream API credentials not configured - Stream Chat features will be disabled')
    }
  }

  private ensureConfigured() {
    if (!this.isConfigured || !this.client) {
      throw new Error('Stream Chat is not configured. Please set STREAM_API_KEY and STREAM_SECRET_KEY environment variables.')
    }
  }

  async generateUserToken(userId: string): Promise<string> {
    this.ensureConfigured()
    return this.client!.createToken(userId)
  }

  async createOrUpdateUser(userId: string, userData: {
    name?: string
    image?: string
  }): Promise<void> {
    this.ensureConfigured()
    await this.client!.upsertUser({
      id: userId,
      name: userData.name || 'User',
      image: userData.image,
    })
  }

  async createChannel(groupId: string, groupData: {
    name: string
    members: string[]
  }): Promise<void> {
    this.ensureConfigured()
    const channel = this.client!.channel('messaging', groupId, {
      created_by_id: groupData.members[0],
    })

    await channel.create()

    if (groupData.members.length > 0) {
      await channel.addMembers(groupData.members)
    }
  }

  async addMemberToChannel(groupId: string, userId: string): Promise<void> {
    this.ensureConfigured()
    const channel = this.client!.channel('messaging', groupId)
    await channel.addMembers([userId])
  }

  async removeMemberFromChannel(groupId: string, userId: string): Promise<void> {
    this.ensureConfigured()
    const channel = this.client!.channel('messaging', groupId)
    await channel.removeMembers([userId])
  }
}
