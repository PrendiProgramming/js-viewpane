// withObservable mixin
export type ObserverNotify<T> = (type: T, ...params) => void
export type ObserverAdd<T> = (type: T, observer: (...params) => void) => void;
export type ObserverRemove<T> = (type: T, observer: (...params) => void) => void;
