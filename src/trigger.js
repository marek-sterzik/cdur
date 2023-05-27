const notifyReactChanged = (component) => component._notifier.notify(component)

const notifyReactChangedRecursively = (component) => {
    for (var id in this._children) {
        notifyReactChangedRecursively(this._children[id])
    }
    notifyReactChanged(this)
}

class ComponentTrigger
{
    constructor(component, recursively)
    {
        this.component = component
        this.recursively = recursively
    }

    changed = () => this.recursively ?
        notifyReactChangedRecursively(this.component) : notifyReactChanged(this.component)

    waitStart = () => this.component.waitStart()

    waitFinish = () => this.component.waitFinish()
}

const getComponentTrigger = (component, recursively) => new ComponentTrigger(component, recursively)

export {getComponentTrigger, notifyReactChanged}
