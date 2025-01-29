declare module 'virtual:codux/board-setup' {
    const flatBoardSetup: import('../types.ts').FlatBoardSetup;
    export default flatBoardSetup;
}

declare module 'virtual:codux/board' {
    const reactBoard: import('@wixc3/react-board').IReactBoard;

    export default reactBoard;
}
declare module 'virtual:codux/board-setup/before' {}
declare module 'virtual:codux/board-setup/after' {}
