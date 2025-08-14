import {
  index,
  layout,
  type RouteConfig,
  route
} from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  layout("layouts/app-layout.tsx", [
    index("routes/base-audio.tsx"),
    route("create-base-audio", "routes/create-base-audio.tsx")
  ])
] satisfies RouteConfig
