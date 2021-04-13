import React from 'react';
import ReactDOM from 'react-dom';
import { getPluginsWithHooks } from '../render-helpers';
import { createSimulationBase, OmitSimulation } from '../create-simulation-base';
import type { IRenderableHooks, IRenderableMetaDataBase, Simulation } from '../types';
import { baseRender } from '../create-renderable-base';

export type OmitReactSimulation<DATA extends IReactSimulation> = Omit<OmitSimulation<DATA>, 'renderer' | 'cleanup'>

export function createSimulation<COMP extends React.ComponentType<any>>(input: OmitReactSimulation<IReactSimulation<COMP>>): IReactSimulation<COMP> {
    const res: IReactSimulation<COMP> = createSimulationBase<IReactSimulation<COMP>>({
        ...input,
        renderer(target) {
            baseRender(res, () => {
                let element = this.wrapper ? <this.wrapper renderSimulation={(props) => {
                    return <res.target {...(this.props as any)} {...props} />
                }} /> : <res.target {...(this.props as any)} />;
                const wrapRenderPlugins = getPluginsWithHooks(res, 'wrapRender')
                for (const plugin of wrapRenderPlugins) {
                    const el = plugin.key.plugin?.wrapRender!(plugin.props, res, element, target);
                    element = el || element;
                }
                ReactDOM.render(element, target)
            }, target)

        },
        cleanup(target) {
            ReactDOM.unmountComponentAtNode(target);
        }

    })
    return res
}


export interface ISimulationWrapperProps<P> {
    /**
     * Call this function to render the simulated component with the simulated props.
     * @param overrides Allows you to override some of the simulated props with custom values.
     */
    renderSimulation: (overrides?: Partial<P>) => React.ReactElement<P>;
}

export interface IReactSimulationHooks extends IRenderableHooks {
    wrapRender?: (props: any, renderable: IRenderableMetaDataBase, renderableElement: JSX.Element, canvas: HTMLElement) => null | JSX.Element,
}
export interface IReactSimulation<ComponentType extends React.ComponentType = React.ComponentType<any>> extends Simulation<ComponentType, Partial<React.PropsWithChildren<ComponentType extends React.ComponentType<infer P> ? P : {}>>, IReactSimulationHooks> {
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
    wrapper?: React.FunctionComponent<ISimulationWrapperProps<ComponentType extends React.ComponentType<infer P> ? P : {}>>;
}

/**
 * @deprecated
 * use IReactSimulation type instead
 */
export type ISimulation<ComponentType extends React.ComponentType = React.ComponentType<any>> = IReactSimulation<ComponentType>

/**
 * @deprecated
 * use simulation.render instead
 */
export const simulationToJsx = (simulation: IReactSimulation) => {
    const { componentType: Comp, props = {}, wrapper: Wrapper } = simulation;

    const renderWithPropOverrides = (overrides?: Record<string, unknown>) => <Comp {...props} {...overrides} />;

    return Wrapper ? <Wrapper renderSimulation={renderWithPropOverrides} /> : <Comp {...props} />;
};