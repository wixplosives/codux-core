import { createBoard } from '@wixc3/react-board';

export default createBoard({
    name: 'Throwing Board',
    Board: () => {
        throw new Error('Intentional Mount Error');
    },
});
