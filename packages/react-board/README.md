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

You can also create boards with separation between the actual content and the board environment (context providers, board styling).  
This will be helpful in board templates, to indicate to Codux where to put the component in the generated board.  
Or in boards, so that when the board is converted to a code snippet, only the children of the `<ContentSlot>` will be included in the snippet.   
This is useful when the board is wrapped in a router or a context provider that shouldn't be included in the snippet. 

```tsx
// hello.board.tsx

import { createBoard, ContentSlot } from '@wixc3/react-board';
import { Hello } from './hello';

createBoard({
  name: 'hello board',
  board: () => (
    <SomeWrappingComponent>
      <p>description</p>
      <ContentSlot>
        <Hello name="World" />,
      </ContentSlot>
    <SomeWrappingComponent>
  )
});
```

## License

MIT
