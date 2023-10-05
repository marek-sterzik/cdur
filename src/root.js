import React from "react"
import Component from "./component.js"

class Root extends Component
{
    render()
    {
        return React.createElement(React.Fragment, {}, this.children())
    }
}

export default Root
