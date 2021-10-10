import { CSSVarsUser } from './css-vars-user';
import { createStory } from '@wixc3/react-simulation';
import React from 'react';
import { cssVarsPlugin } from '@wixc3/simulation-plugins';
export default createStory({
    name: 'Checkbox',
    story: () => {
        return <CSSVarsUser></CSSVarsUser>;
    },
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});
