import defineRemixApp from '../src/define-remix-app';
import { AppDefDriver } from '@wixc3/app-core/test-kit';
describe('define-remix', () => {
    it('should return the manifest for a remix app', async () => {
        const app = defineRemixApp({
            appPath: './app',
        });
        const driver = new AppDefDriver({
            app,
            initialFiles: {
                '/app/app-def.ts': {
                    contents: `
                        import { defineRemixApp } from 'remix';
                        export default defineRemixApp({
                            routes: {
                                '/': () => 'home',
                            },
                        });
                    `,
                    exports: new Set(['default']),
                },
            },
        });
    });
});
