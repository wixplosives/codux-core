import { cssVarsPlugin } from '@wixc3/board-plugins';
import { createBoard } from '@wixc3/react-board';
import { CSSVarsUser } from './css-vars-user';

export default createBoard({
    name: 'Checkbox',
    Board: () => {
        return <CSSVarsUser></CSSVarsUser>;
    },
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});
