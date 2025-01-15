import { createServer } from 'vite';

export async function createViteServer(projectPath: string) {
    const server = await createServer({
        root: projectPath,
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (!address) {
        throw new Error('Cannot get running server address');
    }
    const port = typeof address === 'string' ? parseInt(address.slice(address.lastIndexOf(':'))) : address.port;

    return {
        server,
        port,
    };
}
