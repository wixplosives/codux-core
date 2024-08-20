import defineRemixApp from '@wixc3/define-remix-app';
import { AppDefDriver } from '@wixc3/app-core/test-kit';
import { simpleLayout, simpleRootWithLayout } from './test-cases/roots';
import { expect } from 'chai';
import { IAppManifest, RouteInfo } from '@wixc3/app-core';
import { RouteExtraInfo } from '../src/remix-app-utils';

describe('define-remix', () => {
    describe('flat routes', () => {
        const indexPath = '/app/routes/_index.tsx';
        it('should return the manifest for a remix app with an home page at _index.tsx', async () => {
            const { manifest } = await getInitialManifest({
                [indexPath]: simpleLayout,
            });
            expectManifest(manifest, {
                homeRoute: aRoute({ routeId: 'routes/_index', pageModule: indexPath, readableUri: '', path: [] }),
            });
        });

        it('should return the manifest for a remix app with a static page at about.tsx', async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about',
                        pageModule: testedPath,
                        readableUri: 'about',
                        path: [{ kind: 'static', text: 'about' }],
                    }),
                ],
            });
        });
        it('should return the manifest for a remix app with a static page at about._index.tsx', async () => {
            const testedPath = '/app/routes/about._index.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/_index',
                        pageModule: testedPath,
                        readableUri: 'about/_index',
                        path: [chunk('about')],
                    }),
                ],
            });
        });

        it('should return  the manifest for a remix app with a static page at about._index.tsx and a layout at about.tsx', async () => {
            const testedPath = '/app/routes/about._index.tsx';
            const layoutPath = '/app/routes/about.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
                [layoutPath]: simpleLayout,
            });

            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/_index',
                        pageModule: testedPath,
                        readableUri: 'about/_index',
                        path: [chunk('about')],
                        parentLayouts: [
                            {
                                id: 'routes/about',
                                layoutExportName: 'default',
                                layoutModule: layoutPath,
                                path: '/about',
                            },
                        ],
                    }),
                ],
            });
        });

        describe('nested routes', () => {
            it('should  return the manifest for a remix app with a page whose also a layout at about.tsx and a page at about.us.tsx', async () => {
                const aboutPage = '/app/routes/about.tsx';
                const aboutUsPage = '/app/routes/about.us.tsx';
                const { manifest } = await getInitialManifest({
                    [aboutPage]: simpleLayout,
                    [aboutUsPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [{ kind: 'static', text: 'about' }],
                        }),
                        aRoute({
                            routeId: 'routes/about/us',
                            pageModule: aboutUsPage,
                            readableUri: 'about/us',
                            path: [chunk('about'), chunk('us')],
                            parentLayouts: [
                                {
                                    id: 'routes/about',
                                    layoutExportName: 'default',
                                    layoutModule: aboutPage,
                                    path: '/about',
                                },
                            ],
                        }),
                    ],
                });
            });
            it('should return the manifest for a remix app with a page whose also a layout at about.tsx and a page at about_.us.tsx avoiding that layout', async () => {
                const aboutPage = '/app/routes/about.tsx';
                const aboutUsPage = '/app/routes/about_.us.tsx';
                const { manifest } = await getInitialManifest({
                    [aboutPage]: simpleLayout,
                    [aboutUsPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [{ kind: 'static', text: 'about' }],
                        }),
                        aRoute({
                            routeId: 'routes/about_/us',
                            pageModule: aboutUsPage,
                            readableUri: 'about_/us',
                            path: [chunk('about'), chunk('us')],
                        }),
                    ],
                });
            });
        });
    });
    describe('directory routes', () => {
        it('should return the manifest for a remix app with a static page at about/index.tsx', async () => {
            const testedPath = '/app/routes/about/index.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/index',
                        pageModule: testedPath,
                        readableUri: 'about',
                        path: [chunk('about')],
                    }),
                ],
            });
        });
        it('should return the manifest for a remix app with a static page at about/route.tsx', async () => {
            const testedPath = '/app/routes/about/route.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/route',
                        pageModule: testedPath,
                        readableUri: 'about',
                        path: [chunk('about')],
                    }),
                ],
            });
        });
        it('should return the manifest for a remix app with a static page at about._index/route.tsx', async () => {
            const testedPath = '/app/routes/about._index/route.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/_index/route',
                        pageModule: testedPath,
                        readableUri: 'about/_index',
                        path: [chunk('about')],
                    }),
                ],
            });
        });
        it('should return the manifest for a remix app with a static page at about._index/route.tsx', async () => {
            const testedPath = '/app/routes/about._index/route.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/_index/route',
                        pageModule: testedPath,
                        readableUri: 'about/_index',
                        path: [chunk('about')],
                    }),
                ],
            });
        });
        it('should return the manifest for a remix app with a static page at about._index/route.tsx and a layout at about/route.tsx', async () => {
            const testedPath = '/app/routes/about._index/route.tsx';
            const layoutPath = '/app/routes/about/route.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
                [layoutPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/_index/route',
                        pageModule: testedPath,
                        readableUri: 'about/_index',
                        path: [chunk('about')],
                        parentLayouts: [
                            {
                                id: 'routes/about/route',
                                layoutExportName: 'default',
                                layoutModule: layoutPath,
                                path: '/about',
                            },
                        ],
                    }),
                ],
            });
        });
    });
});

const rootPath = '/app/root.tsx';
const expectedParentLayouts: RouteExtraInfo['parentLayouts'] = [
    {
        id: 'rootLayout',
        layoutExportName: 'Layout',
        layoutModule: rootPath,
        path: '/',
    },
    {
        id: 'root',
        layoutExportName: 'default',
        layoutModule: rootPath,
        path: '/',
    },
];

const getInitialManifest = async (files: Record<string, { contents: string; exports: Set<string> }>) => {
    const { manifest, app, driver } = await createAppAndDriver({
        [rootPath]: simpleRootWithLayout,

        ...Object.entries(files || {}).reduce(
            (acc, [filePath, contents]) => {
                acc[filePath] = contents;
                return acc;
            },
            {} as Record<string, { contents: string; exports: Set<string> }>,
        ),
    });

    return { manifest, app, driver };
};
const createAppAndDriver = async (
    initialFiles: Record<string, { contents: string; exports: Set<string> }>,
    appPath: string = './app',
) => {
    const app = defineRemixApp({
        appPath,
    });
    const driver = new AppDefDriver<RouteExtraInfo>({
        app,
        initialFiles,
    });
    const manifest = await driver.init();

    return { app, driver, manifest };
};
const expectManifest = (manifest: IAppManifest<RouteExtraInfo>, expected: Partial<IAppManifest<RouteExtraInfo>>) => {
    const fullExpected = {
        errorRoutes: [],
        routes: [],
        ...expected,
    };
    expect(manifest).eql(fullExpected);
};

const aRoute = ({
    routeId,
    pageModule,
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
}: {
    routeId: string;
    pageModule: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
}): RouteInfo<RouteExtraInfo> => ({
    path,
    pathString,
    pageModule,
    pageExportName: 'default',
    extraData: {
        parentLayouts: [...expectedParentLayouts, ...parentLayouts],
        routeId,
    },
    parentLayouts: [...expectedParentLayouts, ...parentLayouts],
});

const chunk = (text: string) => ({
    kind: 'static' as const,
    text,
});
