import { DynamicRoutePart, PathApi, RouteInfo, StaticRoutePart } from '@wixc3/app-core';

export interface ParentLayoutWithExtra {
    layoutModule: string;
    layoutExportName: string;
    path: string;
    id: string;
}

export interface RouteExtraInfo {
    parentLayouts: Array<ParentLayoutWithExtra>;
    routeId: string;
}

export function readableStringToRoutePath(readableString: string): Array<StaticRoutePart | DynamicRoutePart> {
    return routePartsToRoutePath(readableString.split('/'));
}
export const routePartsToRoutePath = (routeParts: string[]) => {
    return routeParts
        .map<DynamicRoutePart | StaticRoutePart | null>((p) => {
            if (p === '$') {
                return {
                    kind: 'dynamic' as const,
                    name: '$',
                    isCatchAll: true,
                };
            }
            if (p.startsWith('($') && p.endsWith(')')) {
                return {
                    kind: 'dynamic' as const,
                    name: p.slice(2, p.length - 1),
                    isOptional: true,
                };
            }
            if (p.startsWith('$')) {
                return {
                    kind: 'dynamic' as const,
                    name: p.slice(1, p.length),
                };
            }
            if (p.startsWith('_')) {
                return null;
            }
            if (p.endsWith('_')) {
                return {
                    kind: 'static' as const,
                    text: p.slice(0, p.length - 1),
                };
            }
            return {
                kind: 'static' as const,
                text: p,
            };
        })
        .filter((p): p is DynamicRoutePart | StaticRoutePart => !!p);
};

export function filePathToReadableUri(filePathInRouteDir: string, path: PathApi): string | null {
    const dirStructure = filePathInRouteDir.split(path.sep);
    const partsToReadableName = (parts: string[]) => {
        if (parts.length === 1 && parts[0] === '_index') {
            return '';
        }
        return parts.join('/');
    };
    if (dirStructure.length === 1) {
        const baseName = path.basename(filePathInRouteDir);
        const parts = baseName.split('.');
        return partsToReadableName(parts.slice(0, parts.length - 1));
    }
    if (dirStructure.length === 2) {
        if (dirStructure[1] === 'route.tsx' || dirStructure[1] === 'index.tsx') {
            return partsToReadableName(dirStructure[0].split('.'));
        }
    }
    return null;
}
export const aRoute = (
    routeDirPath: string,
    path: RouteInfo['path'],
    pageModule: string,
    extraData: RouteExtraInfo,
    pathApi: PathApi,
): RouteInfo<RouteExtraInfo> => ({
    path,
    pageModule,
    pageExportName: 'default',
    parentLayouts: extraData.parentLayouts,
    pathString: filePathToReadableUri(pageModule.slice(routeDirPath.length + 1), pathApi) || '',
    extraData,
});

export function filePathToURLParts(filePathInRouteDir: string, path: PathApi): string[] {
    const dirStructure = filePathInRouteDir.split(path.sep);

    if (dirStructure.length === 1) {
        const baseName = path.basename(filePathInRouteDir);
        const parts = baseName.split('.');
        return parts.slice(0, parts.length - 1);
    }
    if (dirStructure.length === 2) {
        if (dirStructure[1] === 'route.tsx' || dirStructure[1] === 'index.tsx') {
            return dirStructure[0].split('.');
        }
    }
    return [];
}

export function filePathToLayoutMatching(filePathInRouteDir: string, path: PathApi): string[] {
    const parts = filePathToURLParts(filePathInRouteDir, path);
    if (parts.length === 1 && parts[0] === '_index') {
        return [];
    }
    return parts.map((p) => {
        if (p.startsWith('$') || p.startsWith('($')) {
            return `***`;
        }
        // if (p.endsWith('_')) {
        //     return p.slice(0, p.length - 1);
        // }
        return p;
    });
}
/**
 * creates a routeId identical to remix routeIDs from a file path
 * @param appDir the root directory of the app
 * @param filePath the full path of the file
 * @returns
 */
export function filePathToRouteId(appDir: string, filePath: string): string {
    return filePath
        .slice(appDir.length + 1)
        .split('.')
        .slice(0, -1)
        .join('/');
}
/**
 * converts a path to a remix router url
 * @param path
 * @returns
 */
export function pathToRemixRouterUrl(path: RouteInfo['path']): string {
    return (
        '/' +
        path
            .map((part) => {
                if (part.kind === 'static') {
                    return part.text;
                }
                return `:${part.name}`;
            })
            .join('/')
    );
}
/**
 * creates a unique id for a route path for checing collisions
 * @param path
 * @returns
 */
export const routePathId = (path: RouteInfo['path']) => {
    return path
        .map((part) => {
            if (part.kind === 'static') {
                return part.text;
            }
            return `$$$`;
        })
        .join('/');
};

export function capitalizeFirstLetter(val: string): string {
    return val.length === 0 ? val : val.charAt(0).toUpperCase() + val.slice(1);
}

export function toCamelCase(str: string): string {
    const words = str
        .split('.')
        .map((word, index) => (index > 0 ? capitalizeFirstLetter(word.toLowerCase()) : word.toLowerCase()));
    return words.join('');
}
