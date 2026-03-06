import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-[15px] text-neutral-100 ring-offset-neutral-950 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:border-neutral-500 focus-visible:ring-2 focus-visible:ring-white/10 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150",
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
