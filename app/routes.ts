
import {
    type RouteConfig,
    index,
    route,
  } from "@react-router/dev/routes";
  
  export default [
    index("routes/home.tsx"),
    route("welcome", "routes/welcome.tsx"),
    route("chat", "routes/chat.tsx"), // Add this line
  ] satisfies RouteConfig;