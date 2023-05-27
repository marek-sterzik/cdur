import {S_PUSH} from "./consts.js"
import {isPromise, isCallable} from "./util.js"

const parseKey = (key) => {
    var keys = []
    for (var k of key.split(/\./)) {
        if (k.match(/^[0-9]+$/)) {
            k = parseInt(k)
        } else if (k === '@') {
            k = S_PUSH
        }
        keys.push(k)
    }
    return keys
}

const parseArgs = (args) => {
    if (args.length == 0) {
        throw "Arguments for setState()/setContext() method cannot be empty"
    }

    var writes = []
    var resolveFunction = false

    var arg0 = args.shift()

    if (typeof arg0 === "string") {
        arg0 = parseKey(arg0)
    }

    if (typeof arg0 === "object" && arg0 instanceof Array) {
        if (args.length < 1) {
            throw "Invalid argument count for setState()/setContext()"
        }
        writes.push({"key": arg0, "value": args.shift()})
    } else {
        resolveFunction = false
        for (var key in arg0) {
            writes.push({"key": parseKey(key), "value": arg0[key]})
        }
    }

    if (args.length > 1) {
        throw "Invalid argument count for setState()/setContext()"
    }
    if (args.length == 1) {
        if (args[0] !== true && args[1] !== false) {
            throw "Invalid resolveFunction argument for setState()/setContext()"
        }
        resolveFunction = args[0]
    }

    return {writes, resolveFunction}
}


const doWrite = (object, key, value) => {
    var changed = false
    if (value !== undefined) {
        if (object[key] !== value) {
            changed = true
        }
        object[key] = value
    } else {
        if (key in object) {
            changed = true
        }
        delete object[key]
    }
    return changed
}

const resolveWrite = (trigger, object, key, value, resolveFunction) => {
    if (key === S_PUSH) {
        key = object.length
    }
    if (resolveFunction && isCallable(value)) {
        value = value(object[key])
    }
    const changed = doWrite(object, key, value)
    if (isPromise(value)) {
        trigger("waitStart")
        value.finally(() => {
            trigger("waitFinish")
        }).then((data) => {
            if (object[key] === value) {
                doWrite(object, key, data)
                trigger("changed")
            }
        })
    }
    return changed
}


const setStateSingle = (variable, trigger, keys, value, resolveFunction) => {
    const lastKey = keys.pop()
    var obj = variable
    var oldKey = null
    for (var k of keys) {
        if (oldKey !== null) {
            if (typeof k === "string") {
                obj[oldKey] = {}
            } else if ((typeof k === "int") || (k === S_PUSH)) {
                obj[oldKey] = []
            }
            obj = obj[oldKey]
            oldKey = null
        }
        if (k !== S_PUSH) {
            if (obj[k] === undefined) {
                oldKey = k
            } else {
                obj = obj[k]
            }
        } else {
            oldKey = obj.length
        }
    }
    return resolveWrite(trigger, obj, lastKey, value, resolveFunction)
}

const setState = (variable, trigger, ...args) => {
    args = parseArgs(args)
    var changed = false
    for (var write of args.writes) {
        if (setStateSingle(variable, trigger, write.key, write.value, args.resolveFunction)) {
            changed = true
        }
    }
    if (changed) {
        trigger("changed")
    }
}

export default setState
