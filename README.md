# Flux
A simple implementation of Facebook's Flux, an application architecture for building user interfaces (https://facebook.github.io/flux/).

# Install
- Install dependencies:
  - Underscore: http://underscorejs.org/
  - Backbone: http://backbonejs.org/
- Install Flux: `dist/flux.js`

# API Reference

## Flux

### #createStore

```coffeescript
# Defines a store that can be include in a flux context.
StoreClass = Flux.createStore

# Called when a flux context is created.
# `options` is the optional option hash passed in when creating the flux context.
initialize: (options) ->

  # Define actions handled by the store.
  # Keys are the names of the actions the store handles.
  # Values are the functions to handle the actions, the "action handlers".
  # `createStore` automatically binds `this` to the store's instance for all action handlers
  actions:
    deleteTrip: (payload) ->
      # Use `waitFor` whenever you need to access state from another store.
      # This will ensure the sessionStore has been dispatched to first so its
      # state is up-to-date when used here.
      stores = @waitFor(['session'])
      stores.session.aCustomStoreMethodToAccessSomeState()
      # ...update the trip store's state using session store as needed...

      # `createStore` automatically binds `this` to the store's instance for all helper functions
      myArbitrarilyNamedHelper: ->
```

### #createFlux

```coffeescript
# Creates a "flux context" which encapsulates the flux environment (the stores and dispatcher) and
# provides the interface to interact with flux -- dispatching actions and getting stores.  
# Defines what actions and stores are included in the flux context.
flux = Flux.createFlux
actions:
  someAction: null
  someOtherAction: null
  stores:
    cool:
      type: StoreClass
      options: optionalOptions

```

## Flux context

### #dispatch
```coffeescript
# Dispatches an action 'someAction' to the stores that handle it.
# The given action _must_ be defined in the action hash provided when creating the flux
# context with `Flux.createFlux.
# Dispatching an action not defined in the hash will throw an error so that the actions hash provides a
# complete definition of all actions supported by the flux context and to help with debugging should an
# action's name by typoed.
flux.dispatch('someAction', {whateverData: thisActionNeedsToProvide})
```

### #getStore
```coffeescript
# Gets a store from the flux context by it's name.
coolStore = flux.getStore('cool')
```

# Contribute

## Install Dev Dependencies
`npm install`

## Build source
`node_modules/.bin/browserify -t coffeeify src/flux.coffee > dist/flux.js`

## Build tests
`node_modules/.bin/browserify -t coffeeify test/flux_spec.coffee > test/dist/flux_spec.js`

## Run tests
In a web browser visit: `file:///$PROJECT_DIRECTORY/jasmine/SpecRunner.html`
