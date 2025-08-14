import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "animation-duration-500 shrink-0 animate-spin rounded-full border-2 border-current/20 border-t-current",
  {
    variants: {
      size: {
        default: "size-4",
        md: "size-5",
        lg: "size-6"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof spinnerVariants>) {
  return (
    <span
      data-slot="spinner"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  )
}

export { Spinner }
