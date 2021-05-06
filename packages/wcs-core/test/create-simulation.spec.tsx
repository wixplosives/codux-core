import React from 'react';
import { createSimulation } from '@wixc3/wcs-core';

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
