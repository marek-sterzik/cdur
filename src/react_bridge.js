import React from "react"
import Component from "./component.js"

class ComponentView extends React.Component
{
}

const createReactComponent = (component) => class extends ComponentView {
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
        return content
    }

    renderContent = () => {
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
    }

    static disconnect() {
        return component.disconnect()
    }

    static getId() {
        return component.getId()
    }

    static instance() {
        return component
    }
}

class Mount extends React.Component
{
    constructor() {
        super()
        this.componentDescriptor = null
        this.wantComponent = false
        this.durable = false
        this.state = {"component": null}
    }

    getComponentArgs = () => {
        if ("args" in this.props) {
            return this.props.args
        }
        return []
    }

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
                const args = this.getComponentArgs()
                component = this.instantiateComponent(args)
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

    instantiateComponent = (args) => {
        console.log(this.componentDescriptor)
        if (this.componentDescriptor instanceof Component) {
            this.durable = true
            return this.componentDescriptor.view()
        } else if (this.componentDescriptor.prototype instanceof ComponentView) {
            this.durable = true
            return this.componentDescriptor
        } else {
            this.durable = false
            return this.componentDescriptor.createRootComponent(...args)
        }
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
        return React.createElement(this.state.component, {})
    }
}

export {createReactComponent, Mount}
