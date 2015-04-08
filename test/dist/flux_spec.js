(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
describe('Flux', function() {
  describe('.createStore', function() {
    beforeEach(function() {
      this.spec = {
        initialize: function() {},
        actions: {
          action1: function() {}
        },
        helper: function() {}
      };
      return this.Store = Flux.createStore(this.spec);
    });
    return it('should create a store class based on the specified spec', function() {
      return expect(this.Store.prototype).toEqual(jasmine.objectContaining(this.spec));
    });
  });
  describe('.createFlux', function() {
    beforeEach(function() {
      this.initialize = jasmine.createSpy('initialize');
      this.Store = Flux.createStore({
        initialize: this.initialize,
        actions: {
          action: function() {}
        }
      });
      this.options = {};
      this.flux = Flux.createFlux({
        actions: {
          action: null
        },
        stores: {
          store: {
            type: this.Store,
            options: this.options
          }
        }
      });
      return this.store = this.flux.getStore('store');
    });
    return it('should create a flux context', function() {
      expect(this.initialize.calls.count()).toBe(1);
      expect(this.initialize).toHaveBeenCalledWith(this.options);
      expect(this.Store.prototype.isPrototypeOf(this.store)).toBeTruthy();
      expect(this.store.waitFor).toBeDefined();
      expect(this.flux.getStore).toBeDefined();
      return expect(this.flux.dispatch).toBeDefined();
    });
  });
  describe('#getStore', function() {
    beforeEach(function() {
      this.Store = Flux.createStore({
        initialize: function() {},
        actions: {}
      });
      return this.flux = Flux.createFlux({
        actions: {},
        stores: {
          store: {
            type: this.Store
          }
        }
      });
    });
    describe('when passed a valid store key', function() {
      beforeEach(function() {
        return this.store = this.flux.getStore('store');
      });
      return it('should return the store', function() {
        expect(this.Store.prototype.isPrototypeOf(this.store)).toBeTruthy();
        return expect(this.store.waitFor).toBeDefined();
      });
    });
    return describe('when passed an invalid store key', function() {
      beforeEach(function() {
        return this.result = this.flux.getStore('nonExistentStore');
      });
      return it('should return the store', function() {
        return expect(this.result).toBeUndefined();
      });
    });
  });
  return describe('#dispatch', function() {
    describe('with simple action handlers', function() {
      beforeEach(function() {
        var Store1, Store2, flux;
        this.payload = {};
        this.store1Action1Handler = jasmine.createSpy('store1Action1Handler');
        this.store2Action1Handler = jasmine.createSpy('store2Action1Handler');
        Store1 = Flux.createStore({
          actions: {
            action1: this.store1Action1Handler
          }
        });
        Store2 = Flux.createStore({
          actions: {
            action1: this.store2Action1Handler
          }
        });
        flux = Flux.createFlux({
          actions: {
            action1: null
          },
          stores: {
            store1: {
              type: Store1
            },
            store2: {
              type: Store2
            }
          }
        });
        return flux.dispatch('action1', this.payload);
      });
      return it('should trigger action handlers', function() {
        expect(this.store1Action1Handler.calls.count()).toEqual(1);
        expect(this.store1Action1Handler).toHaveBeenCalledWith(this.payload);
        expect(this.store2Action1Handler.calls.count()).toEqual(1);
        return expect(this.store2Action1Handler).toHaveBeenCalledWith(this.payload);
      });
    });
    describe('using waitFor', function() {
      beforeEach(function() {
        var Store1, Store2, actionProcessed, flux;
        actionProcessed = jasmine.createSpy('actionProcessed');
        this.actionProcessed = actionProcessed;
        Store1 = Flux.createStore({
          actions: {
            action: function() {
              var stores;
              stores = this.waitFor(['store2']);
              return actionProcessed(this, stores.store2);
            }
          }
        });
        Store2 = Flux.createStore({
          actions: {
            action: function() {
              return actionProcessed(this);
            }
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: null
          },
          stores: {
            store1: {
              type: Store1
            },
            store2: {
              type: Store2
            }
          }
        });
        this.store1 = flux.getStore('store1');
        this.store2 = flux.getStore('store2');
        return flux.dispatch('action', this.payload);
      });
      return it('should dispatch to stores in the expected order', function() {
        return expect(this.actionProcessed.calls.allArgs()).toEqual([[this.store2], [this.store1, this.store2]]);
      });
    });
    describe("dispatching an action that doesn't exist", function() {
      beforeEach(function() {
        var flux;
        flux = Flux.createFlux({
          actions: {},
          stores: {}
        });
        return this.run = function() {
          return flux.dispatch('aNonExistentAction');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
    describe('trying to dispatch during a dispatch', function() {
      beforeEach(function() {
        var Store, flux;
        Store = Flux.createStore({
          actions: {
            action: function() {
              return flux.dispatch('action');
            }
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store: {
              type: Store
            }
          }
        });
        return this.run = function() {
          return flux.dispatch('action');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
    describe('dispatching an action that no store is listening to', function() {
      beforeEach(function() {
        var Store;
        Store = Flux.createStore({
          actions: {}
        });
        this.flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store: {
              type: Store
            }
          }
        });
        return spyOn(window.console, 'warn');
      });
      return it('should output a warning', function() {
        this.flux.dispatch('action');
        return expect(window.console.warn.calls.count()).toEqual(1);
      });
    });
    describe('when a store waits on itself', function() {
      beforeEach(function() {
        var Store, flux;
        Store = Flux.createStore({
          actions: {
            action: function() {
              return this.waitFor(['store']);
            }
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store: {
              type: Store
            }
          }
        });
        return this.run = function() {
          return flux.dispatch('action');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
    describe('when a store calls waitFor more than once during a dispatch', function() {
      beforeEach(function() {
        var Store1, Store2, flux;
        Store1 = Flux.createStore({
          actions: {
            action: function() {
              this.waitFor(['store2']);
              return this.waitFor(['store2']);
            }
          }
        });
        Store2 = Flux.createStore({
          actions: {
            action: function() {}
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store1: {
              type: Store1
            },
            store2: {
              type: Store2
            }
          }
        });
        return this.run = function() {
          return flux.dispatch('action');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
    describe("when a store requests to wait for a store that doesn't exist", function() {
      beforeEach(function() {
        var Store, flux;
        Store = Flux.createStore({
          actions: {
            action: function() {
              return this.waitFor(['aNonExistentStore']);
            }
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store: {
              type: Store
            }
          }
        });
        return this.run = function() {
          return flux.dispatch('action');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
    return describe('when there is a circular wait for between stores', function() {
      beforeEach(function() {
        var Store1, Store2, flux;
        Store1 = Flux.createStore({
          actions: {
            action: function() {
              return this.waitFor(['store2']);
            }
          }
        });
        Store2 = Flux.createStore({
          actions: {
            action: function() {
              return this.waitFor(['store1']);
            }
          }
        });
        flux = Flux.createFlux({
          actions: {
            action: 'action'
          },
          stores: {
            store1: {
              type: Store1
            },
            store2: {
              type: Store2
            }
          }
        });
        return this.run = function() {
          return flux.dispatch('action');
        };
      });
      return it('should throw an error', function() {
        return expect(this.run).toThrow();
      });
    });
  });
});



},{}]},{},[1]);
