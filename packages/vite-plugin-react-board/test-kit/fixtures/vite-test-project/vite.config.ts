import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import coduxPlugin from '@wixc3/vite-plugin-react-board';

export default defineConfig({
    plugins: [react(), coduxPlugin()],
    optimizeDeps: {
        // because test project does not have own node modules there is a problem with optimizing this dependency
        // and it need to be manually added. This happens only in test project without node modules.
        // in real project with node_modules optimization works out of the box
        include: ['@wixc3/react-board'],
    },
});
