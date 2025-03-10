# Preact Signals Transformer for Vite/Rollup
This Vite/Rollup plugin automatically injects `useSignals()` calls into React components that use Preact signals, as well as the necessary `import` statements.

## How it works
The plugin:

1. Scans all `.tsx` files in your project (configurable)
2. Identifies React components (functions that return JSX)
3. Checks if the component already has a `useSignals()` call
4. If not, it:
   - Adds the import: `import { useSignals } from '@preact/signals-react/runtime'`
   - Injects `useSignals()` at the beginning of the component function body

## Configuration
The plugin accepts the following options:

```ts
injectSignals({
  // RegExp or array of RegExp to include files
  include: /src\/.*\.tsx$/,

  // RegExp or array of RegExp to exclude files
  exclude: /(node_modules|\.test\.|\.stories\.)/
})
```

## Limitations

- The plugin uses static analysis to identify React components, so it may not detect all components in complex scenarios.
- It only works with function components (not class components).
- It assumes that components that return JSX are React components.

## Testing
There exists a rudimentary test that can be executed with [bun](https://bun.sh) or [deno](https://deno.com). It cannot be executed with vanilla Node as it would require transpiling the source to JavaScript, but the aforementioned alternative runtimes can interpret TypeScript directly. Open a shell in the folder containing this readme and execute: `bun ./test-plugin.js`.

## License
Copyright 2025 Kiruse (https://kiruse.dev)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
