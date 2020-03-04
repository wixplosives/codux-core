import React from 'react';
import { IHelperMethods, ISimulation } from './types';

export const helperMethods: IHelperMethods = {
  renderSimulation: <P,>(simulation: ISimulation<P>) => {
    const renderSimulation = (additionalProps: Partial<React.PropsWithChildren<P>>) => <simulation.componentType {...simulation.props} {...additionalProps} />;
    return simulation.wrapper({renderSimulation});
  }, 
  renderIntoContainer: () => {}
}