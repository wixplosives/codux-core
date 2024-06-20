import type { IRenderableMetadataBase } from './types';
import { callHooks } from './hooks';

export async function baseRender<DATA extends IRenderableMetadataBase>(
    data: DATA,
    render: (target: HTMLElement) => Promise<() => void>,
    canvas: HTMLElement,
): Promise<() => void> {
    callHooks<IRenderableMetadataBase, 'beforeRender'>(data, 'beforeRender', canvas);
    const cleanup = await render(canvas);
    callHooks<IRenderableMetadataBase, 'afterRender'>(data, 'afterRender', canvas);
    return cleanup;
}
