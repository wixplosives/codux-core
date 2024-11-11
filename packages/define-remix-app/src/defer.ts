import { isDeferredData } from '@remix-run/router';
import { json } from '@remix-run/node';
import { serializeResponse } from './remix-app-utils';

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
    );
}

export function isDeferredResult(res: unknown): res is DeferredResult {
    return typeof res === 'object' && !!res && '__deferred' in res;
}

export function deserializeDeferredResult({ deferredKeys, data }: DeferredResult) {
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

type DeferredPromise = { _data: unknown; _error: unknown };

function isDeferredPromise(value: unknown): value is DeferredPromise {
    return (
        value instanceof Promise &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        ((value as any)._data !== undefined || (value as any)._error !== undefined)
    );
}
