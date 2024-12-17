import * as chai from 'chai';
import { expect } from 'chai';

import { IDirectoryContents } from '@file-services/types';
import * as remixRunNode from '@remix-run/node';
import * as remixRunReact from '@remix-run/react';
import * as remixRunServerRuntime from '@remix-run/server-runtime';
import { IAppManifest, RouteInfo, RoutingPattern } from '@wixc3/app-core';
import { AppDefDriver } from '@wixc3/app-core/test-kit';
import defineRemixApp, { INVALID_MSGS, pageTemplate, parentLayoutWarning } from '@wixc3/define-remix-app';
import { waitFor } from 'promise-assist';
import * as React from 'react';
import { ParentLayoutWithExtra, RouteExtraInfo, RouteModuleInfo } from '../src/remix-app-utils.js';
import {
    actionPage,
    clientActionPage,
    clientLoaderWithFallbackPage,
    coduxActionPage,
    deferedActionPage,
    layoutWithErrorBoundary,
    loaderOnly,
    rootWithLayout,
    rootWithLayout2,
    rootWithLayoutAndErrorBoundary,
    simpleLayout,
    simpleRoot,
    userApiConsumer,
    userApiPage,
} from './test-cases/roots.js';
import {
    expectLoaderData,
    expectRootLayout,
    expectRoute,
    rootSource as originRootSource,
    pageSource,
    preserveStringAsCode,
} from './test-cases/route-builder.js';

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
const rootModuleInfo = (
    children: RouteModuleInfo[] = [],
    overrides: Partial<RouteModuleInfo> = {},
): RouteModuleInfo => ({
    children,
    exportNames: ['Layout', 'default'],
    file: rootPath,
    id: 'root',
    path: '/',
    ...overrides,
});
const moduleInfo = ({ id, path, file, exportNames, children }: Partial<RouteModuleInfo>): RouteModuleInfo => ({
    children: children || [],
    exportNames: exportNames || ['default'],
    file: file!,
    id: id!,
    path: path!,
});

const rootSource = (options: Parameters<typeof originRootSource>[0]) =>
    originRootSource({ layoutMock: true, ...options });

