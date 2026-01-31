import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext(null)

const Popover = ({ open, onOpenChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen) => {
    if (open === undefined) {
      setIsOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(PopoverContext)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context?.onOpenChange(!context?.open)}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ className, children, align = "center", side = "bottom", ...props }, ref) => {
  const context = React.useContext(PopoverContext)

  if (!context?.open) return null

  const alignStyles = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }

  const sideStyles = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => context?.onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-72 rounded-md border border-gray-200 bg-white p-4 shadow-md outline-none",
          alignStyles[align],
          sideStyles[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
