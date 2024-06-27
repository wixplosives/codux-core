import React from 'react';
import { CSSVarsUser } from './css-vars-user';
import { createBoard } from '@wixc3/react-board';
import { cssVarsPlugin } from '@wixc3/board-plugins';

export default createBoard({
    name: 'Checkbox',
    Board: () => {
        return <CSSVarsUser></CSSVarsUser>;
    },
    plugins: [
        cssVarsPlugin({
            '--color': 'red',
        }),
    ],
});
