// Simple script to test the inject-signals transformer
import injectSignals from './src';

// Sample React component without useSignals
const testComponent = `
import React from 'react';
import { signal } from '@preact/signals-react';

const counter = signal(0);

export const TestComponent = () => {
  const handleClick = useCallback(() => {
    console.log('clicked');
    counter.value++;
  }, []);

  return (
    <div>
      <h1>Counter: {counter.value}</h1>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
};

function foo() {
  return 42;
}

function InternalComponent() {
  return <div>foobar</div>;
}
`;

// Create a mock Vite plugin context
const mockContext = {
  error: console.error,
  warn: console.warn,
};

// Initialize the plugin
const plugin = injectSignals();

// Test the transform function
async function testPlugin() {
  console.log('Original code:\n-----');
  console.log(testComponent.trim());

  // Call the transform function
  const result = await plugin.transform.call(mockContext, testComponent, 'test-component.tsx');
  const lines = result.code.split('\n');

  const hasImport = lines.some(line =>
       line.includes('import { useSignals } from "@preact/signals-react/runtime"')
    || line.includes('import { useSignals } from \'@preact/signals-react/runtime\'')
  );

  const hasHook = (fn) => {
    const idx = lines.findIndex(line => line.includes(`function ${fn}()`) || line.includes(`${fn} =`));
    if (idx === -1) throw new Error(`Function ${fn} not found`);
    return lines[idx + 1].includes('useSignals()');
  }

  const hasNoHook = (fn) => {
    const idx = lines.findIndex(line => line.includes(`function ${fn}()`) || line.includes(`${fn} =`));
    if (idx === -1) throw new Error(`Function ${fn} not found`);
    return !lines[idx + 1].includes('useSignals()');
  }

  console.log('\nTransformed code:\n-----');
  console.log(result.code);

  // Check if useSignals was injected
  if (hasImport && hasHook('TestComponent') && hasHook('InternalComponent') && hasNoHook('handleClick') && hasNoHook('foo')) {
    console.log('\n✅ Plugin successfully injected useSignals!');
  } else {
    console.log('\n❌ Plugin failed to inject useSignals.');
  }
}

testPlugin().catch(console.error);
