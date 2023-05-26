class Notifier
{
    constructor()
    {
        this.notifications = {}
        this.timeoutEnabled = false
    }
    
    notify(object)
    {
        this.notifications[object.id] = object
        if (!this.timeoutEnabled) {
            this.timeoutEnabled = true
            setTimeout(this.execute.bind(this), 0)
        }
    }

    execute()
    {
        this.timeoutEnabled = false
        for (var id in this.notifications) {
            this.notifyReact(this.notifications[id])
        }
        this.notifications = {}
    }

    notifyReact(component)
    {
        for (var reactComponent of component._mountedReactComponents) {
            reactComponent.updateState()
        }
    }
}

export default Notifier
