import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      ref={ref}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-blue-600 border-blue-600 text-white",
        className
      )}
      {...props}
    >
      {checked && (
        <Check className="h-3 w-3 mx-auto" strokeWidth={3} />
      )}
    </button>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
