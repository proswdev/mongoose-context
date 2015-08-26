'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
var semver = require('semver');
var mongooseContext = require('../index');
var TestData = require('./testdata');

describe('Documents', function() {

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

  it ('should be able to create context documents using Document.model()', function(done) {
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
      item.$getContext().should.equal(index < 6 ? testData.context1 : testData.context3);
    });
    done();
  });

  it('should produce context documents with Document.populate() using callbacks', function(done) {
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
        Reader5.find(next);
      },
      function(results, next) {
        var tasks = [];
        results.forEach(function(reader) {
          reader.should.have.property('$getContext');
          reader.$getContext().should.equal(testData.context5);
          tasks.push( function(cb) { reader.populate('user book', cb); });
        });
        async.parallel(tasks, next);
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

  // execPopulate() requires mongoose version >= 4.0.0
  if (semver.gte(mongoose.version, "4.0.0")) {
    it('should produce context documents with Document.populate() using execPopulate()', function (done) {
      var isDone = false;
      async.waterfall([
        function (next) {
          async.parallel([
            function (cb) {
              Book1.create(testData.bookData, cb);
            },
            function (cb) {
              Book2.create(testData.bookData, cb);
            },
            function (cb) {
              User3.create(testData.userData, cb);
            },
            function (cb) {
              User4.create(testData.userData, cb);
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
            reader.$getContext().should.equal(testData.context5);
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
            reader.$getContext().should.equal(testData.context5);
            reader.user.firstName.should.equal(testData.userData.firstName);
            reader.book.title.should.equal(testData.bookData.title);
          });
          next();
        }
      ], done);
    });
  };

  it('should produce context documents with Model.populate() using exec()', function(done) {
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
        Reader5.find().populate('user book').exec(next);
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

  it ('should produce context documents with Document.remove() using callbacks', function(done) {
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); },
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
        var context =  [ testData.context1, testData.context3 ];
        var data = [ testData.bookData, testData.userData ];
        results.forEach(function(item,index) {
          item.should.have.property('$getContext');
          item.$getContext().should.equal(context[index]);
          item.toObject().should.match(data[index]);
        });
        next();
      }
    ], done);

  });

  // Promises with Document.remove() requires mongoose version >= 4.0.0
  if (semver.gte(mongoose.version, "4.0.0")) {
    it ('should produce context documents with Document.remove() using promises', function(done) {
      var isDone = false;
      async.waterfall([
        function(next) {
          async.parallel([
            function(cb) { Book1.create(testData.bookData, cb); },
            function(cb) { User3.create(testData.userData, cb); },
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
          var context =  [ testData.context1, testData.context3 ];
          var data = [ testData.bookData, testData.userData ];
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

  it ('should produce context documents with Document.save() using callbacks', function(done) {
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
        var context =  [ testData.context1, testData.context3 ];
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

  it ('should produce context documents with Document.update() using exec()', function(done) {
    async.waterfall([
      function(next) {
        async.parallel([
          function(cb) { Book1.create(testData.bookData, cb); },
          function(cb) { User3.create(testData.userData, cb); }
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
        var context =  [ testData.context1, testData.context3 ];
        var data = [ testData.bookData, testData.userData ];
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

