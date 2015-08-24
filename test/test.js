'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var semver = require('semver');
require('../index');

describe('mongoose-context', function() {

  var bookSchemaData = {
    title: String,
    content: String,
    sales: Number,
    profit: Number,
    reviews: String,
    remarks: String
  };
  var bookSchema = mongoose.Schema(bookSchemaData);
  var userSchema = mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String
  });
  var readerSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    rating: Number
  });
  var libSchema = mongoose.Schema({
    name: String,
    address: String,
    books: [bookSchema]
  });
  var bookData = {
    title: 'Book title',
    content: 'Book content',
    sales: 10,
    profit: 100,
    reviews: 'Book reviews',
    remarks: 'Book remarks'
  };
  var bookData2 = {
    title: 'Book title2',
    content: 'Book content2',
    sales: 20,
    profit: 200,
    reviews: 'Book reviews2',
    remarks: 'Book remarks2'
  };
  var bookData3 = {
    title: 'Book title3',
    content: 'Book content3',
    sales: 30,
    profit: 300,
    reviews: 'Book reviews3',
    remarks: 'Book remarks3'
  };
  var userData = {
    username: 'testUser',
    firstName: 'test',
    lastName: 'User',
    email: 'testuser@email.com'
  };
  var userData2 = {
    username: 'testUser2',
    firstName: 'test2',
    lastName: 'User2',
    email: 'testuser2@email.com'
  };
  var userData3 = {
    username: 'testUser3',
    firstName: 'test3',
    lastName: 'User3',
    email: 'testuser3@email.com'
  };
  var libData = {
    name: 'library1',
    address: 'address1',
    books: [bookData, bookData2, bookData3]
  };
  var context1 = { prop1: 'context1', prop2: 100 };
  var context2 = { prop1: 'context2', prop2: 200 };
  var context3 = { prop1: 'context3', prop2: 300 };
  var context4 = { prop1: 'context4', prop2: 400 };
  var context5 = { prop1: 'context5', prop2: 500 };

  describe('Using default connection', function() {

    before(function(done){
      mongoose.connect('mongodb://localhost:27017/mongoose-context-test');
      done();
    });

    it ('should be able to create normal model without context', function(done) {
      var Book = mongoose.model('Book', bookSchema);
      Book.should.not.have.property('$getContext');
      Book.create(bookData, function(err,book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to create model with context', function(done) {
      var Book1 = mongoose.contextModel(context1, 'Book', bookSchema);
      var Book2 = mongoose.contextModel(context2, 'Book');
      var User1 = mongoose.contextModel(context1, 'User', userSchema);
      var User2 = mongoose.contextModel(context3, 'User');
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(context1);
      Book2.should.have.property('$getContext');
      Book2.$getContext().should.equal(context2);
      User1.should.have.property('$getContext');
      User1.$getContext().should.equal(context1);
      User2.should.have.property('$getContext');
      User2.$getContext().should.equal(context3);
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
      var Book = conn.model('Book', bookSchema);
      Book.should.not.have.property('context');
      Book.create(bookData, function(err,book) {
        should.not.exist(err);
        should.exist(book);
        done();
      });
    });

    it ('should be able to create model with context', function(done) {
      var Book1 = conn.contextModel(context1, 'Book', bookSchema);
      var Book2 = conn.contextModel(context2, 'Book');
      var User1 = conn.contextModel(context1, 'User', userSchema);
      var User2 = conn.contextModel(context3, 'User');
      Book1.should.have.property('$getContext');
      Book1.$getContext().should.equal(context1);
      Book2.should.have.property('$getContext');
      Book2.$getContext().should.equal(context2);
      User1.should.have.property('$getContext');
      User1.$getContext().should.equal(context1);
      User2.should.have.property('$getContext');
      User2.$getContext().should.equal(context3);
      done();
    });

    after(function(done) {
      conn.close(done);
    });

  });

  describe('Model methods', function() {

    var conn, Book1, Book2, User3, User4, Reader1, Reader5;

    before(function(done){
      conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
      Book1 = conn.contextModel(context1, 'Book', bookSchema);
      Book2 = conn.contextModel(context2, 'Book');
      User3 = conn.contextModel(context3, 'User', userSchema);
      User4 = conn.contextModel(context4, 'User');
      Reader1 = conn.contextModel(context1, 'Reader', readerSchema);
      Reader5 = conn.contextModel(context5, 'Reader');
      async.parallel([
        function(cb) { Book1.remove(cb); },
        function(cb) { User3.remove(cb); },
        function(cb) { Reader1.remove(cb); }
      ], done);
    });

    it('should be able to create context instances using Model constructor', function(done) {
      var context = [ context1, context2, context3, context4 ];
      var data = [ bookData, bookData2, userData, userData2 ];
      var items = [ new Book1(bookData), new Book2(bookData2), new User3(userData), new User4(userData2) ]
      items.forEach(function(item,index) {
        item.should.have.property('$getContext');
        item.$getContext().should.equal(context[index]);
        item.should.match(data[index]);
      });
      done();
    });

    it('should produce context instances with Model.count()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book2.count({title: bookData.title}).find({title: bookData.title}, cb) },
            function(cb) { User4.count({firstName: userData.firstName}).find({firstName: userData.firstName}, cb) }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context2, context4 ];
          var data = [ bookData, userData ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.create() using callbacks', function(done) {
      async.parallel([
        function(cb) { Book1.create(bookData, cb); },
        function(cb) { Book1.create(bookData2, cb); },
        function(cb) { Book2.create(bookData3, cb); },
        function(cb) { User3.create(userData, cb); },
        function(cb) { User4.create(userData2, cb); }
      ], function(err,results) {
        should.not.exist(err);
        results.length.should.equal(5);
        var context =  [ context1, context1, context2, context3, context4 ];
        var data = [ bookData, bookData2, bookData3, userData, userData2 ];
        results.forEach(function(item,index) {
          item.should.have.property('$getContext');
          item.$getContext().should.equal(context[index]);
          item.should.match(data[index]);
        });
        done();
      });
    });

    it('should produce context instances with Model.create() using promises', function(done) {
      var isDone = false;
      function ignore() { }
      function success(cb) { return function(result) { cb(null,result); } }
      function end(err) { if (!isDone) { isDone = true; done(err); } }
      async.parallel([
        function(cb) { Book1.create(bookData).then(success(cb),cb).then(ignore,end); },
        function(cb) { Book1.create(bookData2).then(success(cb),cb).then(ignore,end); },
        function(cb) { Book2.create(bookData3).then(success(cb),cb).then(ignore,end); },
        function(cb) { User3.create(userData).then(success(cb),cb).then(ignore,end); },
        function(cb) { User4.create(userData2).then(success(cb),cb).then(ignore,end); }
      ], function(err,results) {
        should.not.exist(err);
        results.length.should.equal(5);
        var context =  [ context1, context1, context2, context3, context4 ];
        var data = [ bookData, bookData2, bookData3, userData, userData2 ];
        results.forEach(function(item,index) {
          item.should.have.property('$getContext');
          item.$getContext().should.equal(context[index]);
          item.should.match(data[index]);
        });
        end();
      });
    });

    it('should produce context instances with Model.distinct()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book2.distinct('_id', {title: bookData.title}).find({title: bookData.title}, cb) },
            function(cb) { User4.distinct('lastName', {firstName: userData.firstName}).find({firstName: userData.firstName}, cb) }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context2, context4 ];
          var data = [ bookData, userData ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.find() using calllbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User3.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.find({title: bookData.title}, cb); },
            function(cb) { Book2.find({title: bookData.title}, cb); },
            function(cb) { User3.find({firstName: userData.firstName}, cb); },
            function(cb) { User4.find({firstName: userData.firstName}, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData, userData, userData ]
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.find() using exec() and callbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User3.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.find({title: bookData.title}).exec(cb); },
            function(cb) { Book2.find({title: bookData.title}).exec(cb); },
            function(cb) { User3.find({firstName: userData.firstName}).exec(cb); },
            function(cb) { User4.find({firstName: userData.firstName}).exec(cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData, userData, userData ]
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.find() using exec() and promises', function(done) {
      var isDone = false;
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User3.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          function ignore() { }
          function success(cb) { return function(result) { cb(null,result); } }
          function end(err, results) { if (!isDone) { isDone = true; next(err, results); } }
          async.parallel([
            function(cb) { Book1.find({title: bookData.title}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { Book2.find({title: bookData.title}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { User3.find({firstName: userData.firstName}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { User4.find({firstName: userData.firstName}).exec().then(success(cb),cb).then(ignore,end); }
          ], end);
        },
        function(results, next) {
          isDone = false;
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData, userData, userData ]
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findById() using calllbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User3.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findById(results[0]._id, cb); },
            function(cb) { Book2.findById(results[1]._id, cb); },
            function(cb) { User3.findById(results[2]._id, cb); },
            function(cb) { User4.findById(results[3]._id, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData, userData, userData ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findByIdAndRemove()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findByIdAndRemove(results[0]._id, cb); },
            function(cb) { Book2.findByIdAndRemove(results[1]._id, cb); },
            function(cb) { User3.findByIdAndRemove(results[2]._id, cb); },
            function(cb) { User4.findByIdAndRemove(results[3]._id, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData2, userData, userData2 ];
          results.forEach(function(item,index) {
            if (Array.isArray(item))
              item = item[0];
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findByIdAndUpdate()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findByIdAndUpdate(results[0]._id, bookData3, { new: true }, cb); },
            function(cb) { Book2.findByIdAndUpdate(results[1]._id, bookData3, { new: false }, cb); },
            function(cb) { User3.findByIdAndUpdate(results[2]._id, userData3, { new: true }, cb); },
            function(cb) { User4.findByIdAndUpdate(results[3]._id, userData3, { new: false }, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData3, bookData2, userData3, userData2 ];
          results.forEach(function(item,index) {
            if (Array.isArray(item))
              item = item[0];
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findOne() using calllback', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findOne({_id: results[0]._id}, cb); },
            function(cb) { Book2.findOne({_id: results[1]._id}, cb); },
            function(cb) { User3.findOne({_id: results[2]._id}, cb); },
            function(cb) { User4.findOne({_id: results[3]._id}, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(results[index].toObject());
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findOne() using exec() and callbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findOne({_id: results[0]._id}).exec(cb); },
            function(cb) { Book2.findOne({_id: results[1]._id}).exec(cb); },
            function(cb) { User3.findOne({_id: results[2]._id}).exec(cb); },
            function(cb) { User4.findOne({_id: results[3]._id}).exec(cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(results[index].toObject());
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findOne() using exec() and promises', function(done) {
      var isDone = false;
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          function ignore() { }
          function success(cb) { return function(result) { cb(null,result); } }
          function end(err, results) { if (!isDone) { isDone = true; next(err, results); } }
          async.parallel([
            function(cb) { Book1.findOne({_id: results[0]._id}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { Book2.findOne({_id: results[1]._id}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { User3.findOne({_id: results[2]._id}).exec().then(success(cb),cb).then(ignore,end); },
            function(cb) { User4.findOne({_id: results[3]._id}).exec().then(success(cb),cb).then(ignore,end); }
          ], end);
        },
        function(results, next) {
          isDone = false;
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(results[index].toObject());
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findOneAndRemove()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findOneAndRemove({_id: results[0]._id}, cb); },
            function(cb) { Book2.findOneAndRemove({_id: results[1]._id}, cb); },
            function(cb) { User3.findOneAndRemove({_id: results[2]._id}, cb); },
            function(cb) { User4.findOneAndRemove({_id: results[3]._id}, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData, bookData2, userData, userData2 ];
          results.forEach(function(item,index) {
            if (Array.isArray(item))
              item = item[0];
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.findOneAndUpdate()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData2, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData2, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.findOneAndUpdate({_id: results[0]._id}, bookData3, { new: true }, cb); },
            function(cb) { Book2.findOneAndUpdate({_id: results[1]._id}, bookData3, { new: false }, cb); },
            function(cb) { User3.findOneAndUpdate({_id: results[2]._id}, userData3, { new: true }, cb); },
            function(cb) { User4.findOneAndUpdate({_id: results[3]._id}, userData3, { new: false }, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(4);
          var context =  [ context1, context2, context3, context4 ];
          var data = [ bookData3, bookData2, userData3, userData2 ];
          results.forEach(function(item,index) {
            if (Array.isArray(item))
              item = item[0];
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);
    });

    it('should be able to create model instances using Model.model()', function(done) {
      var items = [ User3.model('Book'), Book2.model('User') ];
      var context = [ context3, context2 ];
      items.forEach(function(item,index) {
        item.should.have.property('$getContext');
        item.$getContext().should.equal(context[index]);
      });
      done();
    });

    it('should produce context instances through Model.populate()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Reader1.create({ book: results[0]._id, user: results[2]._id, rating: 10 }, cb); },
            function(cb) { Reader1.create({ book: results[1]._id, user: results[3]._id, rating: 20 }, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          Reader1.find(next);
        },
        function(results, next) {
          results.forEach(function(reader) {
            reader.should.have.property('$getContext');
            reader.$getContext().should.equal(context1);
          });
          var opts = [{path: 'user'}, {path: 'book'}];
          Reader5.populate(results, opts, next);
        },
        function(results, next) {
          results.forEach(function(reader) {
            reader.should.have.property('$getContext');
            reader.$getContext().should.equal(context5);
            reader.user.firstName.should.equal(userData.firstName);
            reader.book.title.should.equal(bookData.title);
          });
          next();
        }
      ], done);
    });

    it('should produce context instances through Model.remove()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book1.remove({_id: results[0]}).find({title: bookData.title}, cb) },
            function(cb) { User3.remove({_id: results[2]}).find({title: userData.firstName}).exec(cb) }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context1, context3 ];
          var data = [ bookData, userData ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.update()', function(done) {
      var newContent = 'newContent';
      var newLastName = 'newLastName';
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book2.update({title: bookData.title}, {content: newContent}).find({content: newContent}, cb) },
            function(cb) { User4.update({firstName: userData.firstName}, {lastName: newLastName}).find({lastName: newLastName}, cb) }
          ], next);
        },
        function(results, next) {
          var context =  [ context2, context4 ];
          var key = [ 'content', 'lastName' ];
          var data = [ newContent, newLastName ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.should.have.property(key[index]);
              item[key[index]].should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.where()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book2.where('title').equals(bookData.title).exec(cb) },
            function(cb) { User4.where('firstName').equals(userData.firstName).exec(cb) }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context2, context4 ];
          var data = [ bookData, userData ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances with Model.$where()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Book2.$where('this.title === "' + bookData.title + '"').exec(cb) },
            function(cb) { User4.$where('this.firstName === "' + userData.firstName + '"').exec(cb) }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context2, context4 ];
          var data = [ bookData, userData ];
          results.forEach(function(items,index) {
            items.forEach(function(item) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
          });
          next();
        }
      ], done);
    });

    it('should produce context instances using QueryStreams', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData, cb); }
          ], next);
        },
        function(results, next) {
          var stream = Book2.find().stream();
          stream.on('data', function(book) {
            book.should.have.property('$getContext');
            book.$getContext().should.equal(context2);
          });
          stream.on('close', next);
        }
      ], done);
    });

    after(function(done) {
      conn.close(done);
    });
  });

  describe('Instance methods', function() {

    var conn, Book1, Book2, User3, User4, Reader1, Reader5;

    before(function(done){
      conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
      Book1 = conn.contextModel(context1, 'Book', bookSchema);
      Book2 = conn.contextModel(context2, 'Book');
      User3 = conn.contextModel(context3, 'User', userSchema);
      User4 = conn.contextModel(context4, 'User');
      Reader1 = conn.contextModel(context1, 'Reader', readerSchema);
      Reader5 = conn.contextModel(context5, 'Reader');
      async.parallel([
        function(cb) { Book1.remove(cb); },
        function(cb) { User3.remove(cb); },
        function(cb) { Reader1.remove(cb); }
      ], done);
    });

    it ('should be able to create context instances using instance.model()', function(done) {
      var book1Inst = new Book1;
      var user3Inst = new User3;
      var user1aModel = book1Inst.model('User');
      var user1bModel = user1aModel.model('User');
      var book1aModel = user1bModel.model('Book');
      var book1bModel = book1aModel.model('Book');
      var book3aModel = user3Inst.model('Book');
      var user1cModel = book1bModel.model('User');
      var items = [ book1Inst, book1aModel, book1bModel, user1aModel, user1bModel, user1cModel, user3Inst, book3aModel ];
      items.forEach(function(item,index) {
        item.should.have.property('$getContext');
        item.$getContext().should.equal(index < 6 ? context1 : context3);
      });
      done();
    });

    it('should produce context instances with instance.populate() using callbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Reader1.create({ book: results[0]._id, user: results[2]._id, rating: 10 }, cb); },
            function(cb) { Reader1.create({ book: results[1]._id, user: results[3]._id, rating: 20 }, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          Reader5.find(next);
        },
        function(results, next) {
          var tasks = [];
          results.forEach(function(reader) {
            reader.should.have.property('$getContext');
            reader.$getContext().should.equal(context5);
            tasks.push( function(cb) { reader.populate('user book', cb); });
          });
          async.parallel(tasks, next);
        },
        function(results, next) {
          results.forEach(function(reader) {
            reader.should.have.property('$getContext');
            reader.$getContext().should.equal(context5);
            reader.user.firstName.should.equal(userData.firstName);
            reader.book.title.should.equal(bookData.title);
          });
          next();
        }
      ], done);
    });

    // execPopulate() requires mongoose version >= 4.0.0
    if (semver.gte(mongoose.version, "4.0.0")) {
      it('should produce context instances with instance.populate() using execPopulate()', function (done) {
        var isDone = false;
        async.waterfall([
          function (next) {
            async.parallel([
              function (cb) {
                Book1.create(bookData, cb);
              },
              function (cb) {
                Book2.create(bookData, cb);
              },
              function (cb) {
                User3.create(userData, cb);
              },
              function (cb) {
                User4.create(userData, cb);
              }
            ], next);
          },
          function (results, next) {
            async.parallel([
              function (cb) {
                Reader1.create({book: results[0]._id, user: results[2]._id, rating: 10}, cb);
              },
              function (cb) {
                Reader1.create({book: results[1]._id, user: results[3]._id, rating: 20}, cb);
              }
            ], next);
          },
          function (results, next) {
            results.length.should.equal(2);
            Reader5.find(next);
          },
          function (results, next) {
            var tasks = [];

            function ignore() {
            }

            function success(cb) {
              return function (result) {
                cb(null, result);
              }
            }

            function end(err, results) {
              if (!isDone) {
                isDone = true;
                next(err, results);
              }
            }

            results.forEach(function (reader) {
              reader.should.have.property('$getContext');
              reader.$getContext().should.equal(context5);
              tasks.push(function (cb) {
                reader.populate('user book').execPopulate().then(success(cb), cb).then(ignore, end);
              });
            });
            async.parallel(tasks, end);
          },
          function (results, next) {
            isDone = false;
            results.forEach(function (reader) {
              reader.should.have.property('$getContext');
              reader.$getContext().should.equal(context5);
              reader.user.firstName.should.equal(userData.firstName);
              reader.book.title.should.equal(bookData.title);
            });
            next();
          }
        ], done);
      });
    };

    it('should produce context instances with Model.populate() using exec()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book2.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
            function(cb) { User4.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { Reader1.create({ book: results[0]._id, user: results[2]._id, rating: 10 }, cb); },
            function(cb) { Reader1.create({ book: results[1]._id, user: results[3]._id, rating: 20 }, cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          Reader5.find().populate('user book').exec(next);
        },
        function(results, next) {
          results.forEach(function(reader) {
            reader.should.have.property('$getContext');
            reader.$getContext().should.equal(context5);
            reader.user.firstName.should.equal(userData.firstName);
            reader.book.title.should.equal(bookData.title);
          });
          next();
        }
      ], done);
    });

    it ('should produce context instances with instance.remove() using callbacks', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); },
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { results[0].remove(cb); },
            function(cb) { results[1].remove(cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context1, context3 ];
          var data = [ bookData, userData ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);

    });

    // Promises with instance.remove() requires mongoose version >= 4.0.0
    if (semver.gte(mongoose.version, "4.0.0")) {
      it ('should produce context instances with instance.remove() using promises', function(done) {
        var isDone = false;
        async.waterfall([
          function(next) {
            async.parallel([
              function(cb) { Book1.create(bookData, cb); },
              function(cb) { User3.create(userData, cb); },
            ], next);
          },
          function(results, next) {
            function ignore() { }
            function success(cb) { return function(result) { cb(null,result); } }
            function end(err, results) { if (!isDone) { isDone = true; next(err, results); } }
            async.parallel([
              function(cb) { results[0].remove().then(success(cb),cb).then(ignore,end); },
              function(cb) { results[1].remove().then(success(cb),cb).then(ignore,end); },
            ], end);
          },
          function(results, next) {
            isDone = false;
            results.length.should.equal(2);
            var context =  [ context1, context3 ];
            var data = [ bookData, userData ];
            results.forEach(function(item,index) {
              item.should.have.property('$getContext');
              item.$getContext().should.equal(context[index]);
              item.toObject().should.match(data[index]);
            });
            next();
          }
        ], done);
      });
    }

    it ('should produce context instances with instance.save() using callbacks', function(done) {
      var myBookData = {
        title: 'Book title',
        content: 'Book content',
        sales: 10,
        profit: 100,
        reviews: 'Book reviews',
        remarks: 'Book remarks'
      };
      var myUserData = {
        username: 'testUser',
        firstName: 'test',
        lastName: 'User',
        email: 'testuser@email.com'
      };
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(myBookData, cb); },
            function(cb) { User3.create(myUserData, cb); },
          ], next);
        },
        function(results, next) {
          myBookData.title = "Changed " + myBookData.title;
          myUserData.firstName = "Changed " + myUserData.firstName;
          async.parallel([
            function(cb) { results[0].title = myBookData.title; results[0].save(cb); },
            function(cb) { results[1].firstName = myUserData.firstName; results[1].save(cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context1, context3 ];
          var data = [ myBookData, myUserData ];
          results.forEach(function(item,index) {
            item[0].should.have.property('$getContext');
            item[0].$getContext().should.equal(context[index]);
            item[0].toObject().should.match(data[index]);
          });
          next();
        }
      ], done);

    });

    it ('should produce context instances with instance.update() using exec()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { User3.create(userData, cb); }
          ], next);
        },
        function(results, next) {
          async.parallel([
            function(cb) { results[0].update({title: "Changed"}).findOne({_id: results[0]._id}).exec(cb); },
            function(cb) { results[1].update({firstName: "Changed"}).findOne({_id: results[1]._id}).exec(cb); }
          ], next);
        },
        function(results, next) {
          results.length.should.equal(2);
          var context =  [ context1, context3 ];
          var data = [ bookData, userData ];
          results.forEach(function(item,index) {
            item.should.have.property('$getContext');
            item.$getContext().should.equal(context[index]);
            item.toObject().should.match(data[index]);
          });
          next();
        }
      ], done);

    });

    after(function(done) {
      conn.close(done);
    });
  });

  describe('Sub-documents', function() {

    var conn, Book1, Lib2, Lib3;

    before(function(done){
      conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
      Book1 = conn.contextModel(context1, 'Book', bookSchema);
      Lib2 = conn.contextModel(context2, 'Lib', libSchema);
      Lib3 = conn.contextModel(context3, 'Lib');
      async.parallel([
        function(cb) { Book1.remove(cb); },
        function(cb) { Lib2.remove(cb); }
      ], done);
    });

    it('should be able to create subdocs with context using Model constructor', function(done) {
      var lib = new Lib2(libData);
      lib.should.have.property('$getContext');
      lib.$getContext().should.equal(context2);
      lib.books.length.should.equal(3);
      lib.books.forEach(function(book) {
        book.should.have.property('$getContext');
        book.$getContext().should.equal(context2);
      });
      done();
    });

    it('should be able to create subdocs with context using Model.create()', function(done) {
      async.waterfall([
        function(next) {
          Lib3.create(libData, next);
        },
        function(lib, next) {
          lib.should.have.property('$getContext');
          lib.$getContext().should.equal(context3);
          lib.books.length.should.equal(3);
          lib.books.forEach(function(book) {
            book.should.have.property('$getContext');
            book.$getContext().should.equal(context3);
          });
          next();
        }
      ],done);
    });

    it ('should be able to retrieve subdocs with context', function(done) {
      async.waterfall([
        function(next) {
          Lib3.create(libData, next);
        },
        function(lib, next) {
          Lib2.find({_id: lib._id}, next);
        },
        function(libs, next) {
          libs.forEach(function(lib) {
            lib.$getContext().should.equal(context2);
            lib.should.have.property('$getContext');
            lib.books.length.should.equal(3);
            lib.books.forEach(function(book) {
              book.should.have.property('$getContext');
              book.$getContext().should.equal(context2);
            });
          })
          next();
        }
      ],done);
    });

    after(function(done) {
      conn.close(done);
    });

  });

  describe('Middleware', function() {

    var conn,Book1,Book2,logs;

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
      var schema = mongoose.Schema(bookSchemaData);
      setFilters(schema);
      Book1 = conn.contextModel(context1, 'Book', schema);
      Book2 = conn.contextModel(context2, 'Book');
      done();
    });

    beforeEach(function() {
      logs = [];
    });

    it ('should be able to access context in middleware during create()', function(done) {
      async.waterfall([
        function(next) {
          Book1.create(bookData,next)
        },
        function(book,next) {
          checkFilters(context1);
          Book2.create(bookData2,next)
        },
        function(book,next) {
          checkFilters(context2);
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
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData2, cb); },
            function(cb) { Book2.create(bookData3, cb); },
          ], function() { next(); });
        },
        function(next) {
          logs = [];
          Book1.find(function() { next(); });
        },
        function(next) {
          checkFilters(context1);
          Book2.find(function() { next(); });
        },
        function(next) {
          checkFilters(context2);
          next();
        }
      ], done);
    });

    it ('should be able to access context in middleware during find() through query.exec()', function(done) {
      async.waterfall([
        function(next) {
          Book1.remove(function() { next(); });
        },
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData2, cb); },
            function(cb) { Book2.create(bookData3, cb); },
          ], function() { next(); });
        },
        function(next) {
          logs = [];
          Book1.find().exec(function() { next(); });
        },
        function(next) {
          checkFilters(context1);
          Book2.find().exec(function() { next(); });
        },
        function(next) {
          checkFilters(context2);
          next();
        }
      ], done);
    });

    it ('should be able to access context in middleware during save()', function(done) {
      async.waterfall([
        function(next) {
          var book = new Book1(bookData);
          book.save(next);
        },
        function(book,count,next) {
          checkFilters(context1);
          book = new Book2(bookData);
          book.save(next);
        },
        function(book,count,next) {
          checkFilters(context2);
          next();
        }
      ], done);
    });

    it ('should be able to access context in middleware during remove()', function(done) {
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(bookData, cb); },
            function(cb) { Book1.create(bookData2, cb); },
            function(cb) { Book1.create(bookData3, cb); }
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
          checkFilters(context1);
          next();
        }
      ], done);
    });

    after(function(done) {
      conn.close(done);
    });

  })

});
