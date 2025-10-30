import * as React from "react"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<"div">,
  React.HTMLAttributes<HTMLDivElement> & { dynamicThumb?: boolean; // Add prop for dynamic offset
  dynamicThumb?: boolean; // Add prop for dynamic offset
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    disabled?: boolean
  }
>(({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  const rootProps = {
    ...props,
    style: dynamicThumb ? { '--thumb-offset': 'calc(100% - 1rem)' } : undefined,
  };

  if (dynamicThumb) {
    const effectiveWidth = props.className?.includes('w-8') ? 32 : 40; // px, adjust per size
    const thumbSize = 16;
    const offset = effectiveWidth - thumbSize; // px to style
    rootStyle = { '--thumb-offset': `${offset}px` };
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (disabled) return;
      onCheckedChange?.(!checked);
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[var(--thumb-offset)] data-[state=unchecked]:translate-x-0"
        )}
        data-state={checked ? "checked" : "unchecked"}
      />
    </div>
  )
})
Switch.displayName = "Switch"

export { Switch }