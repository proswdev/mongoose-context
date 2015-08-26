'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var mongooseContext = require('../index');
var TestData = require('./testdata');

describe('Middleware', function() {

  var conn,testData,Book1,Book2,logs;

  function logFilter(when, type) {
    var __when = when;
    var __type = type;
    return function(next) {
      logs.push({ when: when, type: type, context: typeof this.$getContext === 'function' ? this.$getContext() : null});
      if (typeof next === 'function')
        next();
    };
  }

  function setFilters(schema) {
    var types = ['init', 'validate', 'save', 'remove'];
    var whens = ['pre', 'post'];
    whens.forEach(function(when) {
      types.forEach(function(type) {
        schema[when](type, logFilter(when,type));
      });
    });
  }

  function checkFilters(context) {
    logs.length.should.be.above(0);
    logs.forEach(function(log) {
      if (log.context === null) {
        console.log('No context for ' + log.when + '("' + log.type + '")');
        should.exist(log.context);
      } else if (log.context !== context) {
        console.log('Wrong context for ' + log.when + '("' + log.type + '")');
        log.context.should.equal(context);
      }
    });
    logs = [];
  }

  before(function(done) {
    conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
    testData = new TestData();
    var schema = mongoose.Schema(testData.bookSchemaData);
    setFilters(schema);
    Book1 = conn.contextModel(testData.context1, 'Book', schema);
    Book2 = conn.contextModel(testData.context2, 'Book');
    done();
  });

  beforeEach(function() {
    logs = [];
  });

  it ('should be able to access context in middleware during create()', function(done) {
    async.waterfall([
      function(next) {
        Book1.create(testData.bookData,next)
      },
      function(book,next) {
        checkFilters(testData.context1);
        Book2.create(testData.bookData2,next)
      },
      function(book,next) {
        checkFilters(testData.context2);
        next();
      }
    ], done);
  });

  it ('should be able to access context in middleware during find() using callbacks', function(done) {
    async.waterfall([
      function(next) {
        Book1.remove(function() { next(); });
      },
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData2, cb); },
          function(cb) { Book2.create(testData.bookData3, cb); },
        ], function() { next(); });
      },
      function(next) {
        logs = [];
        Book1.find(function() { next(); });
      },
      function(next) {
        checkFilters(testData.context1);
        Book2.find(function() { next(); });
      },
      function(next) {
        checkFilters(testData.context2);
        next();
      }
    ], done);
  });

  it ('should be able to access context in middleware during find() through Query.exec()', function(done) {
    async.waterfall([
      function(next) {
        Book1.remove(function() { next(); });
      },
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData2, cb); },
          function(cb) { Book2.create(testData.bookData3, cb); },
        ], function() { next(); });
      },
      function(next) {
        logs = [];
        Book1.find().exec(function() { next(); });
      },
      function(next) {
        checkFilters(testData.context1);
        Book2.find().exec(function() { next(); });
      },
      function(next) {
        checkFilters(testData.context2);
        next();
      }
    ], done);
  });

  it ('should be able to access context in middleware during save()', function(done) {
    async.waterfall([
      function(next) {
        var book = new Book1(testData.bookData);
        book.save(next);
      },
      function(book,count,next) {
        checkFilters(testData.context1);
        book = new Book2(testData.bookData);
        book.save(next);
      },
      function(book,count,next) {
        checkFilters(testData.context2);
        next();
      }
    ], done);
  });

  it ('should be able to access context in middleware during remove()', function(done) {
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData2, cb); },
          function(cb) { Book1.create(testData.bookData3, cb); }
        ], next);
      },
      function(results, next) {
        logs = [];
        async.parallel([
          function(cb) { results[0].remove(cb); },
          function(cb) { results[1].remove(cb); },
          function(cb) { results[2].remove(cb); }
        ], function() { next(); });
      },
      function(next) {
        checkFilters(testData.context1);
        next();
      }
    ], done);
  });

  after(function(done) {
    conn.close(done);
  });

})

