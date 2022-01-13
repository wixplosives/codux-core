import { CSSVarsUser } from './css-vars-user';
import { createBoard } from '@wixc3/react-simulation';
import React from 'react';
import { cssVarsPlugin } from '@wixc3/simulation-plugins';

export default createBoard({
    name: 'Checkbox',
    board: () => {
        return <CSSVarsUser></CSSVarsUser>;
    },
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});
