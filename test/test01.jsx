// This is merely a test case for the plugin. It serves no real purpose nor is it functional.
import { useSignal } from '@preact/signals-react';

const items = [
  { key: 1, value: 1 },
  { key: 2, value: 2 },
  { key: 3, value: 3 },
];

export default function App() {
  const counter = useSignal();
  return (
    <div>
      {items.map(item => (
        <div key={item.key}>{item.value}</div>
      ))}
      <button onClick={() => counter.value++}>Increment ({counter.value})</button>
    </div>
  );
}