describe('define-remix', () => {
    describe('flat routes', () => {
        it(`manifest for: _index.tsx`, async () => {
            const { manifest } = await getInitialManifest({
                [indexPath]: simpleLayout,
            });
            expectManifest(manifest, {
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/_index', path: '/', file: indexPath })]),
                homeRoute: aRoute({ pageModule: indexPath, readableUri: '', path: [] }),
            });
        });
        it('manifest for: about.tsx', async () => {
            const testedPath = '/app/routes/about.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/about', path: '/about', file: testedPath })]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({ id: 'routes/about', path: '/about', file: testedPath, exportNames: ['loader'] }),
                ]),
                routes: [],
            });
        });
        it('manifest for: about._index.tsx', async () => {
            const testedPath = '/app/routes/about._index.tsx';
            const { manifest } = await getInitialManifest({
                [testedPath]: simpleLayout,
            });
            expectManifest(manifest, {
                extraData: rootModuleInfo([
                    moduleInfo({ id: 'routes/about/_index', path: '/about', file: testedPath }),
                ]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/about',
                        path: '/about',
                        file: layoutPath,
                        children: [moduleInfo({ id: 'routes/about/_index', path: '/about', file: testedPath })],
                    }),
                ]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/about',
                        path: '/about',
                        file: aboutPath,
                        children: [moduleInfo({ id: 'routes/about/us', path: '/about/us', file: aboutUsPath })],
                    }),
                    moduleInfo({ id: 'routes/middle', path: '/middle', file: middlePath }),
                ]),
                routes: [
                    aRoute({
                        pageModule: aboutPath,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                    }),
                    aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/about',
                            path: '/about',
                            file: aboutPage,
                            children: [moduleInfo({ id: 'routes/about/us', path: '/about/us', file: aboutUsPage })],
                        }),
                    ]),
                    routes: [
                        aRoute({
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/about',
                            path: '/about',
                            file: aboutPage,
                        }),
                        moduleInfo({
                            id: 'routes/about_/us',
                            path: '/about/us',
                            file: aboutUsPage,
                        }),
                    ]),
                    routes: [
                        aRoute({
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/about',
                            path: '/about',
                            file: aboutPage,
                            children: [
                                moduleInfo({
                                    id: 'routes/about/us',
                                    path: '/about/us',
                                    file: aboutUsPage,
                                }),
                                moduleInfo({
                                    id: 'routes/about/us_/lang',
                                    path: '/about/us/lang',
                                    file: aboutUsLangPage,
                                }),
                            ],
                        }),
                    ]),

                    routes: [
                        aRoute({
                            pageModule: aboutPage,
                            readableUri: 'about',
                            path: [urlSeg('about')],
                        }),
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/product/$productId',
                            path: '/product/:productId',
                            file: productPage,
                        }),
                    ]),
                    routes: [
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/product/($productId)',
                            path: '/product/:productId',
                            file: productPage,
                        }),
                    ]),
                    routes: [
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/product/$',
                            path: '/product/:$',
                            file: productPage,
                        }),
                    ]),
                    routes: [
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/_layout/about',
                            path: '/about',
                            file: aboutPage,
                        }),
                    ]),
                    routes: [
                        aRoute({
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
                    extraData: rootModuleInfo([
                        moduleInfo({
                            id: 'routes/_layout',
                            path: '/',
                            file: layout,
                            children: [
                                moduleInfo({
                                    id: 'routes/_layout/about',
                                    path: '/about',
                                    file: aboutPage,
                                }),
                            ],
                        }),
                    ]),
                    routes: [
                        aRoute({
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
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/about/index', path: '/about', file: testedPath })]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/about/route', path: '/about', file: testedPath })]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({ id: 'routes/about/_index/route', path: '/about', file: testedPath }),
                ]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({ id: 'routes/about/_index/route', path: '/about', file: testedPath }),
                ]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/about/route',
                        path: '/about',
                        file: layoutPath,
                        children: [
                            moduleInfo({
                                id: 'routes/about/_index/route',
                                path: '/about',
                                file: testedPath,
                            }),
                        ],
                    }),
                ]),
                routes: [
                    aRoute({
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/about/route',
                        path: '/about',
                        file: aboutPath,
                        children: [
                            moduleInfo({
                                id: 'routes/about/us/route',
                                path: '/about/us',
                                file: aboutUsPath,
                            }),
                        ],
                    }),
                    moduleInfo({
                        id: 'routes/middle/route',
                        path: '/middle',
                        file: middlePath,
                    }),
                ]),
                routes: [
                    aRoute({
                        pageModule: aboutPath,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                    }),
                    aRoute({
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
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/_index', path: '/', file: indexPath })], {
                    exportNames: ['Layout', 'ErrorBoundary', 'default'],
                }),
                homeRoute: anyRoute({
                    pageModule: indexPath,
                    readableUri: '',
                    path: [],
                    parentLayouts: [rootLayoutWithError, rootWithError],
                }),
                errorRoutes: [
                    anErrorRoute({
                        pageModule: rootPath,
                        readableUri: '',
                        path: [],
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/_index',
                        path: '/',
                        file: indexPath,
                        exportNames: ['ErrorBoundary', 'default'],
                    }),
                ]),
                homeRoute: aRoute({
                    pageModule: indexPath,
                    readableUri: '',
                    path: [],
                }),
                errorRoutes: [
                    anErrorRoute({
                        pageModule: indexPath,
                        readableUri: '',
                        path: [],
                        parentLayouts: [rootLayout, root],
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
                extraData: rootModuleInfo([
                    moduleInfo({
                        id: 'routes/about',
                        path: '/about',
                        file: aboutPage,
                        exportNames: ['ErrorBoundary', 'default'],
                    }),
                ]),
                routes: [
                    aRoute({
                        pageModule: aboutPage,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                    }),
                ],
                errorRoutes: [
                    anErrorRoute({
                        pageModule: aboutPage,
                        readableUri: 'about',
                        path: [urlSeg('about')],
                        parentLayouts: [rootLayout, root],
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
                    extraData: rootModuleInfo([
                        moduleInfo({ id: 'routes/_index', path: '/', file: indexPath }),
                        moduleInfo({ id: 'routes/about', path: '/about', file: testedPath }),
                    ]),
                    homeRoute: aRoute({ pageModule: indexPath, readableUri: '', path: [] }),
                    routes: [
                        aRoute({
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
                    extraData: rootModuleInfo([moduleInfo({ id: 'routes/about', path: '/about', file: testedPath })]),
                    routes: [
                        aRoute({
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
                extraData: rootModuleInfo([moduleInfo({ id: 'routes/about', path: '/about', file: testedPath })], {
                    exportNames: ['default'],
                }),
                routes: [
                    anyRoute({
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
                    extraData: rootModuleInfo([moduleInfo({ id: 'routes/about', path: '/about', file: testedPath })], {
                        exportNames: ['Layout', 'default'],
                    }),
                    routes: [
                        aRoute({
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
                    pageModule: '/app/routes/about.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
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
                    pageModule: '/app/routes/about/route.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
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
                    pageModule: '/app/routes/about/index.tsx',
                    readableUri: 'about',
                    path: [urlSeg('about')],
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

                const invalidCases = ['1st-page', '_about'];
                for (const invalidCase of invalidCases) {
                    const { isValid, errorMessage, pageModule, newPageRoute, newPageSourceCode } =
                        driver.getNewPageInfo(invalidCase);

                    expect(isValid, `isValid ${invalidCase}`).to.eql(false);
                    expect(errorMessage, `error message ${invalidCase}`).to.eql(INVALID_MSGS.initialPageLetter);
                    expect(pageModule, `page module ${invalidCase}`).to.eql('');
                    expect(newPageSourceCode, `newPageSourceCode ${invalidCase}`).to.eql('');
                    expect(newPageRoute, `newPageRoute ${invalidCase}`).to.eql(undefined);
                }
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
                    pageModule: '/app/routes/about2.tsx',
                    readableUri: 'about2',
                    path: [urlSeg('about2')],
                }),
            );
            expect(routingPattern).to.eql('file');
        });
    });
    describe('render', () => {
        it('should navigate while preserving root state', async () => {
            // ToDo: validate root state is preserved
            const { driver } = await getInitialManifest({
                [rootPath]: rootSource({ componentName: 'RootComponent' }),
                [indexPath]: pageSource({ componentName: 'Home' }),
                [aboutPath]: pageSource({ componentName: 'About' }),
            });

            const { dispose, container, rerender } = await driver.render({ uri: '/' });

            await expectRoute(container, 'RootComponent');
            await expectRoute(container, 'Home');

            await rerender({ uri: 'about' });

            await expectRoute(container, 'RootComponent');
            await expectRoute(container, 'About');

            dispose();
        });
        describe('nested routes', () => {
            it('should render parent routes where needed', async () => {
                const aboutPage = '/app/routes/about.tsx';
                const aboutUsPage = '/app/routes/about.us.tsx';
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({ componentName: 'Home' }),
                    [aboutPage]: pageSource({ componentName: 'About' }),
                    [aboutUsPage]: pageSource({ componentName: 'AboutUs' }),
                });

                const { dispose, container } = await driver.render({ uri: 'about/us' });

                await expectRoute(container, 'About');
                await expectRoute(container, 'AboutUs');

                dispose();
            });
        });
        describe('error routes', () => {
            it('should render error route when error occurs', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({ componentName: 'RootComponent' }),
                    [indexPath]: pageSource({ componentName: 'Home' }),
                });

                const { dispose, container } = await driver.render({ uri: '404' });

                await expectRootLayout(container);
                await expect(() => container.textContent, 'root error boundary')
                    .retry()
                    .to.include('RootComponent error');

                dispose();
            });
            it('should show internal error page if it exists', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        errorBoundary: true,
                        componentCode: {
                            hooks: 'throw new Error("page render error");',
                        },
                    }),
                });

                // ToDo: change test to actually test page error
                const { dispose, container } = await driver.render({ uri: '404' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('App error');

                dispose();
            });
        });
        describe('loader', () => {
            it('should call loader and pass the information into useLoaderData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        loader: { loaderDataFrom: 'home' },
                    }),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expectLoaderData(container, 'Home', { loaderDataFrom: 'home' });

                dispose();
            });
            it('should accept delayed response from loader', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [aboutPath]: pageSource({
                        componentName: 'About',
                        loader: { loaderDataFrom: 'about' },
                        loaderDelay: 200,
                    }),
                });

                const { dispose, container } = await driver.render({ uri: 'about' });

                await expectLoaderData(container, 'About', { loaderDataFrom: 'about' });

                dispose();
            });
            it('should accept deferred response from loader', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [aboutPath]: pageSource({
                        componentName: 'About',
                        loader: {
                            criticalValue: 'immediate value',
                            deferredValue: preserveStringAsCode(
                                'new Promise(resolve => setTimeout(() => resolve("waited value"), 100))',
                            ),
                            deferredFailValue: preserveStringAsCode(
                                'new Promise((_, reject) => setTimeout(() => reject("boom"), 100))',
                            ),
                        },
                        loaderDefer: true,
                        imports: [
                            { specifier: 'react', namedImports: ['Suspense'] },
                            { specifier: '@remix-run/react', namedImports: ['Await', 'useAsyncError'] },
                        ],

                        extraModuleCode: `
                            function DeferredError() {
                                const err = useAsyncError();
                                return <div>deferred fail: {err.message}</div>;
                            }
                        `,
                        componentCode: `
                            const { criticalValue, deferredValue, deferredFailValue } = useLoaderData();
                            if (!deferredValue.then || !deferredFailValue.then) {
                                throw new Error('expected deferredValue and deferredFailValue to be promises');
                            }
                            return (
                                <div>
                                    <div>critical: {criticalValue}</div>
                                    <div>
                                        <Suspense>
                                            <Await resolve={deferredValue}>
                                                {resolvedValue => 'deferred: ' + resolvedValue}
                                            </Await>
                                        </Suspense>
                                    </div>
                                    <div>
                                        <Suspense>
                                            <Await resolve={deferredFailValue} errorElement={<DeferredError />}>
                                                {resolvedValue => 'deferred succeed: ' + resolvedValue}
                                            </Await>
                                        </Suspense>
                                    </div>
                                </div>
                            );
                        `,
                    }),
                });

                const { dispose, container } = await driver.render({ uri: 'about' });

                await waitFor(() => {
                    expect(container.textContent).to.include('critical: immediate value');
                    expect(container.textContent).to.include('deferred: waited value');
                    expect(container.textContent).to.include('deferred fail: boom');
                });

                dispose();
            });
            it('should re-load data on route source change (root)', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({
                        componentName: 'Root',
                        loader: { data: 'initial' },
                    }),
                    [indexPath]: pageSource({}),
                });

                const { dispose, container } = await driver.render({
                    uri: '',
                    testAutoRerenderOnManifestUpdate: false,
                });

                await expectLoaderData(container, 'Root', { data: 'initial' });

                driver.addOrUpdateFile(
                    rootPath,
                    pageSource({
                        componentName: 'Root',
                        loader: { data: 'updated' },
                    }),
                );

                await expectLoaderData(container, 'Root', { data: 'updated' });

                dispose();
            });
            it('should re-load data on route source change (page)', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        loader: { data: 'initial' },
                    }),
                });

                const { dispose, container } = await driver.render({
                    uri: '',
                    testAutoRerenderOnManifestUpdate: false,
                });

                await expectLoaderData(container, 'Home', { data: 'initial' });

                driver.addOrUpdateFile(
                    indexPath,
                    pageSource({
                        componentName: 'Home',
                        loader: { data: 'updated' },
                    }),
                );

                await expectLoaderData(container, 'Home', { data: 'updated' });

                dispose();
            });
        });
        describe('clientLoader', () => {
            it('should call clientLoader and pass the information into useLoaderData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({ componentName: 'Home', clientLoader: { clientLoaderData: 'home' } }),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expectLoaderData(container, 'Home', { clientLoaderData: 'home' });

                dispose();
            });
            it('should call clientLoader allowing it to call server loader (if hydrate is set to true)', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        loader: { loader: 'home' },
                        clientLoader: { clientLoader: 'home' },
                        clientLoaderHydrate: true,
                    }),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expectLoaderData(container, 'Home', { loader: 'home', clientLoader: 'home' });

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
        describe('coduxLoader', () => {
            it('should call coduxLoader and pass the information into useLoaderData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        loader: { loaderData: 'home' },
                        coduxLoader: { coduxLoaderData: 'codux-loader-data' },
                    }),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expectLoaderData(container, 'Home', { coduxLoaderData: 'codux-loader-data' });

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

            it('should call coduxAction instead of action and pass the information into useActionData', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootWithLayout2,
                    [indexPath]: coduxActionPage('Home'),
                });

                const { dispose, container } = await driver.render({ uri: '' });

                await expect(() => container.textContent)
                    .retry()
                    .to.include('Layout|App|Home');

                const submitButton = container.querySelector('button[type=submit]') as HTMLButtonElement;
                submitButton.click();
                await expect(() => container.textContent)
                    .retry()
                    .to.include('Codux action message');

                await expect(() => container.textContent)
                    .retry()
                    .to.not.include('Real action message');
                dispose();
            });
        });
        describe('fetchers', () => {
            const fetcherSuite = (fetcherType: 'page' | 'api') => {
                it('should load data using fetcher for ' + fetcherType, async () => {
                    const { driver } = await getInitialManifest({
                        [rootPath]: rootWithLayout2,
                        '/app/routes/api.users.tsx': fetcherType === 'page' ? actionPage('Users') : userApiPage,
                        '/app/routes/contact.$nickname.tsx': userApiConsumer('/api/users'),
                    });

                    const { dispose, container } = await driver.render({ uri: 'contact/yossi' });

                    await expect(() => container.textContent)
                        .retry()
                        .to.include('Layout|App|UserPage|User does not exist');

                    const nameField = container.querySelector('input[name=fullName]') as HTMLInputElement;
                    const emailField = container.querySelector('input[name=email]') as HTMLInputElement;
                    const submitButton = container.querySelector('button[type=submit]') as HTMLButtonElement;
                    nameField.value = 'John Doe';
                    emailField.value = 'jhon@doe.com';
                    submitButton.click();
                    await expect(() => container.textContent)
                        .retry()
                        .to.include('Layout|App|UserPage|User exist');
                    await expect(() => container.textContent)
                        .retry()
                        .to.include('User created');
                    dispose();
                });
            };
            fetcherSuite('page');
            fetcherSuite('api');
        });

        describe('handle', () => {
            it('exported handled should be available using useMatches', async () => {
                const aboutUsPath = '/app/routes/about.us.tsx';

                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({
                        handle: { origin: 'Root' },
                        componentCode: {
                            remixRunReactImports: ['useMatches'],
                            hooks: 'const matches = useMatches();',
                            jsx: '<div id="matches">{matches.map((m) => m?.handle?.origin).join(">")}</div>',
                        },
                    }),
                    [aboutPath]: pageSource({ componentName: 'About', handle: { origin: 'About' } }),
                    [aboutUsPath]: pageSource({ componentName: 'AboutUs', handle: { origin: 'AboutUs' } }),
                });

                const { dispose, container } = await driver.render({ uri: 'about/us' });

                await expectRoute(container, 'AboutUs');
                const matches = container.querySelector('#matches') as HTMLElement;
                expect(matches.textContent).to.eql('Root>About>AboutUs');

                dispose();
            });
        });

        describe('links function', () => {
            it('should render links returned by the links function', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({
                        componentName: 'Home',
                        links: [{ rel: 'stylesheet', href: 'some.css' }],
                    }),
                });

                const { dispose, container } = await driver.render({ uri: '' });
                await expectRoute(container, 'Home');

                const links = container.querySelectorAll('link');
                expect(links.length).to.equal(1);
                expect(links[0].getAttribute('rel')).to.include('stylesheet');
                expect(links[0].getAttribute('href')).to.include('some.css');

                dispose();
            });
            it('should support having the links function added and removed', async () => {
                const { driver } = await getInitialManifest({
                    [rootPath]: rootSource({}),
                    [indexPath]: pageSource({ componentName: 'Home' }),
                });

                const { dispose, container } = await driver.render({ uri: '' });
                await expectRoute(container, 'Home');

                const link = container.querySelector('link');
                expect(link).to.equal(null);

                driver.addOrUpdateFile(
                    indexPath,
                    pageSource({
                        componentName: 'Home',
                        componentCode: {
                            jsx: '<div>HomeUpdated</div>',
                        },
                        links: [{ rel: 'stylesheet', href: 'some.css' }],
                    }),
                );

                await expect(() => container.textContent)
                    .retry()
                    .to.include('HomeUpdated');

                const links = container.querySelectorAll('link');
                expect(links.length).to.equal(1);
                expect(links[0].getAttribute('rel')).to.include('stylesheet');
                expect(links[0].getAttribute('href')).to.include('some.css');

                dispose();
            });
        });
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
    const driver = new AppDefDriver<RouteModuleInfo, undefined>({
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
const expectManifest = (
    manifest: IAppManifest<RouteModuleInfo, undefined>,
    expected: Partial<IAppManifest<RouteModuleInfo, undefined>>,
) => {
    const fullExpected = {
        errorRoutes: [],
        routes: [],
        ...expected,
    };
    expect(manifest).eql(fullExpected);
};

const anyRoute = ({
    pageModule,
    pageExportName = 'default',
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
    hasGetStaticRoutes = false,
}: {
    pageModule: string;
    pageExportName?: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
    hasGetStaticRoutes?: boolean;
}): RouteInfo<undefined> => {
    return {
        path,
        pathString,
        pageModule,
        hasGetStaticRoutes,
        pageExportName,
        extraData: undefined,
        parentLayouts,
    };
};
const aRoute = ({
    pageModule,
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
    includeRootLayout = true,
    hasGetStaticRoutes = false,
}: {
    pageModule: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
    includeRootLayout?: boolean;
    hasGetStaticRoutes?: boolean;
}): RouteInfo<undefined> => {
    const expectedParentLayouts = includeRootLayout ? [rootLayout, root, ...parentLayouts] : [root, ...parentLayouts];
    return anyRoute({
        pageModule,
        readableUri: pathString,
        path,
        parentLayouts: expectedParentLayouts,
        hasGetStaticRoutes,
    });
};

const anErrorRoute = ({
    pageModule,
    readableUri: pathString = '',
    path = [],
    parentLayouts = [],
}: {
    pageModule: string;
    readableUri?: string;
    path?: RouteInfo['path'];
    parentLayouts?: RouteExtraInfo['parentLayouts'];
}) => {
    return anyRoute({
        pageModule,
        readableUri: pathString,
        path,
        parentLayouts,
        pageExportName: 'ErrorBoundary',
    });
};

const urlSeg = (text: string) => ({
    kind: 'static' as const,
    text,
});
