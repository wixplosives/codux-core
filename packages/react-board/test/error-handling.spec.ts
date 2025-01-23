import { createDisposables } from '@wixc3/create-disposables';
import throwingOnMountBoard from './fixtures/throwing.board';
import throwingOnRerenderBoard from './fixtures/throwing-on-click.board';
import chaiAsPromised from 'chai-as-promised';
import chai, { expect } from 'chai';

chai.use(chaiAsPromised);

describe('Board.render() error handling', () => {
    // We want to prevent the default behavior of the error event, which makes the tests fail.
    const dismissEvent = (event: Event) => event.preventDefault();

    // Mocha has its own error handler that traps unhandled exceptions.
    // We want to disable it for this test suite in order to test the error handling of create board.
    let globalMochaErrorHandler: OnErrorEventHandler = null;
    before(() => {
        globalThis.addEventListener('error', dismissEvent);
        globalMochaErrorHandler = window.onerror;
        window.onerror = null;
    });
    after(() => {
        globalThis.removeEventListener('error', dismissEvent);
        window.onerror = globalMochaErrorHandler;
        globalMochaErrorHandler = null;
    });

    const disposables = createDisposables();
    afterEach(disposables.dispose);

    it(`rejects if the rendered component throws an error on mount`, async () => {
        const { canvas, cleanup } = throwingOnMountBoard.setupStage();
        disposables.add(cleanup);
        await expect(throwingOnMountBoard.render(canvas)).to.be.rejectedWith('Intentional Mount Error');
    });

    it(`rejects if the rendered component throws an error on rerender`, async () => {
        const { canvas, cleanup } = throwingOnRerenderBoard.setupStage();
        disposables.add(cleanup);
        const cleanupRender = await throwingOnRerenderBoard.render(canvas);
        disposables.add(cleanupRender);
        await expect(throwingOnRerenderBoard.render(canvas)).to.be.rejectedWith('Intentional Error on re-render');
    });
});
