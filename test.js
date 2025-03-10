// Simple script to test the inject-signals transformer
import injectSignals from './src';

// Sample React component without useSignals
const testComponent = `
import React from 'react';
import { signal } from '@preact/signals-react';

const counter = signal(0);

export const TestComponent = () => {
  return (
    <div>
      <h1>Counter: {counter.value}</h1>
      <button onClick={() => counter.value++}>Increment</button>
    </div>
  );
};
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
  console.log('Original code:');
  console.log(testComponent);

  // Call the transform function
  const result = await plugin.transform.call(mockContext, testComponent, 'test-component.tsx');

  console.log('\nTransformed code:');
  console.log(result.code);

  // Check if useSignals was injected
  if (result.code.includes('useSignals()') && result.code.includes("import { useSignals } from \"@preact/signals-react/runtime\"")) {
    console.log('\n✅ Plugin successfully injected useSignals!');
  } else {
    console.log('\n❌ Plugin failed to inject useSignals.');
  }
}

testPlugin().catch(console.error);
