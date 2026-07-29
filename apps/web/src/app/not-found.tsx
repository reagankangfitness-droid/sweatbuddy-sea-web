import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="sb-page flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A1A] border border-[#333333]  rounded-full flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Wrong turn.
        </h1>
        <p className="mb-8 text-white/68">
          This page doesn&apos;t exist. But your crew does.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="sb-button-primary w-full px-6 py-3 text-center"
          >
            Go back home
          </Link>
          <Link
            href="/communities"
            className="sb-button-secondary w-full px-6 py-3 text-center"
          >
            Find them
          </Link>
        </div>
      </div>
    </div>
  )
}
