import {isPromise, isCallable} from "./util.js"
import {Mount} from "./react_bridge.js"
import promise from "./promise.js"
import consts from "./consts.js"
import Component from "./component.js"


const Cdur = {Component, Mount, consts, promise, isPromise, isCallable}
export {Component, Mount, consts, promise, isPromise, isCallable}
export default Cdur
