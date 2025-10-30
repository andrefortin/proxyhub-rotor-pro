import * as React from "react"
import * as TooltipPrimitives from "@radix-ui/react-tooltip"
import { cn } from "../../lib/utils"

const TooltipProvider = TooltipPrimitives.Provider

const Tooltip = TooltipPrimitives.Root

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitives.Trigger ref={ref} className={cn("cursor-default", className)} {...props} />
))
TooltipTrigger.displayName = TooltipPrimitives.Trigger.displayName

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Content>
>(({ className, sideOffset = 4, side = "top", align = "center", ...props }, ref) => (
  <TooltipPrimitives.Content
    ref={ref}
    sideOffset={sideOffset}
    side={side}
    align={align}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitives.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
