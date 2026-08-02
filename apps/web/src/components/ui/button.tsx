import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-[#17130E] font-mono text-sm font-black uppercase tracking-normal shadow-[2px_2px_0_#17130E] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4BA8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4EFE3] disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: "bg-[#E8412C] text-white hover:bg-[#F0523E] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        outline:
          "bg-[#F8F4EA] text-[#17130E] hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        secondary:
          "bg-[#F8F4EA] text-[#17130E] hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
        ghost: "border-transparent bg-transparent text-[#17130E] shadow-none hover:bg-[#17130E]/6",
        link: "border-transparent bg-transparent text-[#0B4BA8] underline-offset-4 shadow-none hover:underline focus-visible:underline",
        gradient: "bg-[#0B4BA8] text-white hover:bg-[#0D5BC8] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-base font-bold",
        xl: "h-16 px-10 text-lg font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    // Handle loading state
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
