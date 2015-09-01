"use strict";

var testPromise = function (next, wantErrors) {
  if (typeof next === 'boolean') {
    this.done = null;
    this.wantErrors = next;
  } else {
    this.done = next;
    this.wantErrors = !!wantErrors;
  }

  this.success = function (cb) {
    var cb = cb || this.done;
    if (wantErrors) {
      return function (results) {
        cb(null, null, results);
      }
    } else {
      return function (results) {
        cb(null, results);
      }
    }
  };

  this.failure = function (cb) {
    var cb = cb || this.done;
    if (wantErrors) {
      return function (err) {
        cb(null, err, null);
      }
    } else {
      return function (err) {
        cb(err);
      }
    }
  };

  this.ignore = function (cb) {
  };

  this.end = function (err, results) {
    if (this.done) {
      this.done(err, results);
      this.done = null;
    }
  }.bind(this);

};

module.exports = testPromise;
