import { ContextUser, textContext } from './context-user';
import { createDemo } from '@wixc3/react-simulation';
import React from 'react';
import { reactContextPlugin } from '@wixc3/simulation-plugins';
export default createDemo({
    name: 'Context user',
    demo: () => {
        return <ContextUser></ContextUser>;
    },
    plugins: [
        reactContextPlugin.use({
            context: textContext,
            value: 'context text',
        }),
    ],
});
