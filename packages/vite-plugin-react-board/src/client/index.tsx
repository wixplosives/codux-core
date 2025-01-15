import ReactDOM from 'react-dom/client';
import React from 'react';
import type { IReactBoard } from '@wixc3/react-board';
import boardSetup from 'virtual:codux/board-setup';

export function BoardRenderer() {
    const { boardPath } = getParamsFromSearch(window.location.search);
    const { setupBefore, setupAfter } = boardSetup;
    const LazyBoard = boardPath
        ? React.lazy(async () => {
            // if (setupBefore) { await import(/* @vite-ignore */ '/' + setupBefore); }
            // const boardExport = await import('/src/_codux/boards/test.board.tsx') as { default: IReactBoard };
            // if (setupAfter) { await import(/* @vite-ignore */ '/' + setupAfter); }
            if (setupBefore) { await import(/* @vite-ignore */ '/' + setupBefore); }
            const boardExport = await import(/* @vite-ignore */ '/' + boardPath) as { default: IReactBoard };
            if (setupAfter) { await import(/* @vite-ignore */ '/' + setupAfter); }

            return {
                default: boardExport.default.Board
            };
        })
        : () => <p>boardPath is not provided</p>


    return (

        <React.Suspense>
            <LazyBoard />
        </React.Suspense>
    );
}

function getParamsFromSearch(locationSearch: string) {
    const search = new URLSearchParams(locationSearch);
    const boardPath = search.get('boardPath');

    return {
        boardPath,
    };
}


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <BoardRenderer />
    </React.StrictMode>,
);
