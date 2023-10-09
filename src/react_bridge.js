import React from "react"
import Component from "./component.js"
import {isSubclassOf} from "./util.js"

const CdurContext = React.createContext(null);

class ComponentView extends React.Component
{
}

const createReactComponent = (component, classComponent) => classComponent ? createReactClassComponent(component) : createReactInstanceComponent(component)

const createReactClassComponent = (component) => function (props) {
    return React.createElement(MountClass, {...props, "component": component}, props.children)
}

const createReactInstanceComponent = (component) => class extends ComponentView {
    constructor() {
        super()
        this.component = component
        this.state = {"s": 1}
    }

    componentDidMount = () => {
        const index = this.component._mountedReactComponents.indexOf(this);
        if (index <= -1) {
            this.component._mountedReactComponents.push(this)
        }
        this.updateState()
    }

    componentWillUnmount = () => {
        const index = this.component._mountedReactComponents.indexOf(this);
        if (index > -1) {
            this.component._mountedReactComponents.splice(index, 1);
        }
    }

    updateState = () => {
        this.setState({"s": this.state.s + 1})
    }

    render = () => {
        var content = this.renderContent()
        if ("decorate" in this.component) {
            content = this.component.decorate(content)
        }

        return React.createElement(CdurContext.Provider, {"value": this.component}, content)
    }

    renderContent = () => {
        const tmp = this.component._reactChildrenState
        this.component._reactChildrenState = {"available": true, "children": this.props.children}
        try {
            if (this.component._disconnected) {
                return React.createElement(React.Fragment, {}, "Error: This component was disconnected")
            } else if (this.component.isWaitingState()) {
                if ("renderWait" in this.component) {
                    return this.component.renderWait()
                } else {
                    return null
                }
            } else {
                if ("render" in this.component) {
                    return this.component.render()
                } else {
                    throw "Render function not implemented"
                }
            }
        } finally {
            this.component._reactChildrenState = tmp
        }
    }

    static disconnect() {
        return component.disconnect()
    }

    static getId() {
        return component.getId()
    }
}


class MountClass extends React.Component
{
    static contextType = CdurContext

    constructor() {
        super()
        this.componentDescriptor = null
        this.wantComponent = false
        this.durable = false
        this.state = {"component": null}
    }

    getComponentArgs = () =>
        ("creationArgs" in this.props) ? this.props.creationArgs : (("args" in this.props) ? this.props : null)

    getComponentParentSlot = () =>  
        ("parentSlot" in this.props) ? this.props.parentSlot : null

    updateState = () => {
        if (this.wantComponent) {
            var component = this.state.component
            if (component !== null && this.componentDescriptor !== this.props.component) {
                if (!this.durable) {
                    component.disconnect()
                }
                component = null
            }
            this.componentDescriptor = this.props.component
            if (component === null) {
                component = this.instantiateComponent()
                this.setState({"component": component})
            }
        } else {
            if (this.state.component !== null) {
                const component = this.state.component
                this.setState({"component": null})
                if (!this.durable) {
                    component.disconnect()
                }
            }
        }
    }

    instantiateComponent = () => {
        const parentSlot = this.getComponentParentSlot()
        const creationArgs = this.getComponentArgs()
        var componentInstance

        if (!isSubclassOf(this.componentDescriptor, Component)){
            throw "Invalid object passed to cdur mount. Only classes or instances of cdur components may be passed."
        }

        const args = (creationArgs !== null) ? creationArgs : []

        if (parentSlot === null || this.context === null) {
            this.durable = false
            componentInstance = this.componentDescriptor.createRootComponent(...args)
        } else {
            this.durable = true
            componentInstance = this.context.getNamedSubComponent(parentSlot)
            if (componentInstance === null || !(Object.getPrototypeOf(componentInstance) === this.componentDescriptor.prototype)) {
                componentInstance = this.context.createNamedSubComponent(
                    parentSlot,
                    this.componentDescriptor,
                    ...args
                )
            }
        }

        return componentInstance
    }

    componentDidUpdate = () => {
        this.updateState()
    }

    componentDidMount = () => {
        this.wantComponent = true
        this.updateState()
    }

    componentWillUnmount = () => {
        this.wantComponent = false
        this.updateState()
    }

    render = () => {
        if (this.state.component === null) {
            return null
        }
        return React.createElement(this.state.component.View, {}, this.props.children)
    }
}

export {createReactComponent}
