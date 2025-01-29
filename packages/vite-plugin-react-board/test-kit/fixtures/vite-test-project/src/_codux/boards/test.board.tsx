import { createBoard } from '@wixc3/react-board';

console.log('board');
export default createBoard({
    name: 'test',
    Board: () => {
        return <h1>test board</h1>
    },
});
