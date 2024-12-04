/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const createHandleProxy = () => {
    const lastLoadedHandleRef: { current: any } = { current: null };
    const handle = new Proxy(
        {},
        {
            get: (_, prop) => {
                return lastLoadedHandleRef.current?.[prop] as unknown;
            },
            apply(_, thisArg, argArray) {
                return lastLoadedHandleRef.current?.apply(thisArg, argArray);
            },
            construct(_, argArray) {
                return new lastLoadedHandleRef.current(...argArray);
            },
            defineProperty(_, property, attributes) {
                return Object.defineProperty(lastLoadedHandleRef.current, property, attributes);
            },
            deleteProperty(_, p) {
                return delete lastLoadedHandleRef.current[p];
            },
            getOwnPropertyDescriptor(_, p) {
                return Object.getOwnPropertyDescriptor(lastLoadedHandleRef.current, p);
            },
            getPrototypeOf(_) {
                return Object.getPrototypeOf(lastLoadedHandleRef.current);
            },
            has(_, p) {
                return p in lastLoadedHandleRef.current;
            },
            isExtensible(_) {
                return Object.isExtensible(lastLoadedHandleRef.current);
            },
            ownKeys(_) {
                return Object.keys(lastLoadedHandleRef.current);
            },
            preventExtensions(_) {
                return Object.preventExtensions(lastLoadedHandleRef.current);
            },
            set(_, p, newValue) {
                lastLoadedHandleRef.current[p] = newValue;
                return true;
            },
            setPrototypeOf(_, v) {
                return Object.setPrototypeOf(lastLoadedHandleRef.current, v);
            },
        },
    );
    return {
        handle,
        setHandle: (handle: any) => {
            lastLoadedHandleRef.current = handle;
        },
    };
};
