import { redirect } from 'next/navigation'

// Role selection screen removed — users go straight to the feed.
// Onboarding happens via join gate when they try to join a session.
export default function OnboardingPage() {
  redirect('/buddy')
}
