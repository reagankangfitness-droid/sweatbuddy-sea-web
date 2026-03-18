import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF8] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-white border border-black/[0.06] shadow-sm rounded-full flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          Wrong turn.
        </h1>
        <p className="text-[#9A9AAA] mb-8">
          This page doesn&apos;t exist. But your crew does.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-[#1A1A1A] text-white rounded-full font-semibold hover:bg-black transition-colors text-center"
          >
            Go back home
          </Link>
          <Link
            href="/communities"
            className="block w-full px-6 py-3 bg-white text-[#1A1A1A] border border-black/[0.08] rounded-full font-medium hover:bg-[#FFFBF8] transition-colors text-center"
          >
            Find them
          </Link>
        </div>
      </div>
    </div>
  )
}
