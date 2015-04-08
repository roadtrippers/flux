(function() {
  var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  window.Flux = (function() {

    /* Dispatcher */
    var Dispatcher, createFlux, createStore;
    Dispatcher = (function() {
      Dispatcher.create = function(options) {
        return new Dispatcher(options);
      };

      function Dispatcher() {
        this.waitFor = bind(this.waitFor, this);
        this._dispatchToStores = bind(this._dispatchToStores, this);
        this.dispatch = bind(this.dispatch, this);
        this.addStores = bind(this.addStores, this);
        this.addActions = bind(this.addActions, this);
        this.actions = {};
        this.stores = {};
      }

      Dispatcher.prototype.addActions = function(actions) {
        return this._addObjects(actions, this.actions, 'Action');
      };

      Dispatcher.prototype.addStores = function(stores) {
        return this._addObjects(stores, this.stores, 'Store');
      };

      Dispatcher.prototype._addObjects = function(source, target, objectTypeLabel) {
        return Object.keys(source).forEach(function(key) {
          if (target.hasOwnProperty(key)) {
            throw new Error(objectTypeLabel + " already added: " + key);
          }
          return target[key] = source[key];
        });
      };

      Dispatcher.prototype.dispatch = function(actionName, payload) {
        var storeKeys;
        if (!this.actions.hasOwnProperty(actionName)) {
          throw new Error("Error dispatching action. Action name not found: \"" + actionName + "\"");
        }
        if (this.dispatches) {
          throw new Error('Cannot dispatch during a dispatch.');
        }
        storeKeys = Object.keys(this.stores).filter((function(_this) {
          return function(storeKey) {
            return _this.stores[storeKey].actions[actionName];
          };
        })(this));
        if (!(storeKeys.length > 0)) {
          if (window.console && window.console.warn) {
            console.warn("No stores are listening to action: " + actionName);
          }
          return;
        }
        this.actionName = actionName;
        this.payload = payload;
        this.dispatches = storeKeys.map((function(_this) {
          return function(storeKey) {
            return {
              storeKey: storeKey,
              handler: _this.stores[storeKey].actions[actionName],
              waitingForStoreKeys: null,
              completed: false
            };
          };
        })(this));
        try {
          return this._dispatchToStores(this.dispatches);
        } finally {
          this.actionName = null;
          this.payload = null;
          this.dispatches = null;
        }
      };

      Dispatcher.prototype._dispatchToStores = function(dispatches) {
        return dispatches.forEach((function(_this) {
          return function(dispatch) {
            if (!dispatch.completed) {
              dispatch.handler.call(null, _this.payload);
              return dispatch.completed = true;
            }
          };
        })(this));
      };

      Dispatcher.prototype.waitFor = function(storeKey, waitingForStoreKeys) {
        var dispatch, waitingForStoreDispatches;
        if (!this.dispatches) {
          throw new Error("Cannot wait unless an action is being dispatched.");
        }
        if (waitingForStoreKeys.indexOf(storeKey) > -1) {
          throw new Error("A store cannot wait on itself.");
        }
        waitingForStoreKeys.forEach((function(_this) {
          return function(waitingForStoreKey) {
            if (!_this.stores[waitingForStoreKey]) {
              throw new Error(waitingForStoreKey + " store not found to wait for.");
            }
          };
        })(this));
        dispatch = _.find(this.dispatches, function(dispatch) {
          return dispatch.storeKey === storeKey;
        });
        if (dispatch.waitingForStoreKeys) {
          throw new Error(storeKey + " store is already waiting for stores.");
        }
        waitingForStoreDispatches = waitingForStoreKeys.reduce((function(_this) {
          return function(memo, waitingForStoreKey) {
            var waitingForDispatch;
            waitingForDispatch = _.find(_this.dispatches, function(dispatch) {
              return dispatch.storeKey === waitingForStoreKey;
            });
            if (waitingForDispatch) {
              if (waitingForDispatch.waitingForStoreKeys && waitingForDispatch.waitingForStoreKeys.indexOf(storeKey) > -1) {
                throw new Error("Circular wait detected between " + storeKey + " and " + waitingForStoreKey + " stores.");
              }
              memo.push(waitingForDispatch);
            }
            return memo;
          };
        })(this), []);
        dispatch.waitingForStoreKeys = waitingForStoreKeys;
        this._dispatchToStores(waitingForStoreDispatches);
        return waitingForStoreKeys.reduce((function(_this) {
          return function(memo, waitingForStoreKey) {
            memo[waitingForStoreKey] = _this.stores[waitingForStoreKey];
            return memo;
          };
        })(this), {});
      };

      return Dispatcher;

    })();
    createStore = function(spec) {
      var Store;
      return Store = (function() {
        _.extend(Store.prototype, Backbone.Events, spec);

        function Store(waitFor, options) {
          var methods, ref;
          methods = Object.keys(this);
          if (methods.length > 0) {
            _.bindAll.apply(null, [this].concat(Object.keys(this)));
          }
          this.actions = Object.keys(this.actions).reduce((function(_this) {
            return function(memo, action) {
              memo[action] = _this.actions[action].bind(_this);
              return memo;
            };
          })(this), {});
          this.waitFor = waitFor;
          if ((ref = this.initialize) != null) {
            ref.call(this, options);
          }
        }

        return Store;

      })();
    };
    createFlux = function(options) {
      var addStores, dispatcher;
      dispatcher = Dispatcher.create();
      dispatcher.addActions(options.actions);
      addStores = function(storeSpecs) {
        var stores;
        stores = Object.keys(storeSpecs).reduce(function(memo, storeKey) {
          var storeSpec, waitFor;
          storeSpec = storeSpecs[storeKey];
          waitFor = function(storesToWaitFor) {
            return dispatcher.waitFor(storeKey, storesToWaitFor);
          };
          memo[storeKey] = new storeSpec.type(waitFor, storeSpec.options);
          return memo;
        }, {});
        return dispatcher.addStores(stores);
      };
      addStores(options.stores);
      return {
        getStore: function(storeKey) {
          return dispatcher.stores[storeKey];
        },
        dispatch: function(actionName, payload) {
          return dispatcher.dispatch(actionName, payload);
        }
      };
    };
    return {
      createStore: createStore,
      createFlux: createFlux
    };
  })();

}).call(this);
