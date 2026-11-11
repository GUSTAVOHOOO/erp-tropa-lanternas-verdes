import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "oa-input oa-textarea flex field-sizing-content min-w-0 py-2 text-base disabled:cursor-not-allowed md:text-sm", // [DEC-11][CSS-14][CSS-15]
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
