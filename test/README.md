# Signals Transformer: Vite Test Project
This is just a rudimentary test project to ensure the plugin works in the expected context of a Vite-powered React app.

It is built with bun and requires bun to link back to the plugin in the same repo. To reproduce a realistic testing scenario, the two projects are not built as part of an NPM workspace, thus, instead, bun's link feature is used.

- To serve the development build, run `bun dev`.
- To serve the production build, run `bun run build && bun serve`.

Both require that the plugin is built, also with `bun run build`, but in the plugin folder. You can also run `bun dev` in the plugin folder to build with watch mode.
