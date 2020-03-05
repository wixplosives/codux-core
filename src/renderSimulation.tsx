/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { IHelperMethods, ISimulation, IRenderOptions } from './types';
import {renderToString} from 'react-dom/server';

const thing = <div>hello</div>
const blah = renderToString(thing);

const renderSimulation = (simulation: ISimulation<any>, options?: IRenderOptions): JSX.Element => {
    const SimulationComponent = simulation.componentType;
    const renderCompWithAdditionalProps = (overrides?: Partial<any>): React.ReactElement => (
        <SimulationComponent {...simulation.props} {...overrides} />
    );

    if (options?.shouldWrapComponent && simulation.wrapper) {
        // return simulation.wrapper({ renderSimulation: renderCompWithAdditionalProps });
    }

    return <SimulationComponent {...simulation.props} />;
}

export const helperMethods: IHelperMethods = {
    renderSimulation,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    renderIntoContainer: () => {}
};
