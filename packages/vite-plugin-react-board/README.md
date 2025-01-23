# @wixc3/vite-plugin-react-board

This plugin is here to help you render boards for Codux with vite.

## Usage

Add this plugin to `vite.config.ts`

```typescript
// existing imports
import codux from '@wixc3/vite-plugin-react-board';

export default defineConfig({
    plugins: [
        // existing plugins
        codux(),
        // other plugins
    ],
    // other config
});
```

Now a new path `_codux-board-render` is available on the devServer that can render board by path specified in `boardPath` query param.
For example, with port `5173` and board path `_codux/boards/example/example.board.tsx` you can access the board at:

http://localhost:5173/_codux-board-render?boardPath=_codux/boards/example/example.board.tsx

## License

MIT
