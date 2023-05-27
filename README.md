# ![C.dur.](cdur.svg)

_C.dur._ is a JavaScript library providing durable components for React. _C.dur._ creates components similar to standard React stateful components (declared as classes), but _C.dur._ components are **durable**. The lifetime of a _C.dur._ component is independent on the React rendering process.

Therefore _C.dur._ components are useful for handling asynchronous requests. _C.dur_ provides a simple way, how to deal with asynchronicity in React.

**This is the very initial commit of the library. More documentation needs to be added.**

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
// reactComponent and MyComponentInstnace are now the same object
```

Note that the corresponding React component may be really used as a **view** meaning you may render one _C.dur._ component multiple times at the same time.