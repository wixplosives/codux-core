import CheckBoxBoard from './checkbox.board';
import SimpleBoard from './simple.board';
import { IReactBoard } from '../../src';

const examples = [CheckBoxBoard, SimpleBoard];

const menu = window.document.createElement('div');
for (const examp of examples) {
    const linkButton = window.document.createElement('div');
    linkButton.style.color = 'blue';
    linkButton.style.cursor = 'pointer';
    linkButton.innerText = examp.name;
    linkButton.onclick = () => {
        if (lastCleanUp) {
            lastCleanUp();
        }
        setupAndRun(examp).catch((err) => {
            throw err;
        });
    };
    menu.appendChild(linkButton);
}
window.document.body.appendChild(menu);
let lastCleanUp: undefined | (() => void);
const setupAndRun = async (data: IReactBoard) => {
    const { canvas, cleanup } = data.setupStage();
    // eslint-disable-next-line no-console
    const cleanUpRender = await data.render(canvas).catch(console.error);
    lastCleanUp = () => {
        cleanUpRender?.();
        cleanup();
    };
};
