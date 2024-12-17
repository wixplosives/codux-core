import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { createMetadata } from '@wixc3/board-core';
import { cssVarsPlugin } from '@wixc3/board-plugins';
import { createDisposables } from '@wixc3/create-disposables';
import { createBoard } from '@wixc3/react-board';
import React from 'react';
import board from './fixtures/simple.board.js';

chai.use(chaiAsPromised);

// Type tests

createBoard({
    name: 'Test1',
    Board: () => null,
});

const x: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;

createBoard({
    name: 'Test1',
    Board: x,
});

createBoard({
    name: 'Test2',
    Board: x,
    plugins: [
        cssVarsPlugin.use({
            '--color': 'red',
        }),
    ],
});

export const a = createMetadata({
    plugins: [],
});

describe('create board', () => {
    const disposables = createDisposables();
    afterEach(disposables.dispose);

    it(`doesn't fail when rendering the board twice without cleanup`, async () => {
        const { canvas, cleanup } = board.setupStage();
        disposables.add(cleanup);
        const cleanupRender = await board.render(canvas);
        disposables.add(cleanupRender);

        // await board.render(canvas);
        await expect(board.render(canvas)).not.to.be.rejected;
    });
});
