// Netlify Functions v2 entry — delegates every non-static request to the
// nitro server bundle built with NITRO_PRESET=netlify (see netlify.toml).
export { default } from "../../dist/server/main.mjs";

export const config = {
  path: "/*",
  preferStatic: true,
};
