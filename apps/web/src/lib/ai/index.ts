// AI Agent utilities for SweatBuddies
// Phase 2: AI-powered features for hosts

export { anthropic, AGENT_MODEL } from './client'
export type { AgentContext } from './client'

export {
  WEEKLY_PULSE_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  CONTENT_SYSTEM_PROMPT,
  RETENTION_SYSTEM_PROMPT,
  SEGMENTATION_SYSTEM_PROMPT,
} from './prompts'

export {
  buildAgentContext,
  formatContextForChat,
  formatContextForPulse,
} from './context'
