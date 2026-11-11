import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // [DEC-11][CSS-14][CSS-15] text-base no celular evita o zoom automático do iOS; md:text-sm no desktop
        "oa-input min-w-0 text-base file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-(--oa-text) disabled:cursor-not-allowed md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
