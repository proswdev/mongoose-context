'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var mongooseContext = require('../index');
var TestData = require('./testdata');

describe('Mongoose', function() {

  var testData = new TestData();

  describe('Using default connection', function() {

    before(function(done){
      mongoose.connect('mongodb://localhost:27017/mongoose-context-test');
      done();
    });

    it ('should be able to create normal model without context', function(done) {
      var Book = mongoose.model('Book', testData.bookSchema);
      Book.should.not.have.property('$getContext');
      Book.create(testData.bookData, function(err,book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to create model with context', function(done) {
      var Book1 = mongoose.contextModel(testData.context1, 'Book', testData.bookSchema);
      var Book2 = mongoose.contextModel(testData.context2, 'Book');
      var User1 = mongoose.contextModel(testData.context1, 'User', testData.userSchema);
      var User2 = mongoose.contextModel(testData.context3, 'User');
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(testData.context1);
      Book2.should.have.property('$getContext');
      Book2.$getContext().should.equal(testData.context2);
      User1.should.have.property('$getContext');
      User1.$getContext().should.equal(testData.context1);
      User2.should.have.property('$getContext');
      User2.$getContext().should.equal(testData.context3);
      done();
    });

    after(function(done) {
      mongoose.disconnect(done);
    });

  });

  describe('Using custom connection', function() {

    var conn;

    before(function(done){
      conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
      done();
    });

    it ('should be able to create normal model without context', function(done) {
      var Book = conn.model('Book', testData.bookSchema);
      Book.should.not.have.property('context');
      Book.create(testData.bookData, function(err,book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to create model with context', function(done) {
      var Book1 = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
      var Book2 = conn.contextModel(testData.context2, 'Book');
      var User1 = conn.contextModel(testData.context1, 'User', testData.userSchema);
      var User2 = conn.contextModel(testData.context3, 'User');
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(testData.context1);
      Book2.should.have.property('$getContext');
      Book2.$getContext().should.equal(testData.context2);
      User1.should.have.property('$getContext');
      User1.$getContext().should.equal(testData.context1);
      User2.should.have.property('$getContext');
      User2.$getContext().should.equal(testData.context3);
      done();
    });

    after(function(done) {
      conn.close(done);
    });

  });

});
