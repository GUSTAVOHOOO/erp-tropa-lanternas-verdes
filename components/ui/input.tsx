import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // [DEC-11][CSS-14] text-base no celular evita o zoom automático do iOS; md:text-sm no desktop
        "h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground transition-[border-color,box-shadow] duration-150 ease-out outline-none placeholder:text-texto-terciario file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:border-ring focus-visible:shadow-anel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
