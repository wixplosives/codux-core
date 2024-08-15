import { createBoard } from '@wixc3/react-board';

export default createBoard({
    name: 'Simple Board',
    Board: () => {
        return <span>Simple Board</span>;
    },
});
