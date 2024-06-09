import { BoardPlugin } from '@wixc3/react-board';

export const cssVarsPlugin = (props: Record<string, string>): BoardPlugin => ({
    onInit() {
        for (const [varName, varValue] of Object.entries(props)) {
            document.body.style.setProperty(varName, varValue);
        }
    },
});
