import defineRemixApp, { INVALID_MSGS, parentLayoutWarning, pageTemplate } from '@wixc3/define-remix-app';
import { AppDefDriver } from '@wixc3/app-core/test-kit';
import {
    loaderOnly,
    simpleLayout,
    simpleRoot,
    rootWithLayout,
    rootWithLayoutAndErrorBoundary,
    layoutWithErrorBoundary,
    namedPage,
    rootWithLayout2,
    loaderPage,
    deferedLoaderPage,
    actionPage,
    rootWithBreadCrumbs,
    simpleLayoutWithHandle,
    deferedActionPage,
    clientLoaderPage,
    loaderAndClientLoaderPage,
    clientLoaderWithFallbackPage,
    clientActionPage,
    pageWithLinks,
} from './test-cases/roots';
import chai, { expect } from 'chai';
import { IAppManifest, RouteInfo, RoutingPattern } from '@wixc3/app-core';
import { ParentLayoutWithExtra, RouteExtraInfo } from '../src/remix-app-utils';
import { waitFor } from 'promise-assist';
import { IDirectoryContents } from '@file-services/types';
import * as React from 'react';
import * as remixRunReact from '@remix-run/react';
import * as remixRunNode from '@remix-run/node';
import * as remixRunServerRuntime from '@remix-run/server-runtime';

import { chaiRetryPlugin } from '@wixc3/testing';
chai.use(chaiRetryPlugin);
const indexPath = '/app/routes/_index.tsx';
const rootPath = '/app/root.tsx';
const aboutPath = '/app/routes/about.tsx';

