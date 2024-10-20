import { NavigateFunction } from '@remix-run/react';

export class Navigation {
    private navigateFunction?: NavigateFunction;

    navigate(path: string) {
        this.navigateFunction?.(path);
    }

    setNavigateFunction(navigateFunction: NavigateFunction) {
        this.navigateFunction = navigateFunction;
    }
}

