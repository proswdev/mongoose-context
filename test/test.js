'use strict';

var should = require('should');
var mongoose = require('mongoose');
var async = require('async');
require('../index');

describe('mongoose-context', function() {

    var bookData = {
        content: 'Book content',
        summary: 'Book summary',
        sales: 10,
        profit: 100,
        reviews: 'Book reviews',
        remarks: 'Book remarks'
    };
    var bookData2 = {
        content: 'Book content2',
        summary: 'Book summary2',
        sales: 20,
        profit: 200,
        reviews: 'Book reviews2',
        remarks: 'Book remarks2'
    };
    var bookData3 = {
        content: 'Book content3',
        summary: 'Book summary3',
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
    var context1 = { prop1: 'context1', prop2: 100 };
    var context2 = { prop1: 'context2', prop2: 200 };
    var context3 = { prop1: 'context3', prop2: 300 };
    var context4 = { prop1: 'context4', prop2: 400 };

    describe('Using default connection', function() {

        var bookSchema, userSchema;

        before(function(done){
            mongoose.connect('mongodb://localhost:27017/mongoose-context-test');
            bookSchema = mongoose.Schema({
                content: String,
                summary: String,
                sales: Number,
                profit: Number,
                reviews: String,
                remarks: String
            });
            userSchema = mongoose.Schema({
                username: String,
                firstName: String,
                lastName: String,
                email: String
            });
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
            Book1.$getContext().should.match(context1);
            Book2.should.have.property('$getContext');
            Book2.$getContext().should.match(context2);
            User1.should.have.property('$getContext');
            User1.$getContext().should.match(context1);
            User2.should.have.property('$getContext');
            User2.$getContext().should.match(context3);
            done();
        });

        after(function(done) {
            mongoose.disconnect(done);
        });

    });

    describe('Using custom connection', function() {

        var conn, bookSchema, userSchema;

        before(function(done){
            conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
            bookSchema = mongoose.Schema({
                content: String,
                summary: String,
                sales: Number,
                profit: Number,
                reviews: String,
                remarks: String
            });
            userSchema = mongoose.Schema({
                username: String,
                firstName: String,
                lastName: String,
                email: String
            });
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
            Book1.$getContext().should.match(context1);
            Book2.should.have.property('$getContext');
            Book2.$getContext().should.match(context2);
            User1.should.have.property('$getContext');
            User1.$getContext().should.match(context1);
            User2.should.have.property('$getContext');
            User2.$getContext().should.match(context3);
            done();
        });

        after(function(done) {
            conn.close(done);
        });

    });

    describe('Model methods', function() {

        var conn, bookSchema, userSchema, Book1, Book2, User3, User4;

        before(function(done){
            conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
            bookSchema = mongoose.Schema({
                content: String,
                summary: String,
                sales: Number,
                profit: Number,
                reviews: String,
                remarks: String
            });
            userSchema = mongoose.Schema({
                username: String,
                firstName: String,
                lastName: String,
                email: String
            });
            Book1 = conn.contextModel(context1, 'Book', bookSchema);
            Book2 = conn.contextModel(context2, 'Book');
            User3 = conn.contextModel(context3, 'User', userSchema);
            User4 = conn.contextModel(context4, 'User');
            async.parallel([
                function(cb) { Book1.remove(cb); },
                function(cb) { User3.remove(cb); }
            ], done);
        });

        it('should be able to create context instances using Model constructor', function(done) {
            var context = [ context1, context2, context3, context4 ];
            var data = [ bookData, bookData2, userData, userData2 ];
            var items = [ new Book1(bookData), new Book2(bookData2), new User3(userData), new User4(userData2) ]
            items.forEach(function(item,index) {
                item.should.have.property('$getContext');
                item.$getContext().should.match(context[index]);
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
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book2.count({content: bookData.content}).find({content: bookData.content}, cb) },
                        function(cb) { User4.count({firstName: userData.firstName}).find({firstName: userData.firstName}, cb) }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context2, context4 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
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
                    item.$getContext().should.match(context[index]);
                    item.should.match(data[index]);
                });
                done();
            });
        });

        it('should produce context instances with Model.create() using promises', function(done) {
            var isDone = false;
            function success(cb) { return function(result) { cb(null,result)} }
            function end() { if (!isDone) { isDone = true; done(); } }
            async.parallel([
                function(cb) { Book1.create(bookData).then(success(cb),cb).then(end,end); },
                function(cb) { Book1.create(bookData2).then(success(cb),cb).then(end,end); },
                function(cb) { Book2.create(bookData3).then(success(cb),cb).then(end,end); },
                function(cb) { User3.create(userData).then(success(cb),cb).then(end,end); },
                function(cb) { User4.create(userData2).then(success(cb),cb).then(end,end); }
            ], function(err,results) {
                should.not.exist(err);
                results.length.should.equal(5);
                var context =  [ context1, context1, context2, context3, context4 ];
                var data = [ bookData, bookData2, bookData3, userData, userData2 ];
                results.forEach(function(item,index) {
                    item.should.have.property('$getContext');
                    item.$getContext().should.match(context[index]);
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
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book2.distinct('_id', {content: bookData.content}).find({content: bookData.content}, cb) },
                        function(cb) { User4.distinct('lastName', {firstName: userData.firstName}).find({firstName: userData.firstName}, cb) }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context2, context4 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
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
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.find({content: bookData.content}, cb); },
                        function(cb) { Book2.find({content: bookData.content}, cb); },
                        function(cb) { User3.find({firstName: userData.firstName}, cb); },
                        function(cb) { User4.find({firstName: userData.firstName}, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData, userData, userData ]
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
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
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.find({content: bookData.content}).exec(cb); },
                        function(cb) { Book2.find({content: bookData.content}).exec(cb); },
                        function(cb) { User3.find({firstName: userData.firstName}).exec(cb); },
                        function(cb) { User4.find({firstName: userData.firstName}).exec(cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData, userData, userData ]
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.find() using exec() and promises', function(done) {
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User3.create(userData, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    var isDone = false;
                    function success(cb) { return function(result) { cb(null,result)} }
                    function end() { if (!isDone) { isDone = true; next(); } }
                    async.parallel([
                        function(cb) { Book1.find({content: bookData.content}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { Book2.find({content: bookData.content}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { User3.find({firstName: userData.firstName}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { User4.find({firstName: userData.firstName}).exec().then(success(cb),cb).then(end,end); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData, userData, userData ]
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findById() using calllbacks', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User3.create(userData, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findById(items[0]._id, cb); },
                        function(cb) { Book2.findById(items[1]._id, cb); },
                        function(cb) { User3.findById(items[2]._id, cb); },
                        function(cb) { User4.findById(items[3]._id, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData, userData, userData ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findByIdAndRemove()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findByIdAndRemove(items[0]._id, cb); },
                        function(cb) { Book2.findByIdAndRemove(items[1]._id, cb); },
                        function(cb) { User3.findByIdAndRemove(items[2]._id, cb); },
                        function(cb) { User4.findByIdAndRemove(items[3]._id, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData2, userData, userData2 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findByIdAndUpdate()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findByIdAndUpdate(items[0]._id, bookData3, { new: true }, cb); },
                        function(cb) { Book2.findByIdAndUpdate(items[1]._id, bookData3, { new: false }, cb); },
                        function(cb) { User3.findByIdAndUpdate(items[2]._id, userData3, { new: true }, cb); },
                        function(cb) { User4.findByIdAndUpdate(items[3]._id, userData3, { new: false }, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData3, bookData2, userData3, userData2 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findOne() using calllback', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findOne({_id: items[0]._id}, cb); },
                        function(cb) { Book2.findOne({_id: items[1]._id}, cb); },
                        function(cb) { User3.findOne({_id: items[2]._id}, cb); },
                        function(cb) { User4.findOne({_id: items[3]._id}, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(items[index].toObject());
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findOne() using exec() and callbacks', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findOne({_id: items[0]._id}).exec(cb); },
                        function(cb) { Book2.findOne({_id: items[1]._id}).exec(cb); },
                        function(cb) { User3.findOne({_id: items[2]._id}).exec(cb); },
                        function(cb) { User4.findOne({_id: items[3]._id}).exec(cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(items[index].toObject());
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findOne() using exec() and promises', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    var isDone = false;
                    function success(cb) { return function(result) { cb(null,result)} }
                    function end() { if (!isDone) { isDone = true; next(); } }
                    async.parallel([
                        function(cb) { Book1.findOne({_id: items[0]._id}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { Book2.findOne({_id: items[1]._id}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { User3.findOne({_id: items[2]._id}).exec().then(success(cb),cb).then(end,end); },
                        function(cb) { User4.findOne({_id: items[3]._id}).exec().then(success(cb),cb).then(end,end); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(items[index].toObject());
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findOneAndRemove()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findOneAndRemove({_id: items[0]._id}, cb); },
                        function(cb) { Book2.findOneAndRemove({_id: items[1]._id}, cb); },
                        function(cb) { User3.findOneAndRemove({_id: items[2]._id}, cb); },
                        function(cb) { User4.findOneAndRemove({_id: items[3]._id}, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData, bookData2, userData, userData2 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.findOneAndUpdate()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData2, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData2, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.findOneAndUpdate({_id: items[0]._id}, bookData3, { new: true }, cb); },
                        function(cb) { Book2.findOneAndUpdate({_id: items[1]._id}, bookData3, { new: false }, cb); },
                        function(cb) { User3.findOneAndUpdate({_id: items[2]._id}, userData3, { new: true }, cb); },
                        function(cb) { User4.findOneAndUpdate({_id: items[3]._id}, userData3, { new: false }, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(4);
                        var context =  [ context1, context2, context3, context4 ];
                        var data = [ bookData3, bookData2, userData3, userData2 ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should be able to create model instances using Model.model()', function(done) {
            var items = [ User3.model('Book'), Book2.model('User') ];
            var context = [ context3, context2 ];
            items.forEach(function(item,index) {
                item.should.have.property('$getContext');
                item.$getContext().should.match(context[index]);
            });
            done();
        });

        it('should produce context instances through Model.remove()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book1.remove({_id: items[0]}).find({content: bookData.content}, cb) },
                        function(cb) { User3.remove({_id: items[2]}).find({content: userData.firstName}).exec(cb) }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context1, context3 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.update()', function(done) {
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { Book2.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                        function(cb) { User4.create(userData, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    var newSummary = 'newSummary';
                    var newLastName = 'newLastName';
                    async.parallel([
                        function(cb) { Book2.update({content: bookData.content}, {summary: newSummary}).find({summary: newSummary}, cb) },
                        function(cb) { User4.update({firstName: userData.firstName}, {lastName: newLastName}).find({lastName: newLastName}, cb) }
                    ], function(err,results) {
                        var context =  [ context2, context4 ];
                        var key = [ 'summary', 'lastName' ];
                        var data = [ newSummary, newLastName ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.should.have.property(key[index]);
                                item[key[index]].should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.where()', function(done) {
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book2.where('content').equals(bookData.content).exec(cb) },
                        function(cb) { User4.where('firstName').equals(userData.firstName).exec(cb) }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context2, context4 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        it('should produce context instances with Model.$where()', function(done) {
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                    ], function(err,results) {
                        should.not.exist(err);
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { Book2.$where('this.content === "' + bookData.content + '"').exec(cb) },
                        function(cb) { User4.$where('this.firstName === "' + userData.firstName + '"').exec(cb) }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context2, context4 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(items,index) {
                            items.forEach(function(item) {
                                item.should.have.property('$getContext');
                                item.$getContext().should.match(context[index]);
                                item.toObject().should.match(data[index]);
                            });
                        });
                        next();
                    });
                }
            ], done);
        });

        after(function(done) {
            conn.close(done);
        });
    });

    describe('Instance methods', function() {

        var conn, bookSchema, userSchema, Book1, Book2, User3, User4;

        before(function(done){
            conn = mongoose.createConnection('mongodb://localhost:27017/mongoose-context-test');
            bookSchema = mongoose.Schema({
                content: String,
                summary: String,
                sales: Number,
                profit: Number,
                reviews: String,
                remarks: String
            });
            userSchema = mongoose.Schema({
                username: String,
                firstName: String,
                lastName: String,
                email: String
            });
            Book1 = conn.contextModel(context1, 'Book', bookSchema);
            Book2 = conn.contextModel(context2, 'Book');
            User3 = conn.contextModel(context3, 'User', userSchema);
            User4 = conn.contextModel(context4, 'User');
            async.parallel([
                function(cb) { Book1.remove(cb); },
                function(cb) { User3.remove(cb); }
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
                item.$getContext().should.match(index < 6 ? context1 : context3);
            });
            done();
        });

        it ('should produce context instances with instance.remove() using callbacks', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { items[0].remove(cb); },
                        function(cb) { items[1].remove(cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context1, context3 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);

        });

        // Version 3.8 doesn't support promises with instance.remove()
        /*
        it ('should produce context instances with instance.remove() using promises', function(done) {
            var items;
            var isDone = false;
            function success(cb) { return function(result) { cb(null,result)} }
            function end() { if (!isDone) { isDone = true; done(); } }
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); },
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { items[0].remove().then(success(cb),cb).then(end,end); },
                        function(cb) { items[1].remove().then(success(cb),cb).then(end,end); },
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context1, context3 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);
        });
        */

        it ('should produce context instances with instance.save() using callbacks', function(done) {
            var myBookData = {
                content: 'Book content',
                summary: 'Book summary',
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
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(myBookData, cb); },
                        function(cb) { User3.create(myUserData, cb); },
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    myBookData.content = "Changed " + myBookData.content;
                    myUserData.firstName = "Changed " + myUserData.firstName;
                    async.parallel([
                        function(cb) { items[0].content = myBookData.content; items[0].save(cb); },
                        function(cb) { items[1].firstName = myUserData.firstName; items[1].save(cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context1, context3 ];
                        var data = [ myBookData, myUserData ];
                        results.forEach(function(item,index) {
                            item[0].should.have.property('$getContext');
                            item[0].$getContext().should.match(context[index]);
                            item[0].toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);

        });

        it ('should produce context instances with instance.update() using exec()', function(done) {
            var items;
            async.waterfall([
                function(next) {
                    async.parallel([
                        function(cb) { Book1.create(bookData, cb); },
                        function(cb) { User3.create(userData, cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        items = results;
                        next();
                    });
                },
                function(next) {
                    async.parallel([
                        function(cb) { items[0].update({content: "Changed"}).findOne({_id: items[0]._id}).exec(cb); },
                        function(cb) { items[1].update({firstName: "Changed"}).findOne({_id: items[1]._id}).exec(cb); }
                    ], function(err,results) {
                        should.not.exist(err);
                        results.length.should.equal(2);
                        var context =  [ context1, context3 ];
                        var data = [ bookData, userData ];
                        results.forEach(function(item,index) {
                            item.should.have.property('$getContext');
                            item.$getContext().should.match(context[index]);
                            item.toObject().should.match(data[index]);
                        });
                        next();
                    });
                }
            ], done);

        });

        after(function(done) {
            conn.close(done);
        });
    });
});
