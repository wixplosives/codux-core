import React from 'react';
import { ISimulation, IRenderOptions } from './types';
import ReactDOM from 'react-dom';

export const renderSimulation = (simulation: ISimulation<any>, options?: IRenderOptions): JSX.Element => {
    const SimulationComponent = simulation.componentType;
    const renderCompWithAdditionalProps = (overrides?: Partial<any>): React.ReactElement => (
        <SimulationComponent {...simulation.props} {...overrides} />
    );

    if (options?.shouldWrapComponent && simulation.wrapper) {
        const { wrapper: WrappedComponent } = simulation;

        return <WrappedComponent renderSimulation={renderCompWithAdditionalProps} />;
    }

    return <SimulationComponent {...simulation.props} />;
};

export const renderIntoContainer = (
    simulation: ISimulation<any>,
    container: Element,
    options?: IRenderOptions,
    callback?: () => void
): (() => boolean) => {
    const renderedSimulation = renderSimulation(simulation, options);
    ReactDOM.render(renderedSimulation, container, callback);

    return () => ReactDOM.unmountComponentAtNode(container);
};
