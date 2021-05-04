/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
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

export type CompProps<COMP extends React.ComponentType<any>> = React.ComponentProps<COMP>;

/**
 * Create simulation of a React component.
 */
export function createSimulation<COMP extends React.ComponentType<any>>(
    input: OmitReactSimulation<IReactSimulation<Partial<CompProps<COMP>>, COMP>>
): IReactSimulation<CompProps<COMP>, COMP> {
    const res = createSimulationBase<IReactSimulation<CompProps<COMP>, COMP>>({
        ...(input as OmitReactSimulation<IReactSimulation<CompProps<COMP>, COMP>>),
        renderer(target) {
            baseRender(
                res,
                () => {
                    let element = this.wrapper ? (
                        <this.wrapper
                            renderSimulation={(props) => {
                                const mergedProps: Partial<React.ComponentProps<COMP>> = { ...this.props, ...props };
                                return <res.componentType {...(mergedProps as CompProps<COMP>)} />;
                            }}
                        />
                    ) : (
                        <res.componentType {...this.props} />
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
    renderSimulation: (overrides?: Partial<P>) => React.ReactElement<Partial<P>>;
}

export interface IReactSimulationHooks<PLUGINPROPS extends IPROPS> extends IRenderableHooks<PLUGINPROPS> {
    wrapRender?: (
        props: PLUGINPROPS,
        renderable: IRenderableMetadataBase,
        renderableElement: JSX.Element,
        canvas: HTMLElement
    ) => null | JSX.Element;
}
export interface IReactSimulation<
    PROPS = any,
    ComponentType extends React.ComponentType<PROPS> = React.ComponentType<any>
> extends ISimulation<ComponentType, PROPS, IReactSimulationHooks<never>> {
    /** The simulated component type. */
    componentType: ComponentType;

    /** The name of the simulation. */
    name: string;

    /**
     * A map between a component property name and its simulated value.
     */
    // TODO - change props to be optional field (props?: ...)

    /**
     * Allows to wrap the simulated component in another component. Useful for providing context,
     * rendering controlled components, or rendering the simulated component multiple times - for
     * example a radio button as a radio group.
     */
    wrapper?: React.ComponentType<ISimulationWrapperProps<PROPS>>;
}

/**
 * @deprecated
 * use simulation.render instead
 */
export const simulationToJsx = (simulation: IReactSimulation): JSX.Element => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { componentType: Comp, props, wrapper: Wrapper } = simulation;
    const renderWithPropOverrides = (overrides?: Record<string, unknown>) => <Comp {...props} {...overrides} />;
    return Wrapper ? <Wrapper renderSimulation={renderWithPropOverrides} /> : <Comp {...props} />;
};