const rootLayout: ParentLayoutWithExtra = {
    id: 'rootLayout',
    layoutExportName: 'Layout',
    layoutModule: rootPath,
    path: '/',
    exportNames: ['Layout', 'default'],
};
const root: ParentLayoutWithExtra = {
    id: 'root',
    layoutExportName: 'default',
    layoutModule: rootPath,
    path: '/',
    exportNames: ['Layout', 'default'],
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
            exportNames: ['Layout', 'ErrorBoundary', 'default'],
        };
        const rootWithError: ParentLayoutWithExtra = {
            ...root,
            exportNames: ['Layout', 'ErrorBoundary', 'default'],
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
                        exportNames: ['Layout', 'ErrorBoundary', 'default'],
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
                    exportNames: ['ErrorBoundary', 'default'],
                }),
                errorRoutes: [
                    anErrorRoute({
                        routeId: 'routes/_index',
                        pageModule: indexPath,
                        readableUri: '',
                        path: [],
                        parentLayouts: [rootLayout, root],
                        exportNames: ['ErrorBoundary', 'default'],
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
                        exportNames: ['ErrorBoundary', 'default'],
                    }),
                ],
                errorRoutes: [
                    anErrorRoute({
                        routeId: 'routes/about',
                        pageModule: aboutPage,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                        parentLayouts: [rootLayout, root],
                        exportNames: ['ErrorBoundary', 'default'],
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
            driver.addOrUpdateFile(testedPath, simpleLayout);
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
            driver.addOrUpdateFile(testedPath, simpleLayout);
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

            driver.addOrUpdateFile(rootPath, rootWithLayout);
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

                expect(newPageSourceCode).to.include('export default function About() {');
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
    describe('render', () => {
        it('should output page according to route to dom', async () => {
            const { driver } = await getInitialManifest({
                [rootPath]: rootWithLayout2,
                [indexPath]: namedPage('Home'),
                [aboutPath]: namedPage('About'),
            });

            const { dispose, container, rerender } = await driver.render({ uri: '/' });

            await expect(() => container.textContent)
                .retry()
                .to.include('Layout|App|Home|');

            await rerender({ uri: 'about' });

            await expect(() => container.textContent)
                .retry()
                .to.include('Layout|App|About|');

            dispose();
        });
        describe('nested routes', () => {
            it('should render parent routes where needed', async () => {
                const aboutPage = '/app/routes/about.tsx';
                const aboutUsPage = '/app/routes/about.us.tsx';
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: namedPage('Home'),
                    [aboutPage]: namedPage('About'),
                    [aboutUsPage]: namedPage('AboutUs'),
                });

                const { dispose, container } = await driver.render({ uri: 'about/us' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|About|AboutUs');

                dispose();
            });
        });
        describe('error routes', () => {
            it('should render error route when error occurs', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: namedPage('Home'),
                });

                const { dispose, container } = await driver.render({ uri: '404' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Error');

                dispose();
            });
            it('should show internal error page if it exists', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: namedPage('Home', {
                        includeErrorBoundry: true,
                        throwErrorInPage: true,
                    }),
                });

                const { dispose, container } = await driver.render({ uri: '404' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Error');

                dispose();
            });
        });
        describe('loader', () => {
            it('should call loader and pass the information into useLoaderData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: loaderPage('Home', 'Home loaded data'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home:Home loaded data');

                dispose();
            });
            it('should accept delayed response from loader', async () => {
                const aboutPage = '/app/routes/about.tsx';
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [aboutPage]: deferedLoaderPage('About', 'About loaded data', 'loaded extra'),
                });

                const { dispose, container } = await driver.render({ uri: 'about' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|About:About loaded data-loaded extra');

                dispose();
            });
        });
        describe('clientLoader', () => {
            it('should call clientLoader and pass the information into useLoaderData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: clientLoaderPage('Home', 'Home loaded data'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home:Home loaded data');

                dispose();
            });
            it('should call clientLoader allowing it to call server loader (if hydrate is set to true)', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: loaderAndClientLoaderPage('Home', 'Home loaded data', 'client loaded data'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home:Home loaded data!client loaded data');

                dispose();
            });
            it.skip('should show Hydrate fallback while calling clientLoader ( if such exists )', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: clientLoaderWithFallbackPage('Home', 'Home loaded data'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Loading Data...');

                window.dispatchEvent(new Event('load-data'));

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home: Home loaded data');
                dispose();
            });
        });
        describe('actions', () => {
            it('should call action and pass the information into useActionData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    '/app/routes/contact.$nickname.tsx': actionPage('Contact'),
                });

                const { dispose, container } = await driver.render({ uri: 'contact/yossi' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Contact|User does not exist');

                const nameField = container.querySelector('input[name=fullName]') as HTMLInputElement;
                const emailField = container.querySelector('input[name=email]') as HTMLInputElement;
                const submitButton = container.querySelector('button[type=submit]') as HTMLButtonElement;
                nameField.value = 'John Doe';
                emailField.value = 'jhon@doe.com';
                submitButton.click();
                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Contact|User exist');
                await expect(() => container.textContent)
                    .retry()
                    .to.include('User created');
                dispose();
            });

            it('should accept delayed response from action', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: deferedActionPage('Home', 'Home action data', 'action extra'),
                });

                const { dispose, container } = await driver.render({ uri: '' });
                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home');

                const submitButton = container.querySelector('button[type=submit]') as HTMLButtonElement;
                submitButton.click();
                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home:Home action data!action extra');

                dispose();
            });

            it('should support client actions', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: clientActionPage('Home'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home');

                const nameField = container.querySelector('input[name=fullName]') as HTMLInputElement;
                const emailField = container.querySelector('input[name=email]') as HTMLInputElement;
                const submitButton = container.querySelector('button[type=submit]') as HTMLButtonElement;
                nameField.value = 'John Doe';
                emailField.value = 'jhon@doe.com';
                submitButton.click();
                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home|User created!client action data');

                dispose();
            });

        });
        describe('handle', () => {
            it('exported handled should be available using useMatches', async () => {
                const aboutUsPath = '/app/routes/about.us.tsx';

                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithBreadCrumbs,
                    [aboutPath]: simpleLayoutWithHandle('About'),
                    [aboutUsPath]: simpleLayoutWithHandle('AboutUs'),
                });

                const { dispose, container } = await driver.render({ uri: 'about/us' });

                await expect(() => container.textContent, 'page is rendered')
                    .retry()
                    .to.include('Layout|App|About|AboutUs');
                await expect(() => container.textContent, 'Bread crumbs are there')
                    .retry()
                    .to.include('Breadcrumbs:Home!About!AboutUs!');
                dispose();
            });
        });

        describe('links function', ()=>{
            it('should render links returned by the links function', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: pageWithLinks,
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home');

                const link = container.querySelector('link')
                expect(link?.getAttribute('href'))
                    .to.include('some.css');
              
                dispose();
            });
        })
    });
});

const getInitialManifest = async (files: IDirectoryContents, routingPattern?: RoutingPattern, appPath = './app') => {
    const { manifest, app, driver } = await createAppAndDriver(
        {
            [rootPath]: rootWithLayout,
            'package.json': JSON.stringify({}),
            ...files,
        },
        appPath,
        routingPattern,
    );

    return { manifest, app, driver };
};
const createAppAndDriver = async (
    initialFiles: IDirectoryContents,
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
        evaluatedNodeModules: {
            react: React,
            '@remix-run/react': remixRunReact,
            '@remix-run/node': remixRunNode,
            '@remix-run/server-runtime': remixRunServerRuntime,
        },
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
