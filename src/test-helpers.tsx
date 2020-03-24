import React from 'react';
import ReactDOM from 'react-dom';
import { RenderSimulation, SimulationToJsx } from './types';
import {
    renderSimulationWithExplicitReact,
    simulationToJsxWithExplicitReact
} from './test-helpers-with-explicit-react';

export { setupSimulationStage } from './setup-simulation-stage';

export const simulationToJsx: SimulationToJsx = simulation => {
    return simulationToJsxWithExplicitReact(React, simulation);
};

export const renderSimulation: RenderSimulation = simulation => {
    return renderSimulationWithExplicitReact(React, ReactDOM, simulation);
};
