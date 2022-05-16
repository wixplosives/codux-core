import React from 'react';
import { createBoard } from '@wixc3/react-board';
import { createMetadata } from '@wixc3/board-core';
import { cssVarsPlugin } from '@wixc3/board-plugins';

// Type tests

createBoard({
    name: 'Test1',
    Board: () => null,
});

const x: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

createBoard({
    name: 'Test1',
    Board: x,
});

createBoard({
    name: 'Test2',
    Board: x,
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});

export const a = createMetadata({
    plugins: [],
});
