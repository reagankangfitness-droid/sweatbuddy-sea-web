export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-neutral-700 border-t-white rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}
