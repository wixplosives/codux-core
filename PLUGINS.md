# Plugins

Plugins can add more meta data, modify the rendering environment, wrap the render result and do many more things

## usage

```
createSimulation({
    name: 'Test2',
    props: { name: 'string', children: [] },
    componentType: x,
    plugins: [
        tagPlugin.use({
            tags: ['a', 'b']
        }),
        cssVarsPlugin.use({
            '--color': 'red'
        })
    ]
});


```

# Available plugins

## tags plugin - applies to any IGeneralMetaData

adds tags to the simulation, usefull when displaying simulations menu in GUI

## CSSVarsPlugin - applies to any IRenderable

accepts an object with css var names and values. renders those css variables

# Writing your own plugin

## what can a plugin do?

plugins are specific to a sub type of IGenralMetaData and can use the hooks supplied by the meta data type.

for instance CSSVarsPlugin is only applicable to IRenderable and uses the 'beforeRender' hook.
