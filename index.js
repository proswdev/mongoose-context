'use strict';

var mongoose = require('mongoose');
var EventEmitter = require('events').EventEmitter;

// Setup contexter
var contexter = new EventEmitter();
contexter.mongoose = Mongoose;
contexter.model = model;
contexter.attach = attach;
module.exports = contexter;

function Mongoose(context) {
  // Create seperate mongoose instance
  var instance = new mongoose.Mongoose();
  // Overload createConnection method to add context
  var __createConnection = instance.createConnection;
  instance.createConnection = function(uri, options) {
    // Create actual connection and attach context to returned db
    var db = __createConnection.apply(this, arguments);
    return attach(context, db);
  };
  // Attach context to mongoose instance
  return attach(context, instance);
}

function model(context, db, name, schema, collection, skipInit) {
  var args,model;
  // Create model
  if (typeof db === 'string') {
    // Create model with default mongoose if no db specified
    args = Array.prototype.slice.call(arguments, 1);
    model = mongoose.model.apply(mongoose, args);
  } else {
    // Create model with specified db otherwise
    args = Array.prototype.slice.call(arguments, 2);
    model = db.model.apply(db, args);
  }
  // Attach context to created model
  return model ? attach(context, model) : model;
}

function attach(context, target) {

  // Ignore if not target specifed
  if (!target)
    return target;

  // Update existing context if target already contextualized
  if (target.hasOwnProperty('$setContext')) {
    target.$setContext(context);
    return target;
  }

  // Create closure for specified context
  var __context = context;

  // Overload constructor for Model functions
  var extTarget = target;
  if (typeof target === 'function') {
    extTarget = function () {
      // Invoke original constructor
      var inst = target.apply(this, arguments);
      // Instantiate results with context
      return instantiate(inst, __context);
    };
  }

  // Add $getContext method to return attached context
  extTarget.$getContext = function () {
    return __context;
  };

  // Add $setContext method to replace attached context
  extTarget.$setContext = function (context) {
    if (__context !== context) {
      __context = context;
      contexter.emit('contextChanged', extTarget);
    }
  };

  if (target instanceof mongoose.Mongoose || target instanceof mongoose.Connection) {
    // Overload model method for Mongoose instances and connections
    var __model = target.model;
    target.model = function() {
      // Invoke original model and attach context to returned result
      var model = __model.apply(this, arguments);
      return model ? attach(context, model) : model;
    }
  } else {
    // Overload properties and methods for models and queries to attach context
    // and associated methods on returned results
    var key;
    for (key in target) {
      if (typeof target[key] === 'function') {
        // Overload methods
        switch (key) {
          case 'create':
            // Overload returned promise to attach context on completion
            extTarget[key] = overloadPromise(key, extTarget);
            break;
          case 'exec':
          case 'geoNear':
          case 'geoSearch':
            // Overload returned promise to attach context on completion
            extTarget[key] = overloadPromise(key);
            break;
          case 'model':
            if (target instanceof mongoose.Query) {
              // Overload Query.model to attach context to returned model
              extTarget.model = attach(__context, target.model);
            } else {
              // Overload Model.model to attach context to returned model
              extTarget.model = function () {
                var __method = target.model;
                return function () {
                  var model = __method.apply(target, arguments);
                  return attach(__context, model);
                };
              }();
            }
            break;
          case 'populate':
            if (target instanceof mongoose.Query) {
              // Attach context to query returned by Query.populate
              extTarget.populate = overloadQuery(key);
            } else {
              // Overload promise returned by model.populate to attach context on completion
              extTarget.populate = overloadPromise(key);
            }
            break;
          case 'count':
          case 'distinct':
          case 'find':
          case 'findById':
          case 'findByIdAndRemove':
          case 'findByIdAndUpdate':
          case 'findOne':
          case 'findOneAndRemove':
          case 'findOneAndUpdate':
          case 'remove':
          case 'update':
            // Overload method to attach context to returned query
            extTarget[key] = overloadQuery(key);
            break;
          case '$where':
          case 'all':
          case 'and':
          case 'batchSize':
          case 'box':
          case 'cast':
          case 'center':
          case 'centerSphere':
          case 'circle':
          case 'collection':
          case 'comment':
          case 'elemMatch':
          case 'equals':
          case 'exists':
          case 'geometry':
          case 'gt':
          case 'gte':
          case 'hint':
          case 'in':
          case 'intersects':
          case 'lean':
          case 'limit':
          case 'lt':
          case 'lte':
          case 'maxDistance':
          case 'maxScan':
          case 'maxTime':
          case 'maxscan':
          case 'merge':
          case 'mod':
          case 'model':
          case 'ne':
          case 'near':
          case 'nearSphere':
          case 'nin':
          case 'nor':
          case 'or':
          case 'polygon':
          case 'read':
          case 'regex':
          case 'select':
          case 'setOptions':
          case 'size':
          case 'skip':
          case 'slaveOk':
          case 'slice':
          case 'snapshot':
          case 'sort':
          case 'tailable':
          case 'toConstructor':
          case 'where':
          case 'within':
            // Overload method to attach context to returned results
            extTarget[key] = function () {
              var __method = target[key];
              return function () {
                return attach(__context, __method.apply(target, arguments));
              }
            }();
            break;
          default:
            if (extTarget !== target) {
              // Reroute to invoke original method with original target
              extTarget[key] = function () {
                var __method = target[key];
                return function () {
                  return __method.apply(target, arguments);
                }
              }();
            }
            break;
        }
      } else if (extTarget !== target) {
        // Overload all properties with getter and setter methods to
        // to get/set properties on original target
        Object.defineProperty(extTarget, key, function () {
          var __key = key;
          return {
            get: function () {
              return target[__key];
            },
            set: function (val) {
              target[__key] = val;
            }
          };
        }());
      }
    }
  }

  // Model or Query contextualization completed
  contexter.emit('contextualized', extTarget);
  return extTarget;

  // Local functions
  function overloadPromise(method, self) {
    var __target = self || target;
    var __method = target[method];
    return function () {
      var i, cb, args = [];
      // Extract original callback (if any) from arguments
      for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          cb = arguments[i];
          break;
        } else {
          args.push(arguments[i]);
        }
      }
      // Insert custom callback and promise to attach context to returned results
      // before passing data on to original caller
      var __promise = new mongoose.Promise;
      args.push(function () {
        if (this)
          this.$getContext = extTarget.$getContext;
        addContext(arguments);
        if (cb)
          cb.apply(this, arguments);
        __promise.resolve.apply(__promise, arguments);
      });
      // Invoke original method
      __method.apply(__target, args);
      return __promise;
    }
  }

  function overloadQuery(method, callback) {
    var __method = target[method];
    return function () {
      var i, cb, args = [];
      // Extract original callback (if any) from arguments
      for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          cb = arguments[i];
          break;
        } else {
          args.push(arguments[i]);
        }
      }
      // Replace callback (if any) to attach context to results
      // before invoking original callback
      if (cb) {
        args.push(function () {
          if (this)
            this.$getContext = extTarget.$getContext;
          if (callback)
            callback.apply(this, arguments);
          else
            addContext(arguments);
          cb.apply(this, arguments);
        });
      }
      // Invoke original method
      var query = __method.apply(target, args);
      // Attach context to results if method returns a query
      if (query instanceof mongoose.Query)
        query = attach(__context, query);
      return query;
    }
  }

  function addContext(results) {
    // Instantiate any document instances in results
    for (var i = 1; i < results.length; i++) {
      if (Array.isArray(results[i])) {
        results[i].forEach(function (arg) {
          if (arg instanceof mongoose.Model)
            instantiate(arg, __context);
        })
      } else if (results[i] instanceof mongoose.Model) {
        instantiate(results[i], __context);
      }
    }
  }
}

function instantiate(inst, context) {
  var __context = null;
  if (inst.hasOwnProperty('$setContext')) {
    // Replace existing context
    inst.$setContext(context);
  } else {
    // Attach new context and associated methods
    __context = context;
    inst.$getContext = function () {
      return __context;
    };
    inst.$setContext = function (context) {
      if (__context !== context) {
        __context = context;
        contexter.emit('contextChanged', inst);
      }
    };
    // Overload model method to attach context to returned results
    if (typeof inst.model === 'function') {
      var __model = inst.model;
      inst.model = function () {
        return attach(__context, __model.apply(this, arguments));
      };
    }
    // Overload update method to attach context to returned results
    if (typeof inst.update === 'function') {
      var __update = inst.update;
      inst.update = function () {
        return attach(__context, __update.apply(this, arguments));
      }
    }
  }
  // Instantiate sub-documents
  inst.schema.eachPath(function (name, type) {
    if (type instanceof mongoose.Schema.Types.DocumentArray)
      inst[name].forEach(function (subdoc) {
        instantiate(subdoc, context);
      })
  });
  // Instanciation completed
  if (__context)
    contexter.emit('instantiated', inst);
  return inst;
}
