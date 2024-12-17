import { reactContextPlugin } from '@wixc3/board-plugins';
import { createBoard } from '@wixc3/react-board';
import { ContextUser, textContext } from './context-user.js';

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
