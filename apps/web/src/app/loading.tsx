export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF8]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-black/[0.06] border-t-[#1A1A1A] rounded-full animate-spin" />
        <p className="text-[#71717A] text-sm">Loading...</p>
      </div>
    </div>
  )
}
