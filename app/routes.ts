import {
  type RouteConfig,
  index,
  layout,
  route
} from "@react-router/dev/routes"

export default [
  route("login", "routes/login.tsx"),
  layout("layouts/app-layout.tsx", [
    index("routes/home.tsx"),
    route("create-playlist", "routes/create-playlist.tsx")
  ])
] satisfies RouteConfig
