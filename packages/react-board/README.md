# @wixc3/react-board

[![npm version](https://img.shields.io/npm/v/@wixc3/react-board.svg)](https://www.npmjs.com/package/@wixc3/react-board)

This library is here to help you create React component boards for Codux.

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

This library can be used to create boards for `Hello`:

```tsx
// hello.board.tsx

import { createBoard } from '@wixc3/react-board';
import { Hello } from './hello';

createBoard({
  name: 'basic board',
  board: () => <Hello name="World" />,
});
```

## License

MIT
