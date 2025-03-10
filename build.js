import { $ } from 'bun';

// no idea why but for some reason I'm getting errors that `traverse` is not a function when actually
// adding the plugin to the target project. so screw it, let's just bundle the entire damn thing...
Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  format: "esm",
  sourcemap: "external",
  minify: true,
});

await $`bunx tsc --emitDeclarationOnly --declaration --declarationDir dist`;
