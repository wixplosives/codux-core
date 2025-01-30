import { createBoard } from '@wixc3/react-board';

console.log('console-message-from-board');
export default createBoard({
    name: 'test',
    Board: () => {
        return <h1>test board</h1>
    },
});
