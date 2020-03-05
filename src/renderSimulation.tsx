import React from 'react';
import { IHelperMethods, ISimulation, IRenderOptions } from './types';

const renderSimulation = (simulation: ISimulation<any>, options?: IRenderOptions): JSX.Element => {
    const SimulationComponent = simulation.componentType;
    const renderCompWithAdditionalProps = (overrides?: Partial<any>): React.ReactElement => (
        <SimulationComponent {...simulation.props} {...overrides} />
    );

    if (options?.shouldWrapComponent && simulation.wrapper) {
        const WrappedComponent = simulation.wrapper({ renderSimulation: renderCompWithAdditionalProps });
        return <WrappedComponent />;
    }

    return <SimulationComponent {...simulation.props} />;
}

export const helperMethods: IHelperMethods = {
    renderSimulation,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    renderIntoContainer: () => {}
};
