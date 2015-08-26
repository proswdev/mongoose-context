"use strict";

var mongoose = require('mongoose');

module.exports = function() {

  this.bookSchemaData = {
    title: String,
    content: String,
    sales: Number,
    profit: Number,
    reviews: String,
    remarks: String
  };
  this.bookSchema = mongoose.Schema(this.bookSchemaData);
  this.userSchema = mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    email: String
  });
  this.readerSchema = mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    book: {type: mongoose.Schema.Types.ObjectId, ref: 'Book'},
    rating: Number
  });
  this.libSchema = mongoose.Schema({
    name: String,
    address: String,
    books: [this.bookSchema]
  });
  this.bookData = {
    title: 'Book title',
    content: 'Book content',
    sales: 10,
    profit: 100,
    reviews: 'Book reviews',
    remarks: 'Book remarks'
  };
  this.bookData2 = {
    title: 'Book title2',
    content: 'Book content2',
    sales: 20,
    profit: 200,
    reviews: 'Book reviews2',
    remarks: 'Book remarks2'
  };
  this.bookData3 = {
    title: 'Book title3',
    content: 'Book content3',
    sales: 30,
    profit: 300,
    reviews: 'Book reviews3',
    remarks: 'Book remarks3'
  };
  this.userData = {
    username: 'testUser',
    firstName: 'test',
    lastName: 'User',
    email: 'testuser@email.com'
  };
  this.userData2 = {
    username: 'testUser2',
    firstName: 'test2',
    lastName: 'User2',
    email: 'testuser2@email.com'
  };
  this.userData3 = {
    username: 'testUser3',
    firstName: 'test3',
    lastName: 'User3',
    email: 'testuser3@email.com'
  };
  this.libData = {
    name: 'library1',
    address: 'address1',
    books: [this.bookData, this.bookData2, this.bookData3]
  };
  this.context1 = {prop1: 'context1', prop2: 100};
  this.context2 = {prop1: 'context2', prop2: 200};
  this.context3 = {prop1: 'context3', prop2: 300};
  this.context4 = {prop1: 'context4', prop2: 400};
  this.context5 = {prop1: 'context5', prop2: 500};

}
