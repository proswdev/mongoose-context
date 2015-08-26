'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var mongooseContext = require('../index');
var TestData = require('./testdata');

describe('Models', function() {

  var conn, testData, Book1, Book2, User3, User4, Reader1, Reader5;

  before(function(done){
    conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
    testData = new TestData();
    Book1 = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
    Book2 = conn.contextModel(testData.context2, 'Book');
    User3 = conn.contextModel(testData.context3, 'User', testData.userSchema);
    User4 = conn.contextModel(testData.context4, 'User');
    Reader1 = conn.contextModel(testData.context1, 'Reader', testData.readerSchema);
    Reader5 = conn.contextModel(testData.context5, 'Reader');
    async.parallel([
      function(cb) { Book1.remove(cb); },
      function(cb) { User3.remove(cb); },
      function(cb) { Reader1.remove(cb); }
    ], done);
  });

  it('should be able to create context instances using Model constructor', function(done) {
    var context = [ testData.context1, testData.context2, testData.context3, testData.context4 ];
    var data = [ testData.bookData, testData.bookData2, testData.userData, testData.userData2 ];
    var items = [ new Book1(testData.bookData), new Book2(testData.bookData2), new User3(testData.userData), new User4(testData.userData2) ]
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book2.count({title: testData.bookData.title}).find({title: testData.bookData.title}, cb) },
          function(cb) { User4.count({firstName: testData.userData.firstName}).find({firstName: testData.userData.firstName}, cb) }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(2);
        var context =  [ testData.context2, testData.context4 ];
        var data = [ testData.bookData, testData.userData ];
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
      function(cb) { Book1.create(testData.bookData, cb); },
      function(cb) { Book1.create(testData.bookData2, cb); },
      function(cb) { Book2.create(testData.bookData3, cb); },
      function(cb) { User3.create(testData.userData, cb); },
      function(cb) { User4.create(testData.userData2, cb); }
    ], function(err,results) {
      should.not.exist(err);
      results.length.should.equal(5);
      var context =  [ testData.context1, testData.context1, testData.context2, testData.context3, testData.context4 ];
      var data = [ testData.bookData, testData.bookData2, testData.bookData3, testData.userData, testData.userData2 ];
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
      function(cb) { Book1.create(testData.bookData).then(success(cb),cb).then(ignore,end); },
      function(cb) { Book1.create(testData.bookData2).then(success(cb),cb).then(ignore,end); },
      function(cb) { Book2.create(testData.bookData3).then(success(cb),cb).then(ignore,end); },
      function(cb) { User3.create(testData.userData).then(success(cb),cb).then(ignore,end); },
      function(cb) { User4.create(testData.userData2).then(success(cb),cb).then(ignore,end); }
    ], function(err,results) {
      should.not.exist(err);
      results.length.should.equal(5);
      var context =  [ testData.context1, testData.context1, testData.context2, testData.context3, testData.context4 ];
      var data = [ testData.bookData, testData.bookData2, testData.bookData3, testData.userData, testData.userData2 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book2.distinct('_id', {title: testData.bookData.title}).find({title: testData.bookData.title}, cb) },
          function(cb) { User4.distinct('lastName', {firstName: testData.userData.firstName}).find({firstName: testData.userData.firstName}, cb) }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(2);
        var context =  [ testData.context2, testData.context4 ];
        var data = [ testData.bookData, testData.userData ];
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

  it('should be able to change context without affecting others', function(done) {
    var BookX = conn.contextModel(testData.context1, 'Book', testData.bookSchema);
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { BookX.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
        ], next);
      },
      function(results,next) {
        results.length.should.equal(2);
        results[0].should.have.property('$getContext');
        results[0].$getContext().should.equal(testData.context1);
        results[1].should.have.property('$getContext');
        results[1].$getContext().should.equal(testData.context2);
        BookX.$setContext(testData.context3);
        async.parallel([
          function(cb) { BookX.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
        ], next);
      },
      function(results,next) {
        results.length.should.equal(2);
        results[0].should.have.property('$getContext');
        results[0].$getContext().should.equal(testData.context3);
        results[1].should.have.property('$getContext');
        results[1].$getContext().should.equal(testData.context2);
        next();
      }
    ], done);
  });

  it('should produce context instances with Model.find() using calllbacks', function(done) {
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User3.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book1.find({title: testData.bookData.title}, cb); },
          function(cb) { Book2.find({title: testData.bookData.title}, cb); },
          function(cb) { User3.find({firstName: testData.userData.firstName}, cb); },
          function(cb) { User4.find({firstName: testData.userData.firstName}, cb); }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(4);
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData, testData.userData, testData.userData ]
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User3.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book1.find({title: testData.bookData.title}).exec(cb); },
          function(cb) { Book2.find({title: testData.bookData.title}).exec(cb); },
          function(cb) { User3.find({firstName: testData.userData.firstName}).exec(cb); },
          function(cb) { User4.find({firstName: testData.userData.firstName}).exec(cb); }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(4);
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData, testData.userData, testData.userData ]
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User3.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        function ignore() { }
        function success(cb) { return function(result) { cb(null,result); } }
        function end(err, results) { if (!isDone) { isDone = true; next(err, results); } }
        async.parallel([
          function(cb) { Book1.find({title: testData.bookData.title}).exec().then(success(cb),cb).then(ignore,end); },
          function(cb) { Book2.find({title: testData.bookData.title}).exec().then(success(cb),cb).then(ignore,end); },
          function(cb) { User3.find({firstName: testData.userData.firstName}).exec().then(success(cb),cb).then(ignore,end); },
          function(cb) { User4.find({firstName: testData.userData.firstName}).exec().then(success(cb),cb).then(ignore,end); }
        ], end);
      },
      function(results, next) {
        isDone = false;
        results.length.should.equal(4);
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData, testData.userData, testData.userData ]
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User3.create(testData.userData, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData, testData.userData, testData.userData ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData2, testData.userData, testData.userData2 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book1.findByIdAndUpdate(results[0]._id, testData.bookData3, { new: true }, cb); },
          function(cb) { Book2.findByIdAndUpdate(results[1]._id, testData.bookData3, { new: false }, cb); },
          function(cb) { User3.findByIdAndUpdate(results[2]._id, testData.userData3, { new: true }, cb); },
          function(cb) { User4.findByIdAndUpdate(results[3]._id, testData.userData3, { new: false }, cb); }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(4);
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData3, testData.bookData2, testData.userData3, testData.userData2 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
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
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData, testData.bookData2, testData.userData, testData.userData2 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData2, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData2, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book1.findOneAndUpdate({_id: results[0]._id}, testData.bookData3, { new: true }, cb); },
          function(cb) { Book2.findOneAndUpdate({_id: results[1]._id}, testData.bookData3, { new: false }, cb); },
          function(cb) { User3.findOneAndUpdate({_id: results[2]._id}, testData.userData3, { new: true }, cb); },
          function(cb) { User4.findOneAndUpdate({_id: results[3]._id}, testData.userData3, { new: false }, cb); }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(4);
        var context =  [ testData.context1, testData.context2, testData.context3, testData.context4 ];
        var data = [ testData.bookData3, testData.bookData2, testData.userData3, testData.userData2 ];
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
    var context = [ testData.context3, testData.context2 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData, cb); }
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
          reader.$getContext().should.equal(testData.context1);
        });
        var opts = [{path: 'user'}, {path: 'book'}];
        Reader5.populate(results, opts, next);
      },
      function(results, next) {
        results.forEach(function(reader) {
          reader.should.have.property('$getContext');
          reader.$getContext().should.equal(testData.context5);
          reader.user.firstName.should.equal(testData.userData.firstName);
          reader.book.title.should.equal(testData.bookData.title);
        });
        next();
      }
    ], done);
  });

  it('should produce context instances through Model.remove()', function(done) {
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book1.remove({_id: results[0]}).find({title: testData.bookData.title}, cb) },
          function(cb) { User3.remove({_id: results[2]}).find({title: testData.userData.firstName}).exec(cb) }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(2);
        var context =  [ testData.context1, testData.context3 ];
        var data = [ testData.bookData, testData.userData ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book2.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
          function(cb) { User4.create(testData.userData, cb); }
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book2.update({title: testData.bookData.title}, {content: newContent}).find({content: newContent}, cb) },
          function(cb) { User4.update({firstName: testData.userData.firstName}, {lastName: newLastName}).find({lastName: newLastName}, cb) }
        ], next);
      },
      function(results, next) {
        var context =  [ testData.context2, testData.context4 ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book2.where('title').equals(testData.bookData.title).exec(cb) },
          function(cb) { User4.where('firstName').equals(testData.userData.firstName).exec(cb) }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(2);
        var context =  [ testData.context2, testData.context4 ];
        var data = [ testData.bookData, testData.userData ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
        ], next);
      },
      function(results, next) {
        async.parallel([
          function(cb) { Book2.$where('this.title === "' + testData.bookData.title + '"').exec(cb) },
          function(cb) { User4.$where('this.firstName === "' + testData.userData.firstName + '"').exec(cb) }
        ], next);
      },
      function(results, next) {
        results.length.should.equal(2);
        var context =  [ testData.context2, testData.context4 ];
        var data = [ testData.bookData, testData.userData ];
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
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { Book1.create(testData.bookData, cb); }
        ], next);
      },
      function(results, next) {
        var stream = Book2.find().stream();
        stream.on('data', function(book) {
          book.should.have.property('$getContext');
          book.$getContext().should.equal(testData.context2);
        });
        stream.on('close', next);
      }
    ], done);
  });

  after(function(done) {
    conn.close(done);
  });
});

