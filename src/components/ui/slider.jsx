import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef(({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState(value)

  React.useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = [parseFloat(e.target.value)]
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  const percentage = ((internalValue[0] - min) / (max - min)) * 100

  return (
    <div
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-gray-200">
        <div
          className="absolute h-full bg-blue-600"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={internalValue[0]}
        onChange={handleChange}
        disabled={disabled}
        className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      <div
        className="absolute h-4 w-4 rounded-full border border-blue-600 bg-white shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  )
})
Slider.displayName = "Slider"

export { Slider }
