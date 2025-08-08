import { z } from "zod/mini"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { auth } from "@/lib/firebase"
import { getErrorMessage } from "@/lib/firebase-errors"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"

type ChangePasswordModalProps = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const schema = z
  .object({
    currentPassword: z
      .string()
      .check(z.minLength(1, "Current password is required")),
    newPassword: z
      .string()
      .check(
        z.minLength(1, "New password is required"),
        z.minLength(8, "New password must be at least 8 characters long"),
        z.regex(
          /[A-Z]/,
          "New password must contain at least one uppercase letter"
        ),
        z.regex(
          /[a-z]/,
          "New password must contain at least one lowercase letter"
        ),
        z.regex(/[0-9]/, "New password must contain at least one number"),
        z.regex(
          /[\W_]/,
          "New password must contain at least one special character"
        )
      ),
    confirmPassword: z
      .string()
      .check(z.minLength(1, "Confirm password is required"))
  })
  .check(
    z.refine((v) => v.newPassword !== v.currentPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"]
    }),
    z.refine((v) => v.newPassword === v.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    })
  )

export function ChangePasswordModal({
  isOpen,
  setIsOpen
}: ChangePasswordModalProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(() => form.reset(), 300)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const user = auth.currentUser
      if (!user?.email) {
        toast.error("No authenticated user found")
        return
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        user.email,
        values.currentPassword
      )
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, values.newPassword)

      // Reset form and close modal
      onOpenChange(false)
      toast.success("Password changed successfully!")
      setTimeout(() => form.reset(), 300)
    } catch (error) {
      toast.error(getErrorMessage(error))
      form.resetField("currentPassword")
      setTimeout(() => form.setFocus("currentPassword"), 10)
    }
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Please enter your current password and the new password you wish to
            set.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={onSubmit}
            className="-mx-6 max-h-[80vh] space-y-4 overflow-y-auto px-6"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      type="password"
                      placeholder="Enter current password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Change Password
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
