# ![C.dur.](cdur.svg)

_C.dur._ is a JavaScript library providing durable components for [React](https://react.dev/). _C.dur._ creates components similar to standard React stateful components (declared as classes), but _C.dur._ components are **durable**. The lifetime of a _C.dur._ component is independent on the React rendering process.

Therefore _C.dur._ components are useful for handling asynchronous requests. _C.dur_ provides a simple way, how to deal with asynchronicity in React. _C.dur._ also tries to make work with asynchronous requests as easy as possible.

**This is the very initial stage of the library. More documentation needs to be added.**

## Installation
```bash
$ npm install cdur
```

## Basic usage
To use the _C.dur._ library, just import `Cdur` from `"cdur"`:

```jsx
import Cdur from "cdur"
```


To create a durable component, you need just to derive a class from 
`Cdur.Component`:

```jsx
import Cdur from "cdur"

class MyComponent extends Cdur.Component
{
    render()
    {
        return <>C.dur. Hello World</>
    }
}
```

Since the lifetime of _C.dur._ components is independent on React, you need first to create an instance of such a component. **Never use direct instantiation of the component class.** Use the `createRootComponent()` method instead:

```jsx
const MyComponentInstance = MyComponent.createRootComponent()
```

This will create a new instance of `MyComponent`. In fact, `MyComponentInstance` is not directly the instance of `MyComponent`, but it is closely related. `MyComponentInstance` is a React component instead, which you may directly use in your jsx code. For example:
```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<MyComponentInstance />);

```

But if necessary, you may easily switch between the instance of your _C.dur._ component and the corresponding React component:

```jsx
rawComponentInstance = MyComponentInstance.instance()
reactComponent = rawComponentInstance.view()
// reactComponent and MyComponentInstnace are now referencing to the same object
```

Note that the corresponding React component may be really used as a **view** meaning you may render one _C.dur._ component multiple times at the same time.

## Stateful components

The previous example showed an easy example of a _C.dur._ component, but the component in the example was _stateless_. The power of _C.dur._ is when used for _stateful_ components. _C.dur._ components try to imitate the behavior of React stateful components, but there are differences between both concepts. _C.dur._ components are much more powerful than React stateful components.

Here is an example of an easy stateful _C.dur._ component:

```jsx
class MyStatefulComponent extends Cdur.Component
{
    init()
    {
        this.setState({"enabled": false})
    }

    toggleEnabled()
    {
        this.setState({"enabled": !this.state.enabled})
    }

    render()
    {
        return <div>
            <div>
                This component is {this.state.enabled ? 'enabled' : 'disabled'}
            </div>
            <div><button onClick={this.toggleEnabled.bind(this)}>Toggle</button></div>
        </div>
    }
}
```

Very similar rules needs to be fulfilled as for React state components:

* You may read the state directly using `this.state`.
* Always change the state using the method `setState()` only. Never change the state directly.

But in this case the `setState()` method is much more powerful than the `setState()` equivalent from regular React state components. We will discuss all aspects of using `setState()` later.

## Waiting components

_C.dur_ components are equipped with a strong mechanism allowing to easily deal with a waiting state associated with asynchronous requests. There is an internal waiting state of a component, which may be easily triggered by asynchronous events. When a component is in a waiting state, it may set up a completely different rendering. Or it may just render a waiting widget.

If you want to use the waiting functionality, you should implement the method `renderWait()` of your component, which is used in case your component is in the waiting state. For example:

```jsx
class MyWaitingComponent {
    ...
    renderWait()
    {
        return <div>Please wait...</div>
    }
}
```

If the component is in a waiting state and your component does not implement `renderWait()`, **nothwing will be rendered.** But it is allowed to implement the `renderWait()` function by calling the regular `render()` function. But in such a case the component is responsible for properly evaluating the incomplete data caused the wait state.

Then you may easily trigger the waiting state of the component. You can do it either manually by calling the methods `waitStart()` (when the waiting state should be entered) and `waitFinish()` (when the waiting state should be leaved) or you can also use an internal promise driving mechanism.

### Triggering wait state manually
Note, that you may call `waitStart()` and `waitFinish()` multiple times at the same time. In such a case, the waiting state is entered by the first call of `waitStart()` and leaved by the last call of `waitFinish()`. **Both methods should be always paired up together.** Each `waitStart()` needs to have a corresponding `waitFinish()` call to be invoked.

For example, if we would like to make a component doing the same as the example of `MyStatefulComponent` (see above) but making the change of state asynchronously and having the component in a waiting state while the asynchronous operation is running, we could do it in this way:

```jsx
class MyStatefulComponent
{
    ...
    toggleEnabled()
    {
        this.waitStart()
        setTimeout((function(){
             this.setState({"enabled": !this.state.enabled})
             this.waitFinish()  
        }).bind(this), 1000)
    }
}
```

### Triggering wait state by a promise

If your asynchronous opreation is represented by a promise, you may easily trigger the wait state of a component by calling the method:
```jsx
this.waitFor(promise)
```

Or you may also write the promise directly to the state using `setState()`:
```jsx
this.setState({"data": promise})
```
In this case this will happen:

* `setState()` writes temporarily the promise itself in `this.state.data`.
* `setState()` also enters the component waiting state
* when the promise is resolved, the result of the promise is written to `this.state.data`
* the component waiting state is leaved

Note, that this works only in case, you pass the promise directly as a value of the object passed to `setState()`. `setState()` will **not** do any object deep inspection if the promise is not hidden somewhere in the data structure.

_C.dur._ also contains a helper function `Cdur.waiting()` to deal with these temporarily written promises in the state. This function makes sense only in cases, when renderWait() is rendering the component even in case not all data are available. The function may be used in this way:

```jsx
Cdur.waiting(this.state.data, null)
```

The intention is just to replace the promise by some default value until the promise is resolved.

## Subcomponents

_C.dur._ components provides a way how to easily create subcomponents. A subcomponent is a regular _C.dur._ component, but having some another _C.dur._ component as a parent. All funcitons described above are also available for subcomponents. But subcomponents are bound together with their parent.

Event _C.dur._ subcomponents are still durable. The lifecycle of a subcomponent is still independent on React rendering.

### Creating a subcomponent

To create a subcomponent, simply call in your component:

```jsx
subComponent = this.createSubComponent(SubComponentClass)
```

The method `createSubComponent()` returns a React component exactly like `createRootComponent()` does. Using `reactComponent.instance()` you may get the instance of the component itself exactly as it is possible for root components.

### Removing a subcomponent

To remove a subcomponent, simply call
```jsx
subComponent.disconnect()
```

### Keeping subcomponents in the state

Subcomponents may be kept regularly in `this.state` like any other data. It is just necessary to store them into the state using `setState()`.

### Accessing parent component

To access parent component, just use the components's method `parent()`, for example:
```jsx
class ChildComponent extends Cdur.Component
{
    ...
    changeParentState()
    {
        this.parent().changeState()
    }
}
```

### Example

Here is a complete example using states how subcomponents may be used:
```jsx
class ChildComponent extends Cdur.Component
{
    render()
    {
        return <div>Child</div>
    }
}

class ParentComponent extends Cdur.Component
{
    init()
    {
        this.setState("child", null)
    }

    toggleChild()
    {
        if (this.state.child !== null) {
            this.state.child.disconnect()
            this.setState("child", null)
        } else {
            const child = this.createSubComponent(ChildComponent)
            this.setState("child", child)
        }
    }

    render()
    {
        return <div>
            {this.state.child !== null ? <this.state.child /> : "child not mounted"}
            <div>
                <button onClick={this.toggleChild.bind(this)}>Toggle child</button>
            </div>
        </div>
    }
}
```

### Waiting in subcomponents

When using the waiting state in subcomponents, there is one more option you can use: Any subcomponent may anounce if it is able to handle the waiting state or not. If a subcomponent is not able to handle the waiting state, the waiting state will be just propagated to the parent.

By default the component recognizes automatically if it is able to handle the wait state depending on the existence of the `renderWait()` method. I.e. if the component has not implemented the `renderWait()` method, the component is considered as not being able to handle waiting and the waiting will be propagated to the parent component. If `renderWait()` is implemented, the component is considered as being able to handle waiting nad waiting will NOT be propagated to the parent.

But this default behavior may be changed by just overriding the method `isAbleToWait()`. If the overriden method returns `true`, the component is considered as being able to handle the wait state and it is considered as NOT being able to handle the wait state otherwise. **The result of this function does not affect the rendering of the component, it just controls the propagation of the waiting state to the parent.**


## Lifecycle of a component

The life cycle of any component is controlled explicitely. Components may be created or destroyed.

### Compoent creation detailed

Components are created by calling either the component's static method `createRootComponent()` or by calling the component's method `createSubComponent()`.
```jsx
    rootComponent = MyComponent.createRootComponent(args, may, be, passed)
    this.createSubComponent(MyComponent, args, may, be, passed)
```
Both methods create a new component and the difference is just that root component does not have any parent while subcomponent has parent to be set to hte component calling `createSubComponent()`.

Arguments may be passed to the creation process. Any argument is passed to the `init()` method. For example:
```jsx
class GreetingComponent extends Cdur.Component
{
    init(name)
    {
        this.setState("name", name)
    }

    render()
    {
        return <div>Hello, {this.state.name}</div>
    }
}

component = GreetingComponent.createRootComponent("John")
```

### Component destruction

If some component is no longer necessary, it should be explicitely destroyed. You can do it by calling
```jsx
component.disconnect()
```

If a component needs to proceed some specific destruction procedure (unregister event listeners, timers, etc.) it may implement the `destroy()` method:
```jsx
class MyComponent extends Cdur.Component
{
    ...
    destroy()
    {
        // do some destruction steps
    }
}
```

## To be documented

* state vs context
* `isWaitingState()`
* `getId()`
* `decorate()`
* `setState()`/`setContext()` in detail
* `Cdur.isPromise()`/`Cdur.isCallable()`
* `Cdur.Mount`
