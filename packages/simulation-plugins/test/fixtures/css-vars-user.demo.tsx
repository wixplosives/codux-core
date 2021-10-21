import { CSSVarsUser } from './css-vars-user';
import { createDemo } from '@wixc3/react-simulation';
import React from 'react';
import { cssVarsPlugin } from '@wixc3/simulation-plugins';

export default createDemo({
    name: 'Checkbox',
    demo: () => {
        return <CSSVarsUser></CSSVarsUser>;
    },
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});
