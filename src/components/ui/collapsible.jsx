import * as React from "react"
import { cn } from "@/lib/utils"

const CollapsibleContext = React.createContext(null)

const Collapsible = ({ open, onOpenChange, defaultOpen = false, children, className }) => {
  const [isOpen, setIsOpen] = React.useState(open ?? defaultOpen)

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
    <CollapsibleContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      <div className={className}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

const CollapsibleTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)

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
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const context = React.useContext(CollapsibleContext)

  if (!context?.open) return null

  return (
    <div
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
