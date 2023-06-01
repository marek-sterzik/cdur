import {isPromise, alwaysCallable} from "./util.js"

class TunablePromise
{
    static create(value)
    {
        if (value instanceof TunablePromise) {
            return value
        }
        return new TunablePromise(value, null, null)
    }

    constructor(value, onWait, onError)
    {
        this.value = value
        this.onWait = onWait
        this.onError = onError
    }

    writeOnWait = (onWait, resolveFunction) => {
        return new TunablePromise(this.value, alwaysCallable(onWait, resolveFunction), this.onError)
    }

    writeOnError = (onError, resolveFunction) => {
        return new TunablePromise(this.value, alwaysCallable(this.onWait, resolveFunction), onError)
    }

    writeNullOnWait = () => this.writeOnWait(null)
    writePromiseOnWait = () => this.writeOnWait((promise) => promise)
    writeNullOnError = () => this.writeOnError(null)
    writeErrorOnError = () => this.writeOnError((error) => error)

    writeValue = (writer, waitStart, waitFinish) => {
        const onWait = this.onWait
        const onError = this.onError
        
        if (!isPromise(this.value)) {
            writer(this.value, true)
        } else {
            if (onWait !== null) {
                writer(onWait(this.value), true)
            }
            waitStart()
            this.value
                .finally(() => waitFinish())
                .then((value) => writer(value, false))
                .catch((error) => {
                    if (onError) {
                        writer(onError(error), false)
                    }
                })
        }
    }

    then = (fnF, fnR) => new TunablePromise(Promise.resolve(this.value).then(fnF, fnR), this.onWait, this.onError)
    catch = (fn) => new TunablePromise(Promise.resolve(this.value).catch(fn), this.onWait, this.onError)
    finally = (fn) => new TunablePromise(Promise.resolve(this.value).finally(fn), this.onWait, this.onError)
}

const promise = (value) => TunablePromise.create(value)

export default promise
