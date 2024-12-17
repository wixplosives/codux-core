import { isDeferredData } from '@remix-run/router';
import { json } from '@remix-run/node';
import { CoduxDeferredHeaderKey, serializeResponse } from './remix-app-utils.js';

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export type DeferredResult = {
    __deferred: true;
    deferredKeys: Record<string, { status: 'fulfilled' } | { status: 'rejected'; reason: string }>;
    data: Record<string, unknown>;
};

export async function tryToSerializeDeferredData(res: unknown) {
    if (!isDeferredData(res)) {
        return;
    }
    await res.resolveData(new AbortController().signal);
    return serializeResponse(
        json({
            __deferred: true,
            data: Object.entries(res.data).reduce(
                (acc, [key, value]) => {
                    if (res.deferredKeys.includes(key) && isDeferredPromise(value)) {
                        acc[key] = value._data ? value._data : undefined;
                    } else {
                        acc[key] = value;
                    }
                    return acc;
                },
                {} as Record<string, unknown>,
            ),
            deferredKeys: res.deferredKeys.reduce(
                (acc, key) => {
                    const promise = res.data[key] as DeferredPromise;
                    if (promise._data) {
                        acc[key] = { status: 'fulfilled' };
                    } else {
                        acc[key] = { status: 'rejected', reason: String(promise._error) };
                    }
                    return acc;
                },
                {} as DeferredResult['deferredKeys'],
            ),
        } as DeferredResult),
        [{ key: CoduxDeferredHeaderKey, value: 'true' }],
    );
}

export function isDeferredResult(response: Response): boolean {
    return response.headers.has(CoduxDeferredHeaderKey);
}

export async function deserializeDeferredResult(response: Response) {
    const parsedResponse = (await tryDecodeResponseJsonValue(response)) as DeferredResult | undefined;
    if (!parsedResponse?.data || !parsedResponse.deferredKeys) {
        return {};
    }
    const { data, deferredKeys } = parsedResponse;
    const result = { ...data };
    for (const [key, x] of Object.entries(deferredKeys)) {
        if (x.status === 'fulfilled') {
            result[key] = Promise.resolve(result[key]);
        } else {
            const rejectedDeferred = Promise.reject(new Error(String(x.reason)));
            rejectedDeferred.catch(() => {});
            result[key] = rejectedDeferred;
        }
    }
    return result;
}

async function tryDecodeResponseJsonValue(response: Response) {
    const reader = response.clone().body?.getReader();
    const td = new TextDecoder('utf-8', {});
    let text = '';
    while (reader && true) {
        const { value, done } = (await reader.read()) as { value: Uint8Array; done: boolean };
        text += td.decode(value);
        if (done) {
            break;
        }
    }
    try {
        return JSON.parse(text) as JSONValue;
    } catch {
        /**/
    }
    return;
}

type DeferredPromise = { _data: unknown; _error: unknown };

function isDeferredPromise(value: unknown): value is DeferredPromise {
    return (
        value instanceof Promise &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ((value as any)._data !== undefined || (value as any)._error !== undefined)
    );
}
