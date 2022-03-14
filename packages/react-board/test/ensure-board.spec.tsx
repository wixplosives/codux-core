import React from 'react';
import { ensureBoardFormat } from '@wixc3/react-board/ensure-board-format';
import { expect } from 'chai';

describe('Ensure board', () => {
    it('ensures an instance is a board', () => {
        expect(
            ensureBoardFormat({
                name: 'some name',
                Board: () => <div />,
            })
        ).to.eq(true);
    });

    it('ensures an instance is a record', () => {
        expect(() => ensureBoardFormat([])).to.throw('provided value is not an object');
    });
    it('ensures an instance has a name key', () => {
        expect(() => ensureBoardFormat({})).to.throw('provided value is missing a name property');
    });
    it('ensures an instance has a Board key', () => {
        expect(() => ensureBoardFormat({ name: 'aaa' })).to.throw('provided value is missing a Board property');
    });
    it('ensures the Board key is a method', () => {
        expect(ensureBoardFormat({ name: 'aaa', Board: 'value' })).to.eq(false);
    });
});
