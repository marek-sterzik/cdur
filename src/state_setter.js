import {S_PUSH} from "./consts.js"
import {isPromise, isCallable} from "./util.js"
import promise from "./promise.js"

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
    var changed = false
    const writer = (value, immediately) => {
        doWrite(object, key, value)
        if (immediately) {
            changed = true
        } else {
            trigger.changed()
        }
    }
    
    promise(value).writeValue(writer, () => trigger.waitStart(), () => trigger.waitFinish())
    
    return changed
}

const hasOwnProperty = (obj, key) => {
    if ("hasOwn" in Object) {
        return Object.hasOwn(obj, key)
    } else {
        return obj.hasOwnProperty(key)
    }
}

const accessForWrite = (obj, key) => {
    return hasOwnProperty(obj, key) ? obj[key] : undefined
}

const setStateSingle = (variable, trigger, keys, value, resolveFunction) => {
    const lastKey = keys.pop()
    var obj = variable
    var oldKey = null
    var changed = false
    for (var k of keys) {
        if (oldKey !== null) {
            if (typeof k === "string") {
                obj[oldKey] = {}
                changed = true
            } else if ((typeof k === "int") || (k === S_PUSH)) {
                obj[oldKey] = []
                changed = true
            }
            obj = accessForWrite(obj, oldKey)
            oldKey = null
        }
        if (k !== S_PUSH) {
            if (obj[k] === undefined) {
                oldKey = k
            } else {
                obj = accessForWrite(obj, k)
            }
        } else {
            oldKey = obj.length
        }
    }
    return resolveWrite(trigger, obj, lastKey, value, resolveFunction) || changed
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
        trigger.changed()
    }
}

export default setState
