import { SimulationToJsxWithExplicitReact, RenderSimulationWithExplicitReact } from './types';
import { setupSimulationStage } from './setup-simulation-stage';

/*
 * Do not mix usage of `simulationToJsxWithExplicitReact` and the basic `simulationToJsx` in
 * the same project. This could result in multiple versions of React being loaded at the same time.
 */
export const simulationToJsxWithExplicitReact: SimulationToJsxWithExplicitReact = (React, sim): JSX.Element => {
    const { componentType: Comp, props = {}, wrapper: Wrapper } = sim;

    const renderWithPropOverrides = (overrides?: Record<string, any>) => <Comp {...props} {...overrides} />;

    return Wrapper ? <Wrapper renderSimulation={renderWithPropOverrides} /> : <Comp {...props} />;
};

/*
 * Do not mix usage of `renderSimulationWithExplicitReact` and the basic `renderSimulation` in
 * the same project. This could result in multiple versions of React and ReactDOM being loaded at the same time.
 */
export const renderSimulationWithExplicitReact: RenderSimulationWithExplicitReact = (React, ReactDOM, simulation) => {
    const { canvas, cleanup: stageCleanup } = setupSimulationStage(simulation);
    const Comp = simulationToJsxWithExplicitReact(React, simulation);

    ReactDOM.render(Comp, canvas);

    return {
        canvas,
        cleanup: () => {
            ReactDOM.unmountComponentAtNode(canvas);
            stageCleanup();
        }
    };
};
