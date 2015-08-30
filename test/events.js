'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var mongooseContext = require('../index');
var TestData = require('./testdata');

describe('Events', function () {

  var conn, testData;

  before(function (done) {
    conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
    testData = new TestData();
    done();
  });

  var objects = [];

  function logEvent(obj) {
    objects.push(obj);
  };

  it('should emit contextualized events for new models and queryies', function (done) {
    var Book1, Book2;
    async.waterfall([
      function (next) {
        objects = [];
        mongooseContext.on('contextualized', logEvent);
        Book1 = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
        Book1.find(function () {
          next();
        });
      },
      function (next) {
        objects.length.should.be.above(0);
        var queries = 0;
        objects.forEach(function (obj) {
          obj.should.have.property('$getContext');
          obj.$getContext().should.equal(testData.context1);
          if (obj instanceof mongoose.Query)
            queries++;
        });
        queries.should.be.within(1, objects.length - 1);
        next();
      },
      function (next) {
        objects = [];
        Book2 = conn.contextModel(testData.context2, 'Book', testData.bookSchema);
        Book2.find(function () {
          next();
        });
      },
      function (next) {
        objects.length.should.be.above(0);
        var queries = 0;
        objects.forEach(function (obj) {
          obj.should.have.property('$getContext');
          obj.$getContext().should.equal(testData.context2);
          if (obj instanceof mongoose.Query)
            queries++;
        });
        queries.should.be.within(1, objects.length - 1);
        mongooseContext.removeListener('contextualized', logEvent);
        next();
      }
    ], done);
  });

  it('should emit instantiated events for new documents', function (done) {
    var Book1, Book2;
    async.waterfall([
      function (next) {
        objects = [];
        mongooseContext.on('instantiated', logEvent);
        Book1 = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
        Book2 = conn.contextModel(testData.context1, 'Book');
        objects.length.should.equal(0);
        var book1 = new Book1(testData.bookData);
        objects.length.should.equal(1);
        objects[0].should.have.property('$getContext');
        objects[0].$getContext().should.equal(testData.context1);
        Book1.remove(function () {
          next();
        });
      },
      function (next) {
        objects = [];
        async.parallel([
          function (cb) {
            Book1.create(testData.bookData2, cb)
          },
          function (cb) {
            Book1.create(testData.bookData3, cb)
          }
        ], next);
      },
      function (results, next) {
        objects.length.should.be.equal(2);
        objects.forEach(function (obj) {
          obj.should.be.instanceof(mongoose.Model);
          obj.should.have.property('$getContext');
          obj.$getContext().should.equal(testData.context1);
        });
        objects = [];
        Book1.find(next);
      },
      function (results, next) {
        results.length.should.be.above(0);
        results.length.should.equal(objects.length);
        objects.forEach(function (obj) {
          obj.should.be.instanceof(mongoose.Model);
          obj.should.have.property('$getContext');
          obj.$getContext().should.equal(testData.context1);
        });
        mongooseContext.removeListener('instantiated', logEvent);
        next();
      }
    ], done);
  });

  it('should emit contextChanged events for context changes', function (done) {
    objects = [];
    mongooseContext.on('contextChanged', logEvent);
    var BookX = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
    objects.length.should.equal(0);
    var bookX = new BookX(testData.bookData);
    objects.length.should.equal(0);
    BookX.$setContext(testData.context1);
    objects.length.should.equal(0);
    BookX.$setContext(testData.context2);
    objects.length.should.equal(1);
    objects[0].should.have.property('$getContext');
    objects[0].$getContext().should.equal(testData.context2);
    objects = [];
    bookX.$setContext(testData.context1)
    objects.length.should.equal(0);
    bookX.$setContext(testData.context3)
    objects.length.should.equal(1);
    objects[0].should.have.property('$getContext');
    objects[0].$getContext().should.equal(testData.context3);
    done();
  });

  after(function (done) {
    conn.close(done);
  });

});
