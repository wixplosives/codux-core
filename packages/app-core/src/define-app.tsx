import { reactErrorHandledRendering } from '@wixc3/react-board/dist/react-error-handled-render';
import { IReactApp, OmitReactApp } from './define-app-types';

export function defineApp<MANIFEST_EXTRA_DATA = unknown, ROUTE_EXTRA_DATA = unknown>(
    input: OmitReactApp<IReactApp<MANIFEST_EXTRA_DATA, ROUTE_EXTRA_DATA>>,
): IReactApp<MANIFEST_EXTRA_DATA, ROUTE_EXTRA_DATA> {
    const res: IReactApp<MANIFEST_EXTRA_DATA, ROUTE_EXTRA_DATA> = {
        ...input,

        async render(target, appProps) {
            if (!appProps) {
                throw new Error('AppProperties must be set using set props before calling render');
            }
            const element = <res.App {...appProps} />;
            return reactErrorHandledRendering(element, target);
        },
    };
    return res;
}
