import { createSimulation } from '../src';
import React from 'react';

/**
 * Type tests
 */

createSimulation({
    name: 'Test1',
    props: { name: '' },
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
