import { ContextUser, textContext } from './context-user';
import { createStory } from '@wixc3/react-simulation';
import React from 'react';
import { reactContextPlugin } from '@wixc3/simulation-plugins';
export default createStory({
    name: 'Context user',
    story: () => {
        return <ContextUser></ContextUser>;
    },
    plugins: [
        reactContextPlugin.use({
            context: textContext,
            value: 'context text',
        }),
    ],
});
