// AI Agent utilities for SweatBuddies
// Phase 2: AI-powered features for hosts

export { anthropic, AGENT_MODEL, COMMUNITY_TYPE_CONTEXT } from './client'
export type { AgentContext, CommunityType, CommunityProfile } from './client'

export {
  WEEKLY_PULSE_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  CONTENT_SYSTEM_PROMPT,
  RETENTION_SYSTEM_PROMPT,
  SEGMENTATION_SYSTEM_PROMPT,
  getCategoryContext,
} from './prompts'

export {
  buildAgentContext,
  formatContextForChat,
  formatContextForPulse,
} from './context'
