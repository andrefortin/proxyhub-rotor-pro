import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:scale-[0.96] data-[swipe=move]:opacity-[0.8] data-[closed]:animate-out data-[open]:animate-in data-[closed]:fade-out-80 data-[closed]:slide-out-to-right-full data-[closed]:sm:slide-out-to-top-[48%] data-[open]:slide-in-from-top-full data-[open]:sm:slide-in-from-right-full md:w-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive/50 bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-500 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastVariant = "default" | "destructive"

interface ToastActionElement extends React.ReactElement<typeof ToastAction> {}

interface ToastActionElementProps
  extends React.ComponentPropsWithoutRef<typeof ToastAction> {
  asChild?: boolean
}

interface ToastProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root>, 'title'>,
    VariantProps<typeof toastVariants> {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}



type ToastData = {
  id?: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  variant?: ToastVariant
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastData & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement | HTMLElement
  variant: "default" | "destructive"
  version?: number
}

type ToastState = ToasterToast[]

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionTypeKeys = typeof actionTypes
type Action =
  | {
      type: ActionTypeKeys["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionTypeKeys["UPDATE_TOAST"]
      toast: Partial<ToastData>
      id?: string
    }
  | {
      type: ActionTypeKeys["DISMISS_TOAST"]
      id?: string
    }
  | {
      type: ActionTypeKeys["REMOVE_TOAST"]
      id?: string
    }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToast(
  toast: ToastState[number],
  {
    appendPosition,
  }: { appendPosition?: boolean } = {}
): ToasterToast {
  const id = genId()
  const isAppended = appendPosition && toast.variant !== "default"

  const toastState = toastTimeouts.get(id)

  if (toastState) {
    clearTimeout(toastState)
    toastTimeouts.delete(id)
  }

  const dismissTimeout = setTimeout(() => {
    dismissToast(id)
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(id, dismissTimeout)

  return {
    id,
    title: toast.title,
    description: toast.description,
    action: toast.action,
    variant: (toast.variant as "default" | "destructive") || "default",
    version: toast.version,
  }
}

function dismissToast(id: string | undefined) {
  if (!id) return
  const timeout = toastTimeouts.get(id)
  if (timeout) {
    clearTimeout(timeout)
    toastTimeouts.delete(id)
  }
}

const reducer = (state: ToastState, action: Action): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return [
        ...state,
        addToast(action.toast, { appendPosition: true })
      ].slice(-TOAST_LIMIT)

    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.id ? { ...t, ...action.toast } : t
      )

    case "DISMISS_TOAST": {
      const { id } = action

      // ! Side effects ! - This could update the state of unrelated
      // toast instances. Easy to miss in onClick.
      if (id) {
        dismissToast(id)
      }

      return state.map((t) =>
        t.id === id || t.id === action.id
          ? {
              ...t,
              open: false
            }
          : { ...t }
      )
    }

    case "REMOVE_TOAST":
      if (action.id) {
        dismissToast(action.id)
      }

      return state.filter((t) => t.id !== action.id)

    default:
      throw new Error("Unknown action")
  }
}

function ToastComponent(props: ToastProps) {
  const { id, title, description, action, variant = "default" } = props

  return (
    <ToastPrimitives.Root
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:scale-[0.96] data-[swipe=move]:opacity-[0.8] data-[closed]:animate-out data-[open]:animate-in data-[closed]:fade-out-80 data-[closed]:slide-out-to-right-full data-[closed]:sm:slide-out-to-top-[48%] data-[open]:slide-in-from-top-full data-[open]:sm:slide-in-from-right-full md:w-full",
        variant === "destructive" && "destructive group border-destructive/50 bg-destructive text-destructive-foreground"
      )}
      id={id}
      open={true}
    >
      <div className="flex w-full items-center justify-between space-x-4">
        {title && <ToastTitle>{title}</ToastTitle>}
        <div className="flex flex-1 flex-col gap-2">
          {description && <ToastDescription>{description}</ToastDescription>}
          {action && <ToastAction className="justify-start !p-0" altText="Toast action">{action}</ToastAction>}
        </div>
      </div>
      <ToastClose />
    </ToastPrimitives.Root>
  )
}

interface ToasterProps {
  variant?: "default" | "destructive"
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

const Toaster: React.FC<React.ComponentPropsWithoutRef<typeof ToastPrimitives.Provider> & ToasterProps> = (props) => {
  const { variant, title, description, action, ...providerProps } = props
  return (
    <ToastProvider
      {...providerProps}
    >
      <ToastViewport />
    </ToastProvider>
  )
}
Toaster.displayName = "Toaster"

let openToastQueue: ToastData[] = []
let toastId = Date.now()

function openToast(toast: ToastData) {
  const id = (toastId++).toString()

  openToastQueue.push({
    ...toast,
    id,
    variant: (toast.variant as "default" | "destructive") || "default"
  })

  // Schedule a microtask to trigger re-render
  queueMicrotask(() => {
    // Force re-render somehow, but since we're using state in app, assume parent updates
  })
}

function toast(props: ToastData) {
  openToast(props)
}

function useToast() {
  return (toastData: ToastData) => toast(toastData)
}

export { toast, useToast, Toaster, ToastProvider, ToastViewport, Toast, ToastComponent, ToastTitle, ToastDescription, ToastClose, ToastAction }