import React from 'react';
import { ContextUser, textContext } from './context-user';
import { createBoard } from '@wixc3/react-board';
import { reactContextPlugin } from '@wixc3/board-plugins';

export default createBoard({
    name: 'Context user',
    Board: () => {
        return <ContextUser></ContextUser>;
    },
    plugins: [
        reactContextPlugin.use({
            context: textContext,
            value: 'context text',
        }),
    ],
});
