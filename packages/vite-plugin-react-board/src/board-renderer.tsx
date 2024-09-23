import type { IReactBoard } from '@wixc3/react-board';
import React from 'react';
import boardSetup from 'virtual:codux/board-setup';

export default function BoardRenderer() {
    const { boardPath } = getParamsFromSearch(window.location.search);
    const { setupBefore, setupAfter } = boardSetup;
    const LazyBoard = boardPath
        ? React.lazy(() => {
              return Promise.resolve()
                  .then(() => (setupBefore ? import(/* @vite-ignore */ '/' + setupBefore) : undefined))
                  .then(() =>
                      import(/* @vite-ignore */ '/' + boardPath).then((boardExport: { default: IReactBoard }) => ({
                          default: boardExport.default.Board,
                      })),
                  )
                  .then((board) =>
                      setupAfter ? import(/* @vite-ignore */ '/' + setupAfter).then(() => board) : board,
                  );
          })
        : () => {
              throw new Error('boardPath is not provided');
          };

    return (
        <div>
            <React.Suspense>
                <LazyBoard />
            </React.Suspense>
        </div>
    );
}

function getParamsFromSearch(locationSearch: string) {
    const search = new URLSearchParams(locationSearch);
    const boardPath = search.get('boardPath');

    return {
        boardPath,
    };
}
