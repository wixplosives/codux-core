import defineRemixApp, { INVALID_MSGS, parentLayoutWarning, pageTemplate } from '@wixc3/define-remix-app';
import { AppDefDriver } from '@wixc3/app-core/test-kit';
import {
    loaderOnly,
    simpleLayout,
    simpleRoot,
    rootWithLayout,
    rootWithLayoutAndErrorBoundary,
    layoutWithErrorBoundary,
} from './test-cases/roots';
import { expect } from 'chai';
import { IAppManifest, RouteInfo, RoutingPattern } from '@wixc3/app-core';
import { ParentLayoutWithExtra, RouteExtraInfo } from '../src/remix-app-utils';
import { waitFor } from 'promise-assist';

const indexPath = '/app/routes/_index.tsx';
const rootPath = '/app/root.tsx';

const rootLayout: ParentLayoutWithExtra = {
    id: 'rootLayout',
    layoutExportName: 'Layout',
    layoutModule: rootPath,
    path: '/',
    exportNames: ['default', 'Layout'],
};
const root: ParentLayoutWithExtra = {
    id: 'root',
    layoutExportName: 'default',
    layoutModule: rootPath,
    path: '/',
    exportNames: ['default', 'Layout'],
};

describe('define-remix', () => {
    describe('flat routes', () => {
        it(`manifest for: _index.tsx`, async () => {
            const { manifest } = await getInitialManifest({
                [indexPath]: simpleLayout,
            });
            expectManifest(manifest, {
                homeRoute: aRoute({ routeId: 'routes/_index', pageModule: indexPath, readableUri: '', path: [] }),
            });
        });
        it('manifest for: about.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });
        it('manifest for: about.tsx without default export', async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: loaderOnly,
            });
            expectManifest(manifest, {
                routes: [],
            });
        });
        it('manifest for: about._index.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });

        it(`manifest for: about.tsx, about._index.tsx`, async () => {
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
                        path: [urlSeg('about')],
                        parentLayouts: [
                            {
                                id: 'routes/about',
                                layoutExportName: 'default',
                                layoutModule: layoutPath,
                                path: '/about',
                                exportNames: ['default'],
                            },
                        ],
                    }),
                ],
            });
        });
        it('sorts routes by abc', async () => {
            const aboutPath = '/app/routes/about.tsx';
            const middlePath = '/app/routes/middle.tsx';
            const aboutUsPath = '/app/routes/about.us.tsx';
            const { manifest } = await getInitialManifest({
                [aboutPath]: simpleLayout,
                [middlePath]: simpleLayout,
                [aboutUsPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about',
                        pageModule: aboutPath,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                    }),
                    aRoute({
                        routeId: 'routes/about/us',
                        pageModule: aboutUsPath,
                        readableUri: 'about/us',
                        path: [urlSeg('about'), urlSeg('us')],
                        parentLayouts: [
                            {
                                id: 'routes/about',
                                layoutExportName: 'default',
                                layoutModule: aboutPath,
                                path: '/about',
                                exportNames: ['default'],
                            },
                        ],
                    }),
                    aRoute({
                        routeId: 'routes/middle',
                        pageModule: middlePath,
                        readableUri: 'middle',
                        path: [urlSeg('middle')],
                    }),
                ],
            });
        });

        describe('nested routes', () => {
            it(`manifest for: about.tsx, about.us.tsx`, async () => {
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
                            path: [urlSeg('about')],
                        }),
                        aRoute({
                            routeId: 'routes/about/us',
                            pageModule: aboutUsPage,
                            readableUri: 'about/us',
                            path: [urlSeg('about'), urlSeg('us')],
                            parentLayouts: [
                                {
                                    id: 'routes/about',
                                    layoutExportName: 'default',
                                    layoutModule: aboutPage,
                                    path: '/about',
                                    exportNames: ['default'],
                                },
                            ],
                        }),
                    ],
                });
            });
            it(`manifest for: about.tsx, about_.us.tsx`, async () => {
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
                            path: [urlSeg('about')],
                        }),
                        aRoute({
                            routeId: 'routes/about_/us',
                            pageModule: aboutUsPage,
                            readableUri: 'about_/us',
                            path: [urlSeg('about'), urlSeg('us')],
                        }),
                    ],
                });
            });
            it(`manifest for: about.tsx, about.us.tsx, about.us_.lang.tsx
            `, async () => {
                const aboutPage = '/app/routes/about.tsx';
                const aboutUsPage = '/app/routes/about.us.tsx';
                const aboutUsLangPage = '/app/routes/about.us_.lang.tsx';

                const { manifest } = await getInitialManifest({
                    [aboutPage]: simpleLayout,
                    [aboutUsPage]: simpleLayout,
                    [aboutUsLangPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                        aRoute({
                            routeId: 'routes/about/us',
                            pageModule: aboutUsPage,
                            readableUri: 'about/us',
                            path: [urlSeg('about'), urlSeg('us')],
                            parentLayouts: [
                                {
                                    id: 'routes/about',
                                    layoutExportName: 'default',
                                    layoutModule: aboutPage,
                                    path: '/about',
                                    exportNames: ['default'],
                                },
                            ],
                        }),
                        aRoute({
                            routeId: 'routes/about/us_/lang',
                            pageModule: aboutUsLangPage,
                            readableUri: 'about/us_/lang',
                            path: [urlSeg('about'), urlSeg('us'), urlSeg('lang')],
                            parentLayouts: [
                                {
                                    id: 'routes/about',
                                    layoutExportName: 'default',
                                    layoutModule: aboutPage,
                                    path: '/about',
                                    exportNames: ['default'],
                                },
                            ],
                        }),
                    ],
                });
            });
            it(`manifest for: product.$productId.tsx`, async () => {
                const productPage = '/app/routes/product.$productId.tsx';

                const { manifest } = await getInitialManifest({
                    [productPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/product/$productId',
                            pageModule: productPage,
                            readableUri: 'product/$productId',
                            path: [urlSeg('product'), { kind: 'dynamic', name: 'productId' }],
                        }),
                    ],
                });
            });
            it(`manifest for: product.($productId).tsx`, async () => {
                const productPage = '/app/routes/product.($productId).tsx';

                const { manifest } = await getInitialManifest({
                    [productPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/product/($productId)',
                            pageModule: productPage,
                            readableUri: 'product/($productId)',
                            path: [urlSeg('product'), { kind: 'dynamic', name: 'productId', isOptional: true }],
                        }),
                    ],
                });
            });
            it(`manifest for: product.$.tsx`, async () => {
                const productPage = '/app/routes/product.$.tsx';

                const { manifest } = await getInitialManifest({
                    [productPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/product/$',
                            pageModule: productPage,
                            readableUri: 'product/$',
                            path: [urlSeg('product'), { kind: 'dynamic', name: '$', isCatchAll: true }],
                        }),
                    ],
                });
            });
            it(`manifest for: _layout.about.tsx`, async () => {
                const aboutPage = '/app/routes/_layout.about.tsx';
                const { manifest } = await getInitialManifest({
                    [aboutPage]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/_layout/about',
                            pageModule: aboutPage,
                            readableUri: '_layout/about',
                            path: [urlSeg('about')],
                        }),
                    ],
                });
            });
            it(`manifest for: _layout.tsx, _layout.about.tsx`, async () => {
                const aboutPage = '/app/routes/_layout.about.tsx';
                const layout = '/app/routes/_layout.tsx';
                const { manifest } = await getInitialManifest({
                    [aboutPage]: simpleLayout,
                    [layout]: simpleLayout,
                });

                expectManifest(manifest, {
                    routes: [
                        aRoute({
                            routeId: 'routes/_layout/about',
                            pageModule: aboutPage,
                            readableUri: '_layout/about',
                            path: [urlSeg('about')],
                            parentLayouts: [
                                {
                                    id: 'routes/_layout',
                                    layoutExportName: 'default',
                                    layoutModule: layout,
                                    path: '/',
                                    exportNames: ['default'],
                                },
                            ],
                        }),
                    ],
                });
            });
        });
    });
    describe('directory routes', () => {
        it('manifest for: about/index.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });
        it('manifest for: about/route.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });
        it('manifest for: about._index/route.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });
        it('manifest for: about._index/route.tsx', async () => {
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
                        path: [urlSeg('about')],
                    }),
                ],
            });
        });
        it('manifest for: about._index/route.tsx, about/route.tsx', async () => {
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
                        path: [urlSeg('about')],
                        parentLayouts: [
                            {
                                id: 'routes/about/route',
                                layoutExportName: 'default',
                                layoutModule: layoutPath,
                                path: '/about',
                                exportNames: ['default'],
                            },
                        ],
                    }),
                ],
            });
        });
        it('sorts routes by abc', async () => {
            const aboutPath = '/app/routes/about/route.tsx';
            const middlePath = '/app/routes/middle/route.tsx';
            const aboutUsPath = '/app/routes/about.us/route.tsx';
            const { manifest } = await getInitialManifest({
                [aboutPath]: simpleLayout,
                [middlePath]: simpleLayout,
                [aboutUsPath]: simpleLayout,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about/route',
                        pageModule: aboutPath,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                    }),
                    aRoute({
                        routeId: 'routes/about/us/route',
                        pageModule: aboutUsPath,
                        readableUri: 'about/us',
                        path: [urlSeg('about'), urlSeg('us')],
                        parentLayouts: [
                            {
                                id: 'routes/about/route',
                                layoutExportName: 'default',
                                layoutModule: aboutPath,
                                path: '/about',
                                exportNames: ['default'],
                            },
                        ],
                    }),
                    aRoute({
                        routeId: 'routes/middle/route',
                        pageModule: middlePath,
                        readableUri: 'middle',
                        path: [urlSeg('middle')],
                    }),
                ],
            });
        });
    });
    describe('error routes', () => {
        const rootLayoutWithError: ParentLayoutWithExtra = {
            ...rootLayout,
            exportNames: ['default', 'Layout', 'ErrorBoundary'],
        };
        const rootWithError: ParentLayoutWithExtra = {
            ...root,
            exportNames: ['default', 'Layout', 'ErrorBoundary'],
        };
        it(`manifest with root error boundry`, async () => {
            const { manifest } = await getInitialManifest({
                [rootPath]: rootWithLayoutAndErrorBoundary,
                [indexPath]: simpleLayout,
            });
            expectManifest(manifest, {
                homeRoute: anyRoute({
                    routeId: 'routes/_index',
                    pageModule: indexPath,
                    readableUri: '',
                    path: [],
                    parentLayouts: [rootLayoutWithError, rootWithError],
                }),
                errorRoutes: [
                    anErrorRoute({
                        routeId: 'error',
                        pageModule: rootPath,
                        readableUri: '',
                        path: [],
                        exportNames: ['default', 'Layout', 'ErrorBoundary'],
                    }),
                ],
            });
        });
        it(`manifest with home page error boundry`, async () => {
            const { manifest } = await getInitialManifest({
                [rootPath]: rootWithLayout,
                [indexPath]: layoutWithErrorBoundary,
            });
            expectManifest(manifest, {
                homeRoute: aRoute({
                    routeId: 'routes/_index',
                    pageModule: indexPath,
                    readableUri: '',
                    path: [],
                    exportNames: ['default', 'ErrorBoundary'],
                }),
                errorRoutes: [
                    anErrorRoute({
                        routeId: 'routes/_index',
                        pageModule: indexPath,
                        readableUri: '',
                        path: [],
                        parentLayouts: [rootLayout, root],
                        exportNames: ['default', 'ErrorBoundary'],
                    }),
                ],
            });
        });

        it(`manifest with page error boundry`, async () => {
            const aboutPage = '/app/routes/about.tsx';
            const { manifest } = await getInitialManifest({
                [rootPath]: rootWithLayout,
                [aboutPage]: layoutWithErrorBoundary,
            });
            expectManifest(manifest, {
                routes: [
                    aRoute({
                        routeId: 'routes/about',
                        pageModule: aboutPage,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                        exportNames: ['default', 'ErrorBoundary'],
                    }),
                ],
                errorRoutes: [
                    anErrorRoute({
                        routeId: 'routes/about',
                        pageModule: aboutPage,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                        parentLayouts: [rootLayout, root],
                        exportNames: ['default', 'ErrorBoundary'],
                    }),
                ],
            });
        });
    });
    describe('manifest updates', () => {
        it(`page addition`, async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest, driver } = await getInitialManifest({
                [indexPath]: simpleLayout,
            });
            expect(manifest.routes.length).to.equal(0);
            driver.addOrUpdateFile(testedPath, simpleLayout.contents, simpleLayout.exports);
            await waitFor(() =>
                expectManifest(driver.getManifest()!, {
                    homeRoute: aRoute({ routeId: 'routes/_index', pageModule: indexPath, readableUri: '', path: [] }),
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: testedPath,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                    ],
                }),
            );
        });
        it(`adding default export to a non layout path`, async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest, driver } = await getInitialManifest({
                [testedPath]: loaderOnly,
            });
            expect(manifest.routes.length).to.equal(0);
            driver.addOrUpdateFile(testedPath, simpleLayout.contents, simpleLayout.exports);
            await waitFor(() =>
                expectManifest(driver.getManifest()!, {
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: testedPath,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                    ],
                }),
            );
        });
        it(`adding layout to root path`, async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest, driver } = await getInitialManifest({
                [testedPath]: simpleLayout,
                [rootPath]: simpleRoot,
            });
            const rootWithOutLayout: ParentLayoutWithExtra = {
                ...root,
                exportNames: ['default'],
            };
            expectManifest(manifest, {
                routes: [
                    anyRoute({
                        routeId: 'routes/about',
                        pageModule: testedPath,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                        parentLayouts: [rootWithOutLayout],
                    }),
                ],
            });

            driver.addOrUpdateFile(rootPath, rootWithLayout.contents, rootWithLayout.exports);
            await waitFor(() =>
                expectManifest(driver.getManifest()!, {
                    routes: [
                        aRoute({
                            routeId: 'routes/about',
                            pageModule: testedPath,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                    ],
                }),
            );
        });
    });

    describe('getNewPageInfo', () => {
        it('should return the correct path for a simple route (file pattern)', async () => {
            const { driver } = await getInitialManifest({
                [indexPath]: simpleLayout,
            });
            const { isValid, pageModule, newPageRoute, newPageSourceCode, routingPattern } =
                driver.getNewPageInfo('about');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql('/app/routes/about.tsx');
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about',
                    pageModule: '/app/routes/about.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(newPageSourceCode).to.include('export default');
            expect(routingPattern).to.eql('file');
        });
        it('should return the correct path for a simple route (dir+route pattern)', async () => {
            const { driver } = await getInitialManifest(
                {
                    [indexPath]: simpleLayout,
                },
                'folder(route)',
            );
            const { isValid, pageModule, newPageRoute, routingPattern } = driver.getNewPageInfo('about');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql('/app/routes/about/route.tsx');
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about/route',
                    pageModule: '/app/routes/about/route.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(routingPattern).to.eql('folder(route)');
        });
        it('should return the correct path for a simple route (dir+index pattern)', async () => {
            const { driver } = await getInitialManifest(
                {
                    [indexPath]: simpleLayout,
                },
                'folder(index)',
            );
            const { isValid, pageModule, newPageRoute, routingPattern } = driver.getNewPageInfo('about');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql('/app/routes/about/index.tsx');
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about/index',
                    pageModule: '/app/routes/about/index.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(routingPattern).to.eql('folder(index)');
        });
        it('should include parent layouts added because of subpaths, and warn', async () => {
            const aboutLayout = '/app/routes/about.tsx';
            const aboutUsPage = '/app/routes/about.us.tsx';
            const { driver } = await getInitialManifest({
                [indexPath]: simpleLayout,
                [aboutLayout]: simpleLayout,
            });
            const { isValid, pageModule, newPageRoute, warningMessage } = driver.getNewPageInfo('about/us');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql(aboutUsPage);
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about/us',
                    pageModule: aboutUsPage,
                    readableUri: 'about/us',
                    path: [urlSeg('about'), urlSeg('us')],
                    parentLayouts: [
                        {
                            id: 'routes/about',
                            layoutExportName: 'default',
                            layoutModule: aboutLayout,
                            path: '/about',
                            exportNames: ['default'],
                        },
                    ],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(warningMessage).to.include(parentLayoutWarning('about', 'about_/us'));
        });
        it('should allow adding an index to a parent layout, and warn', async () => {
            const aboutLayout = '/app/routes/about.tsx';
            const aboutUsPage = '/app/routes/about._index.tsx';
            const { driver } = await getInitialManifest({
                [indexPath]: simpleLayout,
                [aboutLayout]: simpleLayout,
            });
            const { isValid, pageModule, newPageRoute, warningMessage } = driver.getNewPageInfo('about/_index');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql(aboutUsPage);
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about/_index',
                    pageModule: aboutUsPage,
                    readableUri: 'about/_index',
                    path: [urlSeg('about')],
                    parentLayouts: [
                        {
                            id: 'routes/about',
                            layoutExportName: 'default',
                            layoutModule: aboutLayout,
                            path: '/about',
                            exportNames: ['default'],
                        },
                    ],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(warningMessage).to.include(parentLayoutWarning('about', 'about_/_index'));
        });
        describe('normalize generate page injected code', () => {
            it('should normalize the component identifier', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });
                const { newPageSourceCode } = driver.getNewPageInfo('about');

                expect(newPageSourceCode, 'Capital letter').to.include('export default function About() {');
            });
            it('should remove invalid ident chars from the component identifier', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });
                const { newPageSourceCode } = driver.getNewPageInfo('Abou#$t');

                expect(newPageSourceCode, 'Capital letter').to.include('export default function About() {');
            });
            it('should cleanup initial JSX content', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });
                const { newPageSourceCode } = driver.getNewPageInfo('about{}');

                expect(newPageSourceCode, 'curly braces').to.include('return <div>about</div>;');

                // This test also directly targets the template function since
                // angle braces would fail route validation and never reach the
                // template function in normal execution.
                const pageSource = pageTemplate('ab<>{}out', new Set());

                expect(pageSource).to.include('return <div>about</div>;');
            });
        });
        describe('invalid input', () => {
            it('should not allow new page to override home route', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });

                const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                    driver.getNewPageInfo('');

                expect(isValid, 'isValid').to.eql(false);
                expect(errorMessage, 'error message').to.eql(INVALID_MSGS.homeRouteExists('/app/routes/_index.tsx'));
                expect(pageModule, 'page module').to.eql('');
                expect(newPageSourceCode, 'newPageSourceCode').to.eql('');
                expect(newPageRoute, 'newPageRoute').to.eql(undefined);
            });
            it('should not allow empty page name (with no home route)', async () => {
                const { driver, manifest } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });
                delete manifest.homeRoute;

                const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                    driver.getNewPageInfo('');

                expect(isValid, 'isValid').to.eql(false);
                expect(errorMessage, 'error message').to.eql(INVALID_MSGS.emptyName);
                expect(pageModule, 'page module').to.eql('');
                expect(newPageSourceCode, 'newPageSourceCode').to.eql('');
                expect(newPageRoute, 'newPageRoute').to.eql(undefined);
            });
            it('should not allow the page to start without an english first letter', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });

                const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                    driver.getNewPageInfo('1st-page');

                expect(isValid, 'isValid').to.eql(false);
                expect(errorMessage, 'error message').to.eql(INVALID_MSGS.initialPageLetter);
                expect(pageModule, 'page module').to.eql('');
                expect(newPageSourceCode, 'newPageSourceCode').to.eql('');
                expect(newPageRoute, 'newPageRoute').to.eql(undefined);
            });
            it('should limit route param key', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });

                const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                    driver.getNewPageInfo('about/$a+b');

                expect(isValid, 'isValid').to.eql(false);
                expect(errorMessage, 'error message').to.eql(INVALID_MSGS.invalidVar('a+b'));
                expect(pageModule, 'page module').to.eql('');
                expect(newPageSourceCode, 'newPageSourceCode').to.eql('');
                expect(newPageRoute, 'newPageRoute').to.eql(undefined);
            });
            it('should not allow route value that is not valid in fs', async () => {
                const { driver } = await getInitialManifest({
                    [indexPath]: simpleLayout,
                });
                const invalidFsChars = ['\\', ':', '*', '?', '"', "'", '`', '<', '>', '|'];
                for (const invalidChar of invalidFsChars) {
                    const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                        driver.getNewPageInfo('about/$param/invalid-' + invalidChar);

                    expect(isValid, `isValid ${invalidChar}`).to.eql(false);
                    expect(errorMessage, `error message ${invalidChar}`).to.eql(
                        INVALID_MSGS.invalidRouteChar('invalid-' + invalidChar, invalidChar),
                    );
                    expect(pageModule, `page module ${invalidChar}`).to.eql('');
                    expect(newPageSourceCode, `newPageSourceCode ${invalidChar}`).to.eql('');
                    expect(newPageRoute, `newPageRoute ${invalidChar}`).to.eql(undefined);
                }
            });
        });
    });
    describe('getMovePageInfo', () => {
        it('should return the correct path for a simple route (file pattern)', async () => {
            const aboutPage = '/app/routes/about.tsx';
            const { driver } = await getInitialManifest({
                [aboutPage]: simpleLayout,
            });
            const { isValid, pageModule, newPageRoute, routingPattern } = driver.getMovePageInfo(aboutPage, 'about2');
            expect(isValid).to.eql(true);
            expect(pageModule).to.eql('/app/routes/about2.tsx');
            expect(newPageRoute).to.eql(
                aRoute({
                    routeId: 'routes/about2',
                    pageModule: '/app/routes/about2.tsx',
                    readableUri: 'about2',
                    path: [urlSeg('about2')],
                    exportNames: ['meta', 'default'],
                }),
            );
            expect(routingPattern).to.eql('file');
        });
    });
});

