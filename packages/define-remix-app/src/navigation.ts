import { NavigateFunction } from '@remix-run/react';

export class Navigation {
    private navigateFunction?: NavigateFunction;
    private onPreviewNavigate?: (path: string) => void;
    private currentPath: string = '';
    constructor() {}

    navigate(path: string) {
        this.currentPath = path;
        this.navigateFunction?.(path);
    }

    onPreviewNavigation(path: string) {
        this.currentPath = path;
        this.onPreviewNavigate?.(path);
    }

    setOnPreviewNavigate(onPreviewNavigate: (path: string) => void) {
        this.onPreviewNavigate = onPreviewNavigate;
    }
    setNavigateFunction(navigateFunction: NavigateFunction) {
        this.navigateFunction = navigateFunction;
    }

    getCurrentPath() {
        return this.currentPath;
    }
}
