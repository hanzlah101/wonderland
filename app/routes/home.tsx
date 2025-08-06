import type { Route } from "./+types/home"

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Wonderland" },
    { name: "description", content: "Welcome to Wonderland!" }
  ]
}

export default function Home() {
  return <div></div>
}
