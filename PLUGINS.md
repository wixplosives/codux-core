

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