const isPromise = (p) => {
  if (
    p !== null &&
    typeof p === 'object' &&
    typeof p.then === 'function' &&
    typeof p.catch === 'function' &&
    typeof p.finally === 'function'
  ) {
    return true;
  }

  return false;
}

const isCallable = (f) => {
    return typeof f === 'function' && !/^class\s/.test(Function.prototype.toString.call(f));
}

export default {isPromise, isCallable}
export {isPromise, isCallable}
