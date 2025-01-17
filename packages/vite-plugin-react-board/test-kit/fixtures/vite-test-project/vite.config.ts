import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import coduxPlugin from '@wixc3/vite-plugin-react-board';

// https://vite.dev/config/
export default defineConfig({
    plugins: [coduxPlugin(), react()],
});
