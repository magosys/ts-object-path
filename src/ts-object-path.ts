import { ObjPathProxy } from './obj-path-proxy'
export * from './obj-path-proxy'

const pathSymbol = Symbol('Object path')

const ProxyPolyfill = require('es6-proxy-polyfill');


type RecursiveRequired<T> = {
  [P in keyof T]-?: RecursiveRequired<T[P]>;
};

export function createProxy<T>(path: PropertyKey[] = []): ObjPathProxy<RecursiveRequired<T>> {
  const proxy = new ProxyPolyfill(
    { [pathSymbol]: path },
    {
      get(target: any, key: PropertyKey) {
        if (key === pathSymbol) {
          return target[pathSymbol]
        }
        if (key === '_path') {
          return path
        }
        if (key === '_pathString') {
          return path.join('.')
        }
        if(key === '_pathUrl'){
          return path.join('/')
        }
        if (key === '_name') {
          return path[path.length - 1]
        }

        let keys: (string | symbol)[] = []

        if (typeof key === 'string') {
          keys = key.split('.')
        }
        return createProxy([...(path || []), ...keys.map((key) => {
          let newKey: string | symbol | number  = key;
          const intKey = parseInt(key.toString(), 10)
          if (key === intKey.toString()) {
            newKey = intKey
          }
          return newKey;
        })])
      }
    }
  )
  return (proxy as any) as ObjPathProxy<RecursiveRequired<T>>
}


export function get<T>(
  object: any,
  proxy: ObjPathProxy<T>,
  defaultValue: T | null | undefined = undefined
) {
  return proxy._path.reduce((o, key) => {
    const v = o && o[key];
    return v != null ? v : defaultValue;
  }, object as any) as T | undefined
}

export function set<T>(object: any, proxy: ObjPathProxy<T>, value: T): void {
  proxy._path.reduce((o: any, key, index, keys) => {
    if (index < keys.length - 1) {
      o[key] = o[key] != null ? o[key] : (typeof keys[index + 1] === 'number' ? [] : {})
      return o[key]
    }
    o[key] = value
  }, object)
}
