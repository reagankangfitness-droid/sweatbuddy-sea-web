export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#333333] border-t-white rounded-full animate-spin" />
        <p className="text-[#666666] text-sm">Loading...</p>
      </div>
    </div>
  )
}
