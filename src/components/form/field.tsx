import * as React from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import { cn } from "@/components/ui"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface FormFieldProps extends Omit<React.ComponentProps<"input">, "register"> {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  register?: UseFormRegisterReturn
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, name, type = "text", placeholder, error, register, className, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", className)}>
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          {...(register || {})}
          {...props}
          ref={(e) => {
            // Handle both forwarded ref and react-hook-form register ref
            if (register && register.ref) {
              register.ref(e)
            }
            if (typeof ref === "function") {
              ref(e)
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = e
            }
          }}
          className={cn(error && "border-destructive focus-visible:ring-destructive")}
        />
        {error && (
          <p id={`${name}-error`} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }
