import React from 'react';
import { createSimulation } from '@wixc3/react-simulation';
import { tagPlugin, cssVarsPlugin, createMetadata } from '@wixc3/simulation-core';

/**
 * Type tests
 */

createSimulation({
    name: 'Test1',
    props: {},
    componentType: () => null,
});

const x: React.FC<{ name: string }> = ({ name, children }) => (
    <>
        {name}
        {children}
    </>
);

createSimulation({
    name: 'Test1',
    props: { name: 'string', children: [] },
    componentType: x,
});

createSimulation({
    name: 'Test2',
    props: { name: 'string', children: [] },
    componentType: x,
    plugins: [
        tagPlugin.use({
            tags: ['a', 'b'],
        }),
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});

export const a = createMetadata({
    target: x,
    plugins: [
        tagPlugin.use({
            tags: ['a', 'b'],
        }),
    ],
});
