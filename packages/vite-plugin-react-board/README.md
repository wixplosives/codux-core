# @wixc3/vite-plugin-react-board

This plugin is here to help you render boards for Codux with vite.

## Usage

Add this plugin to `vite.config.js`

```
...
import codux from '@wixc3/vite-plugin-react-board';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [codux(), react(), ... ],
});
```

Now a new path `/_codux-board-render?boardPath=` is availible on the devServer that can render board by path specified in `boardPath` query param.

http://localhost:5173/\_codux-board-render?boardPath=%2Fsrc%2F_codux%2Fboards%2Fget-loan-banner%2Fget-loan-banner.board.tsx

## License

MIT