const getInitialManifest = async (
    files: Record<string, { contents: string; exports: Set<string> }>,
    routingPattern?: RoutingPattern,
    appPath = './app',
) => {
    const { manifest, app, driver } = await createAppAndDriver(
        {
            [rootPath]: rootWithLayout,
            ...Object.entries(files || {}).reduce(
                (acc, [filePath, contents]) => {
                    acc[filePath] = contents;
                    return acc;
                },
                {} as Record<string, { contents: string; exports: Set<string> }>,
            ),
        },
        appPath,
        routingPattern,
    );

    return { manifest, app, driver };
};
const createAppAndDriver = async (
    initialFiles: Record<string, { contents: string; exports: Set<string> }>,
    appPath: string = './app',
    routingPattern: 'file' | 'folder(route)' | 'folder(index)' = 'file',
) => {
    const app = defineRemixApp({
        appPath,
        routingPattern,
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

const anyRoute = ({
    routeId,
    pageModule,
    pageExportName = 'default',
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
    exportNames = ['default'],
}: {
    routeId: string;
    pageModule: string;
    pageExportName?: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
    exportNames?: string[];
}): RouteInfo<RouteExtraInfo> => {
    return {
        path,
        pathString,
        pageModule,
        pageExportName,
        extraData: {
            parentLayouts,
            routeId,
            exportNames,
        },
        parentLayouts,
    };
};
const aRoute = ({
    routeId,
    pageModule,
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
    includeRootLayout = true,
    exportNames,
}: {
    routeId: string;
    pageModule: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
    includeRootLayout?: boolean;
    exportNames?: string[];
}): RouteInfo<RouteExtraInfo> => {
    const expectedParentLayouts = includeRootLayout ? [rootLayout, root, ...parentLayouts] : [root, ...parentLayouts];
    return anyRoute({
        routeId,
        pageModule,
        readableUri: pathString,
        path,
        parentLayouts: expectedParentLayouts,
        exportNames,
    });
};

const anErrorRoute = ({
    routeId,
    pageModule,
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
    exportNames,
}: {
    routeId: string;
    pageModule: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
    exportNames?: string[];
}) => {
    return anyRoute({
        routeId,
        pageModule,
        readableUri: pathString,
        path,
        parentLayouts,
        pageExportName: 'ErrorBoundary',
        exportNames,
    });
};

const urlSeg = (text: string) => ({
    kind: 'static' as const,
    text,
});
