import { reactErrorHandledRendering } from '@wixc3/react-board/dist/react-error-handled-render';
import { IReactApp, OmitReactApp } from './define-app-types';

export function defineApp<T, U>(input: OmitReactApp<IReactApp<T, U>>): IReactApp<T, U> {
    const res: IReactApp<T, U> = {
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
