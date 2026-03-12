export default function BannedPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 rounded-2xl border border-neutral-800 p-8 text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-2xl font-bold text-neutral-100 mb-2">Account Suspended</h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">
          Your account has been suspended for violating our community guidelines.
          You cannot access SweatBuddies at this time.
        </p>
        <p className="text-sm text-neutral-500">
          If you believe this is a mistake, contact{' '}
          <a
            href="mailto:support@sweatbuddies.sg"
            className="text-white underline underline-offset-2 hover:text-neutral-300 transition-colors"
          >
            support@sweatbuddies.sg
          </a>
        </p>
      </div>
    </div>
  )
}
