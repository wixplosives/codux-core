import { ContextUser, textContext } from './context-user';
import { createBoard } from '@wixc3/react-simulation';
import React from 'react';
import { reactContextPlugin } from '@wixc3/simulation-plugins';
export default createBoard({
    name: 'Context user',
    board: () => {
        return <ContextUser></ContextUser>;
    },
    plugins: [
        reactContextPlugin.use({
            context: textContext,
            value: 'context text',
        }),
    ],
});
