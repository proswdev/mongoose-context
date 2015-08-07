'use strict';

var mongoose = require('mongoose');

function contextualize(target, context) {

    var getContext;
    if (typeof context === 'function') {
        getContext = context;
    } else {
        getContext = function() {
            var __context = context;
            return function() {
                return __context;
            }
        }();
    }

    if (target.hasOwnProperty('$getContext')) {
        target.$getContext = getContext;
        return target;
    }

    var extTarget = target;
    if (typeof target === 'function') {
        extTarget = function() {
            var inst = target.apply(this, arguments);
            return instantiate(inst, getContext);
        };
    }
    extTarget.$getContext = getContext;

    var key;
    for (key in target) {
        if (typeof target[key] === 'function') {
            switch(key) {
                case 'create':
                case 'exec':
                case 'geoNear':
                case 'geoSearch':
                case 'populate':
                    extTarget[key] = overloadPromise(key);
                    break;
                case 'model':
                    if (target instanceof mongoose.Query) {
                        extTarget.model = contextualize(target.model, getContext);
                    } else {
                        extTarget.model = function() {
                            var __method = target.model;
                            return function() {
                                var model = __method.apply(target, arguments);
                                return contextualize(model, getContext);
                            };
                        }();
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
                case 'populate':
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
                    extTarget[key] = function() {
                        var __method = target[key];
                        return function() {
                            return contextualize(__method.apply(target, arguments), getContext);
                        }
                    }();
                    break;
                default:
                    if (extTarget !== target) {
                        extTarget[key] = function() {
                            var __method = target[key];
                            return function() {
                                return __method.apply(target, arguments);
                            }
                        }();
                    }
                    break;
            }
        } else if (extTarget !== target) {
            Object.defineProperty(extTarget, key, function() {
                var __key = key;
                return {
                    get: function() { return target[__key]; },
                    set: function(val) { target[__key] = val; }
                };
            }());
        }
    }
    return extTarget;

    function overloadPromise(method, callback) {
        var __method = target[method];
        return function() {
            var i,cb,promise,args = [];
            for (i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] === 'function') {
                    cb = arguments[i];
                    break;
                } else {
                    args.push(arguments[i]);
                }
            }
            promise = new mongoose.Promise;
            args.push(function() {
                var __promise = promise;
                return function() {
                    this.$getContext = getContext;
                    if (callback)
                        callback.apply(this, arguments);
                    else
                        addContext(arguments);
                    if (cb)
                        cb.apply(this, arguments);
                    __promise.resolve.apply(__promise, arguments);
                };
            }());
            __method.apply(target, args);
            return promise;
        }
    }

    function overloadQuery(method, callback) {
        var __method = target[method];
        return function() {
            var i,cb,args = [];
            for (i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] === 'function') {
                    cb = arguments[i];
                    break;
                } else {
                    args.push(arguments[i]);
                }
            }
            if (cb) {
                args.push(function() {
                    this.$getContext = getContext;
                    if (callback)
                        callback.apply(this, arguments);
                    else
                        addContext(arguments);
                    cb.apply(this, arguments);
                });
            }
            var query = __method.apply(target, args);
            if (query instanceof mongoose.Query)
                query = contextualize(query, getContext);
            return query;
        }
    }

    function addContext(results) {
        for (var i = 1; i < results.length; i++) {
            if (Array.isArray(results[i])) {
                results[i].forEach(function(arg) {
                    if (arg instanceof mongoose.Model)
                        instantiate(arg, getContext);
                })
            } else if (results[i] instanceof mongoose.Model) {
                instantiate(results[i], getContext);
            }
        }
    }
}

function instantiate(inst, context) {
    inst.$getContext = context;
    inst.model = function(){
        var __model = inst.model;
        return function() {
            return contextualize(__model.apply(this,arguments), context);
        }
    }();
    inst.update = function() {
        var __update = inst.update;
        return function() {
            return contextualize(__update.apply(this,arguments), context);
        }
    }();
    return inst;
}

var contextModel = function(context) {
    var args = Array.prototype.slice.call(arguments, 1);
    var model = this.model.apply(this, args);
    return contextualize(model, context, true);
};

mongoose.contextModel = contextModel.bind(mongoose);

var createConnection = mongoose.createConnection;
mongoose.createConnection = function() {
    var conn = createConnection.apply(mongoose, arguments);
    conn.contextModel = contextModel.bind(conn);
    return conn;
};

