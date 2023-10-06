# ![C.dur.](cdur.svg)

_C.dur._ is a JavaScript library providing durable components for [React](https://react.dev/). _C.dur._ creates components similar to standard React stateful components (declared as classes), but _C.dur._ components are **durable**. The lifetime of a _C.dur._ component is independent on the React rendering process.

Therefore _C.dur._ components are useful for handling asynchronous requests. _C.dur_ provides a simple way, how to deal with asynchronicity in React. _C.dur._ also tries to make work with asynchronous requests as easy as possible.

[C.dur. homepage](https://github.com/marek-sterzik/cdur) is located at github. It is currently maintained by [Marek Sterzik](mailto:marek.sterzik@gmail.com).

**API of the library should be considered as unstable until version 1.0.0 of the library is released.** Lots of work still needs to be done. The whole functionality needs to be covered by tests. And the documentation should be improved.

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

This will create a new instance of `MyComponent`. If you want to use this component as a React component just use `MyComponentInstance.View`. For example:

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(<MyComponentInstance.View />);

```

Note that the React view (`MiComponentInstance.View`) may be really used as a **view** meaning you may render one _C.dur._ component multiple times at the same time.

## Stateful components

The previous example showed an easy example of a _C.dur._ component, but the component in the example was _stateless_. The power of _C.dur._ is when used for _stateful_ components. _C.dur._ components try to imitate the behavior of React stateful components, but there are significant differences between both concepts. _C.dur._ components are much more powerful than React stateful components.

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

* `setState()` also enters the component waiting state
* when the promise is resolved, the result of the promise is written to `this.state.data`
* the component waiting state is leaved then

The behavior of writing promises to the state is described in detail later.


### Getting the waiting state

To get the current waiting state of the compoennt, you may call:

```jsx
this.isWaitingState()
```


## Subcomponents

_C.dur._ components provides a way how to easily create subcomponents. A subcomponent is a regular _C.dur._ component, but having some another _C.dur._ component as a parent. All funcitons described above are also available for subcomponents. Just subcomponents are bound together with their parent.

Even _C.dur._ subcomponents are still durable. The lifecycle of a subcomponent is still independent on React rendering.

### Creating a subcomponent

To create a subcomponent, simply call in your component:

```jsx
subComponent = this.createSubComponent(SubComponentClass)
```

The method `createSubComponent()` returns a _C.dur._ component exactly like `createRootComponent()` does. 

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

To access the root component (top level parent), use the component's method `root()`:

```jsx
class ChildComponent extends Cdur.Component
{
    ...
    changeRootComponentState()
    {
        this.root().changeState()
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
            {this.state.child !== null ? <this.state.child.View /> : "child not mounted"}
            <div>
                <button onClick={this.toggleChild.bind(this)}>Toggle child</button>
            </div>
        </div>
    }
}
```


### Waiting in subcomponents

When using the waiting state in subcomponents, there is one more option you can use. Any subcomponent may anounce if it is able to handle the waiting state or not. If a subcomponent is not able to handle the waiting state, the waiting state will be just propagated to the parent.

By default the component recognizes automatically if it is able to handle the wait state depending on the existence of the `renderWait()` method. I.e. if the component has not implemented the `renderWait()` method, the component is considered as not being able to handle waiting and the waiting will be propagated to the parent component. If `renderWait()` is implemented, the component is considered as being able to handle waiting nad waiting will NOT be propagated to the parent.

But this default behavior may be changed by just overriding the method `isAbleToWait()`. If the overriden method returns `true`, the component is considered as being able to handle the wait state and it is considered as NOT being able to handle the wait state otherwise. **The result of this function does not affect the rendering of the component, it just controls the propagation of the waiting state to the parent.**


## Named subcomponents

There is also a posibility to create named subcomponents. A named subcomponent is just a regular subcomponent with an associated string name. There is one important rule for named subcomponents:

**There may be always only one single subcomponent with the same name.**

In case you will try to create a second subcomponent with the same name, the previous subcomponent will be automatically disconnected and destroyed.

To create a named subcomponent, just call:

```jsx
subComponent = this.createNamedSubComponent(name, SubComponentClass)
```

The behavior of `createNamedSubComponent()` is very similar to `createSubComponent()`. The named version just expect the first argument to be the name of the named subcomponent. Both methods return the created instance of the subcomponent.

You may also get the named subcomponent by name:

```jsx
subComponent = this.getNamedSubComponent(name)
```

which will return the named subcomponent if it exists and `null` otherwise.

Named subcomponents may be also disconnected using the method:

```jsx
// short version:
this.disconnectNamedSubcomponent(name)

// long version doing the same (this variant is not null-safe):
this.getNamedSubComponent(name).disconnect()
```


## State and Context

_C.dur._ components may use two different types of its internal state:

1. The already explained `this.state` variable
2. The variable `this.context`

Both variables behave very similarly. Both define an object with attributes. Both needs to be changed only using a special method (`this.state` is changed by `this.setState()` and `this.context` is changed by `this.setContext()` - arguments of both methods are exactly the same). Both may be used inside of render methods.

There is only one difference between both:

**While state is completely private to a component, context is automatically inherited to subcomponents.**

The context has this semantics: The content of any context variable is automatically inherited to subcomponents. Subcomponents may read the inherited values. In case a subcomponent will write a value to the context, the parent value becomes inaccessible.


## State/Context setting functions

For setting the state and/or context there are two methods available: `this.setState()` and `this.setContext()` both may be invoked with the exact same arguments. We will demonstrate the usage of `this.setState()`, but exactly the same holds for `this.setContext()`.

The `setState()` method may be invoked in two main ways:

1. `this.setState(setProps, resolveFunction = false)`
2. `this.setState(propId, value, resolveFunction = false)`

The first variant sets a bunch of properties (given as keys of `setProps`) to the corresponding values. The second variant sets just a single property identified by `propId` to the value `value`. Both variants understands the property identification in the same way. But first variant allows the property identifier be string only, second variant allows also the property being identified by an array (see below).

If `resolveFunction` is true, and the value (or values) are callable functions, the value will be interpreted as a function passing the original value of the property to that function and expecting the result of the function being set back to the same property.

### Identification of the property

The property may be identified either by a string or by an array. When identified by a string, the string is interpreted as a dot-separated array of properties. For example:

```jsx
this.setState("a.b.c.0", 12)
```

would be equivalent to:

```jsx
this.state.a.b.c[0] = 12
```

If you want to access a property containing a dot in its name, you may identify the property by an array. Let say, we want to change the value `this.state["a.b"].c`. Then it may be done by the command:

```jsx
this.setState(["a.b", "c"], 12)
```

There is also a special property name `@` for the string variant of the property identification meaning "_push the value in the array_." Using `@` for non-arrays will lead to undefined behavior. For example. Lets `this.state.names` contains an array of names and we want to push a new item into that array. It may be done using

```jsx
this.setState("names.@", "John Doe")
```

If you want to write the example above in the _array_ identification syntax, you will need a special constant `Cdur.consts.S_PUSH` into that array:

```
this.setState(["names", Cdur.consts.S_PUSH], "John Doe")
```


### Resolving promises

If the value being passed to `setState()`/`setContext()` is a _promise_ then _C.dur._ will trigger an asynchronous write to that property. The asynchronous write may be easily fine-tuned and different aspects of the asynchronous operation may be controlled. These aspects are currently tunable:

* what will be written into the state until the promise is finished
* what will be written into the state when the promise will fail

To trigger the asynchronous write, a promise (object with `thenable` interface) must be passed as the value for `setState()`/`setContext()`. `setState()`/`setContext()` **does not do** any deep inspection of the value and in case the promise is for example just one property of the value (i.e. passing `{data: promise}` as the value for example), the data are written synchronously.

If you want to fine-tune the behavior of the promise according to the values written during the promise life time, you need to turn any promise or value into a _smart_ promise by calling:

```jsx
smartPromise = Cdur.promise(dumbPromise)
```
Then you may use different methods of the smart promise:
```jsx
// write null when the promise is not resolved:
smartPromise.writeNullOnWait()

// write the promise itself when the promise is not resolved:
smartPromise.writePromiseOnWait()

// write null when the promise is rejected:
smartPromise.writeNullOnError()

// write the error object itself causing the promise to be rejected:
smartPromise.writeErrorOnError()

// write anything when waiting for the result:
smartPromise.writeOnWait("Any value")

// write anything when waiting for the result depending on the promise:
smartPromise.writeOnWait((promise) => anyFunction(promise))

// write a function when waiting for the result (don't resolve the function):
smartPromise.writeOnWait(function() {...}, false)

// write anything when the promise is rejected:
smartPromise.writeOnError("ERROR")

// write anything when the promise is rejected depending on the error thrown:
smartPromise.writeOnError((error) => anyFunction(error))

// write a function when the promise is rejected (don't resolve the function):
smartPromise.writeOnWait(function() {...}, false)
```

For example, if we want to make an async state write writing null even when the value is not ready or when the promise fails, one may write this code:

```jsx
this.setState(
    "data",
    Cdur.promise(dumbPromise).writeNullOnWait().writeNullOnError()
)
```

## Lifecycle of a component

The life cycle of any component is controlled explicitely. Components may be created or destroyed.

### Compoent creation detailed

Components are created by calling either the component's static method `createRootComponent()` or by calling the component's method `createSubComponent()`.

```jsx
    rootComponent = MyComponent.createRootComponent(args, may, be, passed)
    this.createSubComponent(MyComponent, args, may, be, passed)
```

Both methods create a new component and the difference is just that root component does not have any parent while subcomponent has parent to be set to the component calling `createSubComponent()`.

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

If a component needs to proceed some specific destruction procedure (unregister event listeners, timers, etc.) you may use the `destroy()` event listener (see below).


### React driven lifecycle

_C.dur._ is solving the weakness in React design, where you cannot remember any state of a component, which is not rendered. To achieve this goal, the lifecycle of _C.dur._ components needs therefore
to be disconnected from the React lifecycle. However this means, that you would need to design a completely new application driven by _C.dur._ components. But there is also an easy way, how _C.dur._
may be used in existing React applications without the necessity to change the whole application design. For this purpose, you can also mount not only _C.dur._ component instances, but also component **classes**! For example:

```jsx
    <MyComponent.View creationArgs={["some", "creation", "args"]} />
```

In that case a root instance of `MyComponent` is automatically created when react mounts the component and is automatically destroyed when react unmounts the component. The property `creationArgs` is
used only at the creation time of the component and does not affect the component later in its lifecycle.

There is also a mechanism, how such a component may be created as a subcomponent:

```jsx
    <MyComponent.View creationArgs={["some", "creation", "args"]} parentSlot="page" />
```

In that variant the component is created as a subcomponent of the parent _C.dur._ component (parent in terms of the concept of React contexts) and it is created as a _named subcomponent_. Which means,
that in that case the component is not destroyed immediately when unmounted, but only after some other component is mounted in the same slot. This enables _C.dur._ to create at least an easy
component lifecycle model, which is mostly compatible with the React lifecycle, but still empowers _C.dur._ components with the power to exist even if not mounted.


## Events

There are multiple events any _C.dur._ component may listen to. The events are just methods of the given name which are automatically invoked in case some event happened. These events are available:

* `init()` - this method is invoked when the component was created
* `destroy()` - this method is invoked when the component was destroyed
* `childAdded(child, name)` - this method is invoked when a new subcomponent was added. `name` is set for named subcomponents and is just `null` for regular unnamed subcomponents.
* `childRemoved(child, name)` - this method is invoked when a subcomponent was removed. The parameters are the same as in `childAdded()`

For example:

```jsx
class MyComponent extends Cdur.Component
{
    ...
    init(creation, arguments)
    {
        // do something when the instance is created, creation arguments are available here
    }

    destroy()
    {
        // do some destruction steps
    }
    
    childAdded(child, name)
    {
        // do some steps when a child is added
    }
    
    childRemoved(child, name)
    {
        // do some steps when a child is removed
    }
}
```

## Misc functions

### Support for React children

Since each _C.dur._ component is still a regular React component, sometimes it may be useful to use the React children inside of the _C.dur._ component. For that purpose, there is a method `children()` available. You may use for example:

```jsx
class MyComponent extends Cdur.Component
{
    ...
    render()
    {
        return <div>{this.children()}</div>
    }
}
```


### Component decoration

Any _C.dur._ component may be decorated by some React component. The result of the `render()`/`renderWait()` methods is passed to a method `decorate(content)` if such a method exists. It allows to easily add some outer components decorating the content. The decoration is added regardless of the waiting state of the component.

Example of usage:

```jsx
class MyComponent extends Cdur.Component
{
    ...
    decorate(content)
    {
        return <div style={{"border": "1px solid black"}}>{content}</div>
    }
}
```

### The universal root component

There is just an easy root component, which may be used in your application as the absolute root component, just to enable all functions of _C.dur._ It may be used in this way:

```jsx
function App()
{
    return <Cdur.Root.View><YourReactApplication /></Cdur.Root.View>
}
```

This root component will not render anything, just will be put in the component tree as the absolute root node. You can then create subcomponents of this root component using the `parentSlot` property.

### Component ID

Each created component, regardless if it is a root component or a subcomponent, will get its unique numeric id. This unique id may be accessed using
```
component.getId()
```

### Type hinting functions

_C.dur._ uses internally some functions, which are used to get a proper type hint of a variable. These functions are also available outside of _C.dur._. In the current version, there are two such functions:

* `Cdur.isPromise(value)` tests if `value` is a promise. _C.dur._ uses this function internally to recognize if a value is a promise (i.e. needs asynchronous handling) or it is not (synchronous access is possible)
* `Cdur.isCallable(value)` tests if `value` is a callable function, but not a class, which is in fact a function in JavaScript as well. This function is used in `setState()`/`setContext()` methods.
