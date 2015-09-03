'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var contexter = require('../index');
var TestData = require('./testdata');

describe('Subdocuments', function () {

  var conn, testData, Book1, Lib2, Lib3;

  before(function (done) {
    conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
    testData = new TestData();
    Book1 = contexter.model(testData.context1, conn, 'Book', testData.bookSchema);
    Lib2 = contexter.model(testData.context2, conn, 'Lib', testData.libSchema);
    Lib3 = contexter.model(testData.context3, conn, 'Lib');
    async.parallel([
      function (cb) {
        Book1.remove(cb);
      },
      function (cb) {
        Lib2.remove(cb);
      }
    ], done);
  });

  it('should be able to create subdocs with context using Model constructor', function (done) {
    var lib = new Lib2(testData.libData);
    lib.should.have.property('$getContext');
    lib.$getContext().should.equal(testData.context2);
    lib.books.length.should.equal(3);
    lib.books.forEach(function (book) {
      book.should.have.property('$getContext');
      book.$getContext().should.equal(testData.context2);
    });
    done();
  });

  it('should be able to create subdocs with context using Model.create()', function (done) {
    async.waterfall([
      function (next) {
        Lib3.create(testData.libData, next);
      },
      function (lib, next) {
        lib.should.have.property('$getContext');
        lib.$getContext().should.equal(testData.context3);
        lib.books.length.should.equal(3);
        lib.books.forEach(function (book) {
          book.should.have.property('$getContext');
          book.$getContext().should.equal(testData.context3);
        });
        next();
      }
    ], done);
  });

  it('should be able to retrieve subdocs with context', function (done) {
    async.waterfall([
      function (next) {
        Lib3.create(testData.libData, next);
      },
      function (lib, next) {
        Lib2.find({_id: lib._id}, next);
      },
      function (libs, next) {
        libs.forEach(function (lib) {
          lib.$getContext().should.equal(testData.context2);
          lib.should.have.property('$getContext');
          lib.books.length.should.equal(3);
          lib.books.forEach(function (book) {
            book.should.have.property('$getContext');
            book.$getContext().should.equal(testData.context2);
          });
        })
        next();
      }
    ], done);
  });

  after(function (done) {
    conn.close(done);
  });

});

