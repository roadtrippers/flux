window.Flux = (->

  ### Dispatcher ###

  class Dispatcher
    Dispatcher.create = (options) ->
      new Dispatcher(options)

    constructor: ->
      @actions = {}
      @stores = {}

    addActions: (actions) =>
      @_addObjects(actions, @actions, 'Action')

    addStores: (stores) =>
      @_addObjects(stores, @stores, 'Store')

    _addObjects: (source, target, objectTypeLabel) ->
      Object.keys(source).forEach((key) ->
        if target.hasOwnProperty(key)
          throw new Error("#{objectTypeLabel} already added: #{key}")
        target[key] = source[key]
      )

    dispatch: (actionName, payload) =>
      unless @actions.hasOwnProperty(actionName)
        throw new Error("Error dispatching action. Action name not found: \"#{actionName}\"")

      if @dispatches
        throw new Error('Cannot dispatch during a dispatch.')

      # TODO: Are we okay with the order stores are dispatched being arbitrary
      # TODO: since `Object.keys` iteration order is arbitrary?
      storeKeys = Object.keys(@stores).filter((storeKey) =>
        @stores[storeKey].actions[actionName]
      )
      unless storeKeys.length > 0
        if window.console and window.console.warn
          console.warn("No stores are listening to action: #{actionName}")
        return

      @actionName = actionName
      @payload = payload
      @dispatches = storeKeys.map((storeKey) =>
        storeKey: storeKey
        handler: @stores[storeKey].actions[actionName]
        waitingForStoreKeys: null
        completed: false
      )

      try
        @_dispatchToStores(@dispatches)
      finally
        @actionName = null
        @payload = null
        @dispatches = null

    _dispatchToStores: (dispatches) =>
      dispatches.forEach((dispatch) =>
        unless dispatch.completed
          dispatch.handler.call(null, @payload)
          dispatch.completed = true
        # else dispatch has already been completed via a recursive call
        # to this method via `waitFor`.
      )

    waitFor: (storeKey, waitingForStoreKeys)=>
      unless @dispatches
        throw new Error("Cannot wait unless an action is being dispatched.")

      if waitingForStoreKeys.indexOf(storeKey) > -1
        throw new Error("A store cannot wait on itself.")

      waitingForStoreKeys.forEach((waitingForStoreKey) =>
        unless @stores[waitingForStoreKey]
          throw new Error("#{waitingForStoreKey} store not found to wait for.")
      )

      dispatch = _.find(@dispatches, (dispatch) ->
        dispatch.storeKey is storeKey
      )

      if dispatch.waitingForStoreKeys
        throw new Error("#{storeKey} store is already waiting for stores.")

      waitingForStoreDispatches = waitingForStoreKeys.reduce((memo, waitingForStoreKey) =>
        waitingForDispatch = _.find(@dispatches, (dispatch) ->
          dispatch.storeKey is waitingForStoreKey
        )
        if waitingForDispatch
          if waitingForDispatch.waitingForStoreKeys and
             waitingForDispatch.waitingForStoreKeys.indexOf(storeKey) > -1
            throw new Error("Circular wait detected between #{storeKey} and #{waitingForStoreKey} stores.")
          memo.push(waitingForDispatch)
        memo
      , [])

      dispatch.waitingForStoreKeys = waitingForStoreKeys
      # Recurse to let waiting for stores to be processed next.
      @_dispatchToStores(waitingForStoreDispatches)

      waitingForStoreKeys.reduce((memo, waitingForStoreKey) =>
        memo[waitingForStoreKey] = @stores[waitingForStoreKey]
        memo
      , {})

  # Create a store according to the specified spec object.
  #
  # @param spec An object defining the store's functionality.
  #   Consists of the following properties:
  #   initialize - A function accepting an `options` object to set initial state.
  #   actions - Object of action handlers keyed by action name.
  #   * - Any custom helper methods you wish to define.
  # @return A store class which can be used in a flux context.
  createStore = (spec) ->
    class Store
      _.extend(this.prototype, Backbone.Events, spec)

      constructor: (waitFor, options) ->
        # Bind all functions to `this`
        methods = Object.keys(this)
        if methods.length > 0
          _.bindAll.apply(null, [this].concat(Object.keys(this)));
        # Bind all action handlers to `this`
        @actions = Object.keys(@actions).reduce((memo, action) =>
          memo[action] = @actions[action].bind(this)
          memo
        , {})
        @waitFor = waitFor
        @initialize?.call(this, options)

  # Create a flux context.
  #
  # A flux context initializes the actions and stores to be used by an app and
  # provides the public API for dispatching actions and for accessing stores.
  #
  # @param options An object with the stores and actions to use.
  #   stores: An object defining the stores keyed by the name you wish to refer
  #           to the store by.
  #     storeName:
  #       type: The type of store (an object returned by Flux.createStore)
  #       options: Optional argument to pass to the store's initialize method
  #   actions:
  #     actionName: null
  # @return A flux context.
  createFlux = (options) ->
    # Create dispatcher
    dispatcher = Dispatcher.create()

    # Add actions
    dispatcher.addActions(options.actions)

    # Add stores
    addStores = (storeSpecs) ->
      stores = Object.keys(storeSpecs).reduce((memo, storeKey) ->
        storeSpec = storeSpecs[storeKey]
        waitFor = (storesToWaitFor) ->
          dispatcher.waitFor(storeKey, storesToWaitFor)
        memo[storeKey] = new storeSpec.type(waitFor, storeSpec.options)
        memo
      , {})
      dispatcher.addStores(stores)

    addStores(options.stores)

    # Define and return the flux context's public interface

    getStore: (storeKey) ->
      dispatcher.stores[storeKey]

    dispatch: (actionName, payload) ->
      dispatcher.dispatch(actionName, payload)

  # Return public interface for `Flux`
  createStore: createStore
  createFlux: createFlux
)()
