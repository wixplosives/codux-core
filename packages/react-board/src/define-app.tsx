import React from 'react';
import { reactErrorHandledRendering } from './react-error-handled-render';
import { IReactApp, IReactAppProps, OmitReactApp } from './define-app-types';

export function defineApp<T>(input: OmitReactApp<IReactApp<T>, T>): IReactApp<T> {
    let appProps: IReactAppProps<T>;
    const res: IReactApp<T> = {
        ...input,
        setProps(props) {
            appProps = props;
        },
        async render(target) {
            if (!appProps) {
                throw new Error('AppProperties must be set using set props before calling render');
            }
            const element = <res.App {...appProps} />;
            return reactErrorHandledRendering(element, target);
        },
        setupStage(parentElement) {
            const container = document.createElement('div');
            container.style.display = 'contents';
            const attachTo = parentElement || document.body;
            attachTo.appendChild(container);
            return {
                canvas: container,
                cleanup() {
                    container.remove();
                },
                updateWindow() {},
                updateCanvas() {},
            };
        },
    };
    return res;
}
