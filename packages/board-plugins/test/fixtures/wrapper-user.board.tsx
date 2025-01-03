import { reactWrapperPlugin } from '@wixc3/board-plugins';
import { createBoard } from '@wixc3/react-board';

export default createBoard({
    name: 'Wrapper user',
    Board: () => {
        return 'board text';
    },
    plugins: [
        reactWrapperPlugin.use({
            wrapper: ({ children }: React.PropsWithChildren) => <div>wrapper text {children}</div>,
        }),
    ],
});
