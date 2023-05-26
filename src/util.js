function isPromise(p) {
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

function isCallable(f)
{
    return typeof f === 'function' && !/^class\s/.test(Function.prototype.toString.call(f));
}

function waiting(data, waitValue)
{
    return data
    if (isPromise(data)) {
        return waitValue
    }
    return data
}

export default {isPromise, isCallable, waiting}
export {isPromise, isCallable, waiting}
