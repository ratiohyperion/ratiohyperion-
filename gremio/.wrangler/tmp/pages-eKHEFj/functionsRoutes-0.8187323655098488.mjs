import { onRequestGet as __api_catalogo_js_onRequestGet } from "/home/claude/ratiohyperion/ratiohyperion-/gremio/functions/api/catalogo.js"

export const routes = [
    {
      routePath: "/api/catalogo",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_catalogo_js_onRequestGet],
    },
  ]