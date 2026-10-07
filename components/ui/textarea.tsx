import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground transition duration-150 ease-out outline-none placeholder:text-texto-terciario focus-visible:border-ring focus-visible:shadow-anel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm", // [DEC-11][CSS-14][CSS-15]
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
