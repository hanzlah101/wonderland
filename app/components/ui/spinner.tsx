import { cn } from "@/lib/utils"
import { LoaderIcon, type LucideProps } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

const spinnerVariants = cva("shrink-0 animate-spin", {
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
})

function Spinner({
  className,
  size,
  ...props
}: LucideProps & VariantProps<typeof spinnerVariants>) {
  return (
    <LoaderIcon
      data-slot="spinner"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  )
}

export { Spinner }
