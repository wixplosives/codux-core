import React from 'react';
import { createSimulation } from '../src';
import { createMetaData } from '../src/create-meta-data';
import { cssVarsPlugin } from '../src/plugins/css-vars-plugin';
import { tagPlugin } from '../src/plugins/tags-plugin';

/**
 * Type tests
 */

createSimulation({
    name: 'Test1',
    props: { },
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
            tags: ['a', 'b']
        }),
        cssVarsPlugin.use({
            '--color': 'red'
        })
    ]
});

export const a= createMetaData({
    target: x,
    plugins:[
        tagPlugin.use({
            tags: ['a', 'b']
        })
    ]
})