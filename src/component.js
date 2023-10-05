import {createReactComponent} from "./react_bridge.js"
import Notifier from "./notifier.js"
import setState from "./state_setter.js"
import {isPromise} from "./util.js"
import {getComponentTrigger, notifyReactChanged} from "./trigger.js"
import consts from "./consts.js"

var componentId = 1

export default class Component
{
    constructor(parent, args) {
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
        this._name = null
        this._namedChildren = {}
        this.state = {}
        this._internal = {"waiting": 0}
        this._parent = parent
        this._parentWaiting = false
        this._mountedReactComponents = []
        this._reactChildrenState = {"children": null, "available": false}
        const view = createReactComponent(this)
        this.view = () => view
        this._children = {}
        if ("init" in this) {
            this.init(...args)
        }
    }

    getAsyncWriteMode = () => consts.AW_NONE

    isAbleToWait = () => {
        return "renderWait" in this;
    }

    isWaitingState = () => {
        return this._internal.waiting > 0
    }

    waitStart = () => {
        if (!this.isAbleToWait() && !this._parentWaiting && this._parent) {
            this._parentWaiting = true
            this._parent.waitStart()
        }
        this._internal.waiting++
        notifyReactChanged(this)
    }

    waitFor = (promise) => {
        if (isPromise(promise)) {
            this.waitStart()
            promise.finally(this.waitFinish.bind(this))
        }
    }

    waitFinish = () => {
        if (this._internal.waiting > 0) {
            this._internal.waiting--
            notifyReactChanged(this)
        } else {
            throw "called waitFinish without waitStart"
        }
        if (this._internal.waiting == 0 && this._parentWaiting) {
            this._parentWaiting = false
            this._parent.waitFinish()
        }
    }

    children = () => {
        if (this._reactChildrenState.available) {
            return this._reactChildrenState.children
        }
        throw "React children not available outside of render function"
    }

    setState = (...args) => setState(this.state, getComponentTrigger(this, false), ...args)

    setContext = (...args) => setState(this.context, getComponentTrigger(this, false), ...args)

    createSubComponent = (subComponentClass, ...args) => {
        const component = this._createSubComponent(subComponentClass, ...args)
        this._notify("childAdded", component.instance(), null)
        return component
    }
    _createSubComponent = (subComponentClass, ...args) => (new subComponentClass(this, args)).view()

    createNamedSubComponent = (name, subComponentClass, ...args) => {
        this.disconnectNamedSubComponent(name)
        const component = this._createSubComponent(subComponentClass, ...args)
        const componentInstance = component.instance()
        componentInstance._name = name
        if (name !== null) {
            this._namedChildren[name] = componentInstance.id
        }
        this._notify("childAdded", componentInstance, name)
        return component

    }

    getNamedSubComponent = (name) => {
        const component = this._getNamedSubComponent(name)
        return (component !== null) ? component.view() : null
    }

    _getNamedSubComponent = (name) => {
        if (name !== null && name in this._namedChildren) {
            const id = this._namedChildren[name]
            if (id in this._children) {
                return this._children[id]
            }
        }
        return null
    }

    disconnectNamedSubComponent = (name) => {
        const component = this._getNamedSubComponent(name)
        if (component !== null) {
            component.disconnect()
        }
    }

    parent = () => this._parent

    root = () => {
        var last = this
        var current = this
        do {
            last = current
            current = current.parent()
        } while (current !== null)
        return last
    }

    disconnect = () => {
        this._disconnected = true
        if (this._parent !== null) {
            delete this._parent._children[this.id]
            if (this._name !== null) {
                delete this._parent._namedChildren[this._name]
            }
            if (this.isWaitingState() && !this.isAbleToWait()) {
                this._parent.waitFinish()
            }
        }
        for (var id in this._children) {
            this._children[id].disconnect()
        }
        this._notify("destroy")
        if (this._parent !== null) {
            this._parent._notify("childRemoved", this, this._name)
        }
        this._name = null
        this._parent = null
        notifyReactChanged(this)
    }

    getId = () => this.id

    _notify = (method, ...args) => (method in this) ? this[method].apply(this, args) : null

    static createRootComponent (...args) {
        return createReactComponent(new this(null, args))
    }
}
