import {isPromise, isCallable, waiting} from "./util.js"
import {Mount} from "./react_bridge.js"
import consts from "./consts.js"
import Component from "./component.js"


const Cdur = {Component, Mount, consts, waiting, isPromise, isCallable}
export {Component, Mount, consts, waiting, isPromise, isCallable}
export default Cdur
