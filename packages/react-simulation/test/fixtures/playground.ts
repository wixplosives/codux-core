import type { IRenderableMetadataBase } from '@wixc3/simulation-core';
import CheckBoxSim from './checkbox-with-wrapper.sim';

const examples = [CheckBoxSim];

const menu = window.document.createElement('div');
for (const examp of examples) {
    const linkButton = window.document.createElement('div');
    linkButton.style.color = 'blue';
    linkButton.style.cursor = 'pointer';
    linkButton.onclick = () => {
        if (lastCleanUp) {
            lastCleanUp();
        }
        setupAndRun(examp);
    };
    menu.appendChild(linkButton);
}
window.document.body.appendChild(menu);
let lastCleanUp: undefined | (() => void);
const setupAndRun = (data: IRenderableMetadataBase) => {
    const { canvas, cleanup } = data.setupStage();
    lastCleanUp = cleanup;
    data.renderer(canvas);
};
