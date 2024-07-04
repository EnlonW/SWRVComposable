export const noop = () => {}

export const UNDEFINED = (/*#__NOINLINE__*/ noop()) as undefined

export const OBJECT = Object

export const mergeObjects = (a: any, b?: any) => ({ ...a, ...b })

export const isUndefined = (v: any): v is undefined => v === UNDEFINED

export const isFunction = <T extends (...args: any[]) => any = (...args: any[]) => any>(v: unknown): v is T => typeof v == 'function'
