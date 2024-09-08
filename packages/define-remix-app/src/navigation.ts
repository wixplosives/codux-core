import { NavigateFunction } from '@remix-run/react';

class Navigation {
    private navigateFunction?: NavigateFunction;

    navigate(path: string) {
        this.navigateFunction?.(path);
    }

    setNavigateFunction(navigateFunction: NavigateFunction) {
        this.navigateFunction = navigateFunction;
    }
}

export const navigation = new Navigation();
