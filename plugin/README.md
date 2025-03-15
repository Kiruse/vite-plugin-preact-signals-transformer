# Preact Signals Transformer for Vite/Rollup
This Vite/Rollup plugin automatically injects `useSignals()` calls into React components that use Preact signals, as well as the necessary `import` statements.

This is a very rudimentary plugin that does not check if a component even uses signals. It just adds `useSignals()` to every single detected component.

## Installation
Install with your favorite package manager's equivalent of:

```bash
npm install --save-dev @kiruse/vite-plugin-preact-signals-transformer
```

Then, add it to your `vite.config.ts`:

```ts
import injectSignals from '@kiruse/vite-plugin-preact-signals-transformer';
import { react } from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    injectSignals({
      include: /src\/.*\.tsx/,
      exclude: /node_modules\/|\.(stories|spec|test)\./,
    }),
    react(),
  ],
});
```

You will most likely want to order `injectSignals` before every other plugin. The order of plugins can change whether it properly works or spontaneously breaks on some files, especially if other plugins also apply transformations.

## How it works
The plugin:

1. Scans all `.tsx` files in your project (configurable)
2. Identifies React components (top level functions & Higher-Order Components (HOCs) that return JSX)
3. Checks if the component already has a `useSignals()` call
4. If not, it:
   - Adds the import: `import { useSignals } from '@preact/signals-react/runtime'`
   - Injects `useSignals()` at the beginning of the component function body

It does not check if you even use signals.

## Limitations

- The plugin uses static analysis to identify React components, so it may not detect all components in complex scenarios.
- It only works with function components (not class components).
- It assumes that components that return JSX are React components.
- It may occasionally misidentify functions as components. If it does, please open an issue with a minimally reproducable example.

## License
Copyright 2025 Kiruse (https://kiruse.dev)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
