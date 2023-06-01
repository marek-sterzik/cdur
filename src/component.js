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
        this.state = {}
        this._internal = {"waiting": 0}
        this._parent = parent
        this._parentWaiting = false
        this._mountedReactComponents = []
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

    setState = (...args) => setState(this.state, getComponentTrigger(this, false), ...args)

    setContext = (...args) => setState(this.context, getComponentTrigger(this, false), ...args)

    createSubComponent = (subcomponentClass, ...args) => (new subcomponentClass(this, args)).view()

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
            if (this.isWaitingState() && !this.isAbleToWait()) {
                this._parent.waitFinish()
            }
        }
        this._parent = null
        for (var id in this._children) {
            this._children[id].disconnect()
        }
        if ("destroy" in this) {
            this.destroy()
        }
        notifyReactChanged(this)
    }

    getId = () => this.id

    static createRootComponent (...args) {
        return createReactComponent(new this(null, args))
    }
}
