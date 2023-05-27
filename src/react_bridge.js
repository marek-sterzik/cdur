import React from "react"

export default (component) => class extends React.Component {
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
            if (this.component.isAbleToWait()) {
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

