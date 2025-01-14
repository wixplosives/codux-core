
import type { IReactBoard } from '@wixc3/react-board';
import React from 'react';
import boardSetup from 'virtual:codux/board-setup';

export default function BoardRenderer() {
    const { boardPath } = getParamsFromSearch(window.location.search);
    const { setupBefore, setupAfter } = boardSetup;
    const LazyBoard = boardPath
        ? React.lazy(async () => {
            if (setupBefore) { await import(/* @vite-ignore */ '/' + setupBefore); }
            const boardExport: { default: IReactBoard } = await import(/* @vite-ignore */ '/' + boardPath);
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
