'use strict';

var should = require('should');
var mongoose = require('mongoose');
var contexter = require('../index');
var TestData = require('./testdata');

describe('Mongoose', function () {

  var testData = new TestData();

  describe('Using default connection', function () {

    before(function (done) {
      mongoose.connect('mongodb://localhost:27017/mongoose-context-test');
      done();
    });

    it('should be able to create normal model without context', function (done) {
      var Book = mongoose.model('Book', testData.bookSchema);
      Book.should.not.have.property('$getContext');
      Book.create(testData.bookData, function (err, book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to attach context to mongoose instance', function(done) {
      var instance = contexter.mongoose(testData.context1);
      instance.should.have.property('$getContext');
      instance.$getContext().should.equal(testData.context1);
      var Book1 = instance.model('Book', testData.bookSchema);
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(testData.context1);
      Book1.$setContext(testData.context2);
      instance.$getContext().should.equal(testData.context1);
      Book1.$getContext().should.equal(testData.context2);
      done();
    });

    it('should be able to create model with context', function (done) {
      var Book = mongoose.model('Book', testData.bookSchema);
      var Book1 = contexter.attach(testData.context1, Book);
      var Book2 = contexter.model(testData.context2, 'Book');
      var User1 = contexter.model(testData.context1, 'User', testData.userSchema);
      var User =  mongoose.model('User');
      var User2 = contexter.attach(testData.context3, User);
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

    after(function (done) {
      mongoose.disconnect(done);
    });

  });

  describe('Using custom connection', function () {

    var conn;

    before(function (done) {
      conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
      done();
    });

    it('should be able to create normal model without context', function (done) {
      var Book = conn.model('Book', testData.bookSchema);
      Book.should.not.have.property('$getContext');
      Book.create(testData.bookData, function (err, book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to attach context to mongoose instance', function(done) {
      var instance = contexter.mongoose(testData.context1);
      instance.should.have.property('$getContext');
      instance.$getContext().should.equal(testData.context1);
      var conn = instance.createConnection('mongodb://localhost:27017/mongoose-context-test');
      var Book1 = conn.model('Book', testData.bookSchema);
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(testData.context1);
      Book1.$setContext(testData.context2);
      instance.$getContext().should.equal(testData.context1);
      Book1.$getContext().should.equal(testData.context2);
      conn.close(done);
    });

    it('should be able to create model with context', function (done) {
      var Book = conn.model('Book', testData.bookSchema);
      var Book1 = contexter.attach(testData.context1, Book);
      var Book2 = contexter.model(testData.context2, conn, 'Book');
      var User1 = contexter.model(testData.context1, conn, 'User', testData.userSchema);
      var User =  conn.model('User');
      var User2 = contexter.attach(testData.context3, User);
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

    after(function (done) {
      conn.close(done);
    });

  });

});
