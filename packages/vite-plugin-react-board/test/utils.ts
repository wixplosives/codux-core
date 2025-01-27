import type { ViteDevServer } from 'vite';
import { createViteServer } from '../test-kit/index.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Sets up a Vite server for a given fixture, once per test suite.
 *
 * @returns A function that returns the port number the server is running on.
 */
export const setupViteServerForFixture = (fixture: string): (() => number | undefined) => {
    let server: ViteDevServer;
    let port: number;

    before(async function () {
        const projectPath = path.join(
            path.dirname(fileURLToPath(import.meta.resolve('@wixc3/vite-plugin-react-board/package.json'))),
            `test-kit/fixtures/${fixture}`,
        );
        const { server: viteServer, port: vitePort } = await createViteServer(projectPath);

        server = viteServer;
        port = vitePort;
    });

    after(async function () {
        if (server) {
            await server.waitForRequestsIdle();

            await server.close();
        }
    });

    return () => port;
};
