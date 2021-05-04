/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentProps } from 'react';
import ReactDOM from 'react-dom';
import {
    getPluginsWithHooks,
    createSimulationBase,
    OmitSimulation,
    baseRender,
    IPROPS,
    IRenderableHooks,
    IRenderableMetadataBase,
    ISimulation,
} from '@wixc3/simulation-core';

export type OmitReactSimulation<DATA extends IReactSimulation> = Omit<OmitSimulation<DATA>, 'renderer' | 'cleanup'>;

/**
 * Create simulation of a React component.
 */
export function createSimulation<COMP extends React.ComponentType<any>>(
    input: OmitReactSimulation<IReactSimulation<ComponentProps<COMP>, COMP>>
): IReactSimulation<ComponentProps<COMP>, COMP> {
    const res = createSimulationBase<IReactSimulation<ComponentProps<COMP>, COMP>>({
        ...input,
        renderer(target) {
            baseRender(
                res,
                () => {
                    let element = this.wrapper ? (
                        <this.wrapper
                            renderSimulation={(props) => {
                                const mergedProps = { ...this.props, ...props } as React.ComponentProps<COMP>;
                                return <res.componentType {...mergedProps} />;
                            }}
                        />
                    ) : (
                        <res.componentType {...(this.props as React.ComponentProps<COMP>)} />
                    );
                    const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender');
                    for (const plugin of wrapRenderPlugins) {
                        if (plugin.key.plugin?.wrapRender) {
                            const el = plugin.key.plugin?.wrapRender(plugin.props as never, res, element, target);
                            element = el || element;
                        }
                    }
                    ReactDOM.render(element, target);
                },
                target
            );
        },
        cleanup(target) {
            ReactDOM.unmountComponentAtNode(target);
        },
    });
    return res;
}

export interface ISimulationWrapperProps<P> {
    /**
     * Call this function to render the simulated component with the simulated props.
     * @param overrides Allows you to override some of the simulated props with custom values.
     */
    renderSimulation(overrides?: Partial<P>): React.ReactElement<P>;
}

export interface IReactSimulationHooks<PLUGINPROPS extends IPROPS> extends IRenderableHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}

export interface IReactSimulation<P = any, ComponentType extends React.ComponentType<P> = React.ComponentType<any>>
    extends ISimulation<ComponentType, Partial<React.PropsWithChildren<P>>, IReactSimulationHooks<never>> {
    /** The simulated component type. */
    componentType: ComponentType;

    /** The name of the simulation. */
    name: string;

    /**
     * Allows to wrap the simulated component in another component. Useful for providing context,
     * rendering controlled components, or rendering the simulated component multiple times - for
     * example a radio button as a radio group.
     */
    wrapper?: React.ComponentType<ISimulationWrapperProps<P>>;
}
