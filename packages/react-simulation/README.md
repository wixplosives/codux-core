# @wixc3/react-simulation

[![npm version](https://img.shields.io/npm/v/@wixc3/react-simulation.svg)](https://www.npmjs.com/package/@wixc3/react-simulation)

Library for creation of React component simulations.

## Usage

Given:

```tsx
// hello.tsx

import React from 'react';

export interface HelloProps {
  name: string;
}
export const Hello: React.VFC<HelloProps> = ({ name }) => <div>Hello ${name}</div>;
```

This library can be used to create simulations for `Hello`:

```tsx
// hello.sim.tsx

import { createSimulation } from '@wixc3/react-simulation';
import { Hello } from './hello';

createSimulation({
  name: 'basic simulation',
  componentType: Hello,
  props: { name: 'World' },
});
```

## License

MIT
