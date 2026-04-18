import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-[#333333] bg-[#1A1A1A] px-4 py-2.5 text-[15px] text-white ring-offset-[#0D0D0D] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-[#666666] focus-visible:outline-none focus-visible:border-[#666666] focus-visible:ring-2 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
