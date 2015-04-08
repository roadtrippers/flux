#= require flux

describe 'Flux', ->

  describe '.createStore', ->

    beforeEach ->
      @spec =
        initialize: ->
        actions:
          action1: ->
        helper: ->
      @Store = Flux.createStore(@spec)

    it 'should create a store class based on the specified spec', ->
      expect(@Store.prototype).toEqual(jasmine.objectContaining(@spec))

  describe '.createFlux', ->

    beforeEach ->
      @initialize = jasmine.createSpy('initialize')
      @Store = Flux.createStore
        initialize: @initialize
        actions:
          action: ->
      @options = {}
      @flux = Flux.createFlux
        actions:
          action: null
        stores:
          store:
            type: @Store
            options: @options
      @store = @flux.getStore('store')

    it 'should create a flux context', ->
      expect(@initialize.calls.count()).toBe(1)
      expect(@initialize).toHaveBeenCalledWith(@options)
      expect(@Store.prototype.isPrototypeOf(@store)).toBeTruthy()
      expect(@store.waitFor).toBeDefined()
      expect(@flux.getStore).toBeDefined()
      expect(@flux.dispatch).toBeDefined()

  describe '#getStore', ->

    beforeEach ->
      @Store = Flux.createStore
        initialize: ->
        actions: {}
      @flux = Flux.createFlux
        actions: {}
        stores:
          store:
            type: @Store

    describe 'when passed a valid store key', ->

      beforeEach ->
        @store = @flux.getStore('store')

      it 'should return the store', ->
        expect(@Store.prototype.isPrototypeOf(@store)).toBeTruthy()
        expect(@store.waitFor).toBeDefined()

    describe 'when passed an invalid store key', ->

      beforeEach ->
        @result = @flux.getStore('nonExistentStore')

      it 'should return the store', ->
        expect(@result).toBeUndefined()

  describe '#dispatch', ->

    describe 'with simple action handlers', ->

      beforeEach ->
        @payload = {}
        @store1Action1Handler = jasmine.createSpy('store1Action1Handler')
        @store2Action1Handler = jasmine.createSpy('store2Action1Handler')
        Store1 = Flux.createStore
          actions:
            action1: @store1Action1Handler
        Store2 = Flux.createStore
          actions:
            action1: @store2Action1Handler
        flux = Flux.createFlux
          actions:
            action1: null
          stores:
            store1:
              type: Store1
            store2:
              type: Store2
        flux.dispatch('action1', @payload)

      it 'should trigger action handlers', ->
        expect(@store1Action1Handler.calls.count()).toEqual(1)
        expect(@store1Action1Handler).toHaveBeenCalledWith(@payload)
        expect(@store2Action1Handler.calls.count()).toEqual(1)
        expect(@store2Action1Handler).toHaveBeenCalledWith(@payload)

    describe 'using waitFor', ->

      beforeEach ->
        actionProcessed = jasmine.createSpy('actionProcessed')
        @actionProcessed = actionProcessed
        Store1 = Flux.createStore
          actions:
            action: ->
              stores = @waitFor(['store2'])
              actionProcessed(this, stores.store2)
        Store2 = Flux.createStore
          actions:
            action: ->
              actionProcessed(this)
        flux = Flux.createFlux
          actions:
            action: null
          stores:
            store1:
              type: Store1
            store2:
              type: Store2

        @store1 = flux.getStore('store1')
        @store2 = flux.getStore('store2')

        flux.dispatch('action', @payload)

      it 'should dispatch to stores in the expected order', ->
        expect(@actionProcessed.calls.allArgs()).toEqual([[@store2], [@store1, @store2]])

    describe "dispatching an action that doesn't exist", ->

      beforeEach ->
        flux = Flux.createFlux
          actions: {}
          stores: {}
        @run = ->
          flux.dispatch('aNonExistentAction')

      it 'should throw an error', ->
        expect(@run).toThrow()

    describe 'trying to dispatch during a dispatch', ->

      beforeEach ->
        Store = Flux.createStore
          actions:
            action: ->
              # This should throw an error.
              flux.dispatch('action')
        flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store:
              type: Store
        @run = ->
          flux.dispatch('action')

      it 'should throw an error', ->
        expect(@run).toThrow()

    describe 'dispatching an action that no store is listening to', ->

      beforeEach ->
        Store = Flux.createStore
          actions: {}
        @flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store:
              type: Store
        spyOn(window.console, 'warn')

      it 'should output a warning', ->
        @flux.dispatch('action')
        expect(window.console.warn.calls.count()).toEqual(1)

    describe 'when a store waits on itself', ->

      beforeEach ->
        Store = Flux.createStore
          actions:
            action: ->
              # This should throw an error
              @waitFor(['store'])
        flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store:
              type: Store
        @run = ->
          flux.dispatch('action')

      it 'should throw an error', ->
        expect(@run).toThrow()

    describe 'when a store calls waitFor more than once during a dispatch', ->

      beforeEach ->
        Store1 = Flux.createStore
          actions:
            action: ->
              @waitFor(['store2'])
              # This should throw an error
              @waitFor(['store2'])
        Store2 = Flux.createStore
          actions:
            action: ->
        flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store1:
              type: Store1
            store2:
              type: Store2
        @run = ->
          flux.dispatch('action')

      it 'should throw an error', ->
        expect(@run).toThrow()

    describe "when a store requests to wait for a store that doesn't exist", ->

      beforeEach ->
        Store = Flux.createStore
          actions:
            action: ->
              # This should throw an error
              @waitFor(['aNonExistentStore'])
        flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store:
              type: Store
        @run = ->
          flux.dispatch('action')

      it 'should throw an error', ->
        expect(@run).toThrow()

    describe 'when there is a circular wait for between stores', ->

      beforeEach ->
        Store1 = Flux.createStore
          actions:
            action: ->
              # One side of the circular reference
              @waitFor(['store2'])
        Store2 = Flux.createStore
          actions:
            action: ->
              # The other side of the circular reference
              @waitFor(['store1'])
        flux = Flux.createFlux
          actions:
            action: 'action'
          stores:
            store1:
              type: Store1
            store2:
              type: Store2
        @run = ->
          flux.dispatch('action')

      it 'should throw an error', ->
        expect(@run).toThrow()
