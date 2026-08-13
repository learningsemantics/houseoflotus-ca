import { cn } from "@/components/ui"

interface FormMessageProps {
  message?: string | null
  type: "error" | "success"
}

function FormMessage({ message, type }: FormMessageProps) {
  if (!message) return null

  return (
    <p
      className={cn(
        "text-sm",
        type === "error" ? "text-destructive" : "text-green-600"
      )}
    >
      {message}
    </p>
  )
}

export { FormMessage }
