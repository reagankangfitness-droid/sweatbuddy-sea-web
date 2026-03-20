import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-black/[0.06] bg-white px-4 py-2.5 text-[15px] text-[#1A1A1A] ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1A1A1A] placeholder:text-[#71717A] focus-visible:outline-none focus-visible:border-black/[0.12] focus-visible:ring-2 focus-visible:ring-black/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
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
