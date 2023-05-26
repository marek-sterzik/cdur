import createReactComponent from "./react_bridge.js"
import Notifier from "./notifier.js"
import setState from "./state_setter.js"
import {isPromise} from "./util.js"

const getComponentTrigger = (component, recursively) => {
    return (type) => {
        switch(type) {
            case 'changed':
                if (recursively) {
                    component.notifyReactChangedRecursively()
                } else {
                    component.notifyReactChanged()
                }
                break;
            case 'waitStart':
                component.waitStart()
                break;
            case 'waitFinish':
                component.waitFinish()
                break;
            default:
                console.error("Invalid component trigger invoked: " + type)
        }
    }
}

var componentId = 1

export default class Component
{
    constructor(parent, args)
    {
        this.id = "" + (componentId++)
        this._disconnected = false
        if (parent) {
            this._notifier = parent._notifier
            this.context = Object.create(parent.context)
            parent._children[this.id] = this
        } else {
            this.context = {}
            this._notifier = new Notifier()
        }
        this.state = {}
        this._internal = {"waiting": 0}
        this._parent = parent
        this._mountedReactComponents = []
        const view = createReactComponent(this)
        this.view = () => view
        this._children = {}
        if ("init" in this) {
            this.init(...args)
        }
    }

    canWait()
    {
        return "renderWait" in this;
    }

    isWaitingState()
    {
        return this._internal.waiting > 0
    }

    waitStart()
    {
        if (this._internal.waiting == 0 && !this.canWait()) {
            const parent = this.parent()
            if (parent) {
                parent.waitStart()
            }
        }
        this._internal.waiting++
        this.notifyReactChanged()
    }

    waitFor(promise)
    {
        if (isPromise(promise)) {
            this.waitStart()
            promise.finally(this.waitFinish.bind(this))
        }
    }

    waitFinish()
    {
        if (this._internal.waiting > 0) {
            this._internal.waiting--
            this.notifyReactChanged()
        } else {
            throw "called waitFinish without waitStart"
        }
        if (this._internal.waiting == 0 && !this.canWait()) {
            const parent = this.parent()
            if (parent) {
                parent.waitFinish()
            }
        }
    }

    notifyReactChangedRecursively()
    {
        for (var id in this._children) {
            this._children[id].notifyReactChangedRecursively()
        }
        this.notifyReactChanged()
    }

    notifyReactChanged()
    {
        this._notifier.notify(this)
    }

    setState(...args)
    {
        setState(this.state, getComponentTrigger(this, false), ...args)
    }

    setContext(...args)
    {
        setState(this.context, getComponentTrigger(this, false), ...args)
    }

    createSubComponent(subcomponentClass, ...args)
    {
        return (new subcomponentClass(this, args)).view()
    }

    parent()
    {
        return this._parent
    }

    disconnect()
    {
        this._disconnected = true
        delete this._parent._children[this.id]
        if (this._parent !== null && this.isWaitingState() && !this.canWait()) {
            this._parent.waitFinish()
        }
        this.context = {}
        this._parent = null
        this.notifyReactChanged()
    }

    getId()
    {
        return this.id
    }

    static createRootComponent(...args)
    {
        return createReactComponent(new this(null, args))
    }
}


