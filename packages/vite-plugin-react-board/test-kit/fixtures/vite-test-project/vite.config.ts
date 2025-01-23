import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import coduxPlugin from '@wixc3/vite-plugin-react-board';

export default defineConfig({
    plugins: [react(), coduxPlugin()],
});
