'use strict';

var mongoose = require('mongoose');
var EventEmitter = require('events').EventEmitter;
var contextEvents = new EventEmitter();
module.exports = contextEvents;

function contextualize(target, context) {

  if (!target)
    return target;

  if (target.hasOwnProperty('$setContext')) {
    target.$setContext(context);
    return target;
  }

  var __context = context;

  var extTarget = target;
  if (typeof target === 'function') {
    extTarget = function () {
      var inst = target.apply(this, arguments);
      return instantiate(inst, __context);
    };
  }

  extTarget.$getContext = function () {
    return __context;
  };

  extTarget.$setContext = function (context) {
    if (__context !== context) {
      __context = context;
      contextEvents.emit('contextChanged', extTarget);
    }
  };

  var key;
  for (key in target) {
    if (typeof target[key] === 'function') {
      switch (key) {
        case 'create':
          extTarget[key] = overloadPromise(key, extTarget);
          break;
        case 'exec':
        case 'geoNear':
        case 'geoSearch':
          extTarget[key] = overloadPromise(key);
          break;
        case 'model':
          if (target instanceof mongoose.Query) {
            extTarget.model = contextualize(target.model, __context);
          } else {
            extTarget.model = function () {
              var __method = target.model;
              return function () {
                var model = __method.apply(target, arguments);
                return contextualize(model, __context);
              };
            }();
          }
          break;
        case 'populate':
          if (target instanceof mongoose.Query)
            extTarget.populate = overloadQuery(key);
          else
            extTarget.populate = overloadPromise(key);
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
          extTarget[key] = function () {
            var __method = target[key];
            return function () {
              return contextualize(__method.apply(target, arguments), __context);
            }
          }();
          break;
        default:
          if (extTarget !== target) {
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

  contextEvents.emit('contextualized', extTarget);

  return extTarget;

  function overloadPromise(method, self) {
    var __target = self || target;
    var __method = target[method];
    return function () {
      var i, cb, args = [];
      for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          cb = arguments[i];
          break;
        } else {
          args.push(arguments[i]);
        }
      }
      var __promise = new mongoose.Promise;
      args.push(function () {
        if (this)
          this.$getContext = extTarget.$getContext;
        addContext(arguments);
        if (cb)
          cb.apply(this, arguments);
        __promise.resolve.apply(__promise, arguments);
      });
      __method.apply(__target, args);
      return __promise;
    }
  }

  function overloadQuery(method, callback) {
    var __method = target[method];
    return function () {
      var i, cb, args = [];
      for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') {
          cb = arguments[i];
          break;
        } else {
          args.push(arguments[i]);
        }
      }
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
      var query = __method.apply(target, args);
      if (query instanceof mongoose.Query)
        query = contextualize(query, __context);
      return query;
    }
  }

  function addContext(results) {
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
    inst.$setContext(context);
  } else {
    __context = context;
    inst.$getContext = function () {
      return __context;
    };
    inst.$setContext = function (context) {
      if (__context !== context) {
        __context = context;
        contextEvents.emit('contextChanged', inst);
      }
    };
    if (typeof inst.model === 'function') {
      var __model = inst.model;
      inst.model = function () {
        return contextualize(__model.apply(this, arguments), __context);
      };
    }
    if (typeof inst.update === 'function') {
      var __update = inst.update;
      inst.update = function () {
        return contextualize(__update.apply(this, arguments), __context);
      }
    }
  }
  inst.schema.eachPath(function (name, type) {
    if (type instanceof mongoose.Schema.Types.DocumentArray)
      inst[name].forEach(function (subdoc) {
        instantiate(subdoc, context);
      })
  });
  if (__context)
    contextEvents.emit('instantiated', inst);
  return inst;
}

var contextModel = function (context) {
  var args = Array.prototype.slice.call(arguments, 1);
  var model = this.model.apply(this, args);
  return contextualize(model, context);
};

mongoose.contextModel = contextModel.bind(mongoose);

var createConnection = mongoose.createConnection;
mongoose.createConnection = function () {
  var conn = createConnection.apply(mongoose, arguments);
  conn.contextModel = contextModel.bind(conn);
  return conn;
};

