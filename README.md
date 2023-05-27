# ![C.dur.](cdur.svg)

_C.dur._ is a JavaScript library providing durable components for React. _C.dur._ creates components similar to standard React stateful components (declared as classes), but _C.dur._ components are **durable**. The lifetime of a _C.dur._ component is independent on the React rendering process.

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

This will create a new instance of `MyComponent`. In fact, `MyComponentInstance` is not directly the instance of `MyComponent`, but it is closely related it. `MyComponentInstance` is a React component instead, which you may directly use in your jsx code. For example:
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
