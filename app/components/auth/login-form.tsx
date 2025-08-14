import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { signInWithEmailAndPassword } from "firebase/auth"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod/mini"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { auth } from "@/lib/firebase"
import { getErrorMessage } from "@/lib/firebase-errors"

const formSchema = z.object({
  email: z
    .string()
    .check(
      z.minLength(1, "Email is required"),
      z.email("Invalid email address")
    ),
  password: z.string().check(z.minLength(1, "Password is required"))
})

export function LoginForm() {
  const queryClient = useQueryClient()
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      )

      queryClient.setQueryData(["session"], user)
      form.reset()
      toast.success("Successfully logged in!")
    } catch (error) {
      toast.error(getErrorMessage(error))
      form.resetField("password")
      setTimeout(() => form.setFocus("password"), 10)
    }
  })

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  type="email"
                  disabled={isSubmitting}
                  placeholder="Enter your email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Login
        </Button>
      </form>
    </Form>
  )
}
