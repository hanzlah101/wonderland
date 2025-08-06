import type { Route } from "./+types/home"

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Wonderland" },
    { name: "description", content: "Welcome to Wonderland!" }
  ]
}

export default function Home() {
  return <div />
}
