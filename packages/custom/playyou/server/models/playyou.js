'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
  Schema    = mongoose.Schema;

/**
 * Song Schema
 */

var SongSchema = new Schema({
	link: {
		type: String,
		required: true,
		unique: true
	},
	title: String,
	artist: String,
	votes: {
		up: {type: Array},
		down: {type: Array},
		abs: {type: Array}
	},
	submitted_by: String,
	status: {type: Boolean, default: false},
	loc: String,
	upvotes: {
		type: Number,
		default: 1
	},
	downvotes: Number,
	absvotes: Number,
	vote: Number
});

mongoose.model('Song', SongSchema);

/**
 * House Schema
 */

var HouseSchema = new Schema({
	link: {
		type: String,
		required: true,
		unique: true
	},
	title: String,
	artist: String,
	votes: {
		up: {type: Array},
		down: {type: Array},
		abs: {type: Array}
	},
	submitted_by: String,
	status: {type: Boolean, default: false},
	loc: String,
	upvotes: {
		type: Number,
		default: 1
	},
	downvotes: Number,
	absvotes: Number,
	vote: Number
});

mongoose.model('House', HouseSchema);