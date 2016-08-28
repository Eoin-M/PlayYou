'use strict';

/* jshint -W098 */
// The Package is past automatically as first parameter
module.exports = function(Playyou, app, auth, database) {
	var mongoose = require('mongoose');
	var Song = mongoose.model('House'); //'Song' model for Hub peeps
	var YoutubeMp3Downloader = require('youtube-mp3-downloader');
	/*var House = mongoose.model('Song');
	
	function moveSongs(){
		var names = ["Sean Reilly", "Moya Vallely"];
		
		House.find({}, function(err, songs){
			for(var i = 0; i < songs.length; i++){
				if(names.indexOf(songs[i].submitted_by) > -1){
					var house = new Song(songs[i]);
					house.save(function(err){
						if(err) {
							console.log(err);
							return;
							//return res.sendStatus(507);
						}
						//else return res.send({song: song});
					});
				}
			}
		});
	}
	moveSongs();*/
	
	function setUpYD(){
		var YD = new YoutubeMp3Downloader({
			"ffmpegPath": "./ffmpeg",        			// Where is the FFmpeg binary located?
			"outputPath": "./mp3",    			// Where should the downloaded and encoded files be stored? 
			"youtubeVideoQuality": "highest",       // What video quality should be used? 
			"queueParallelism": 2,                  // How many parallel downloads/encodes should be started? 
			"progressTimeout": 500                 // How long should be the interval of the progress reports 
		});
		return YD;
	}
	
	var fs = require('fs');
	/*var io = require('socket.io').listen(8621);
	var ss = require('socket.io-stream');
	var stream = ss.createStream();
	var path = require('path');
	var numConnects = 0;
	 
	io.of('/musicStream').on('connection', function(socket) {
		console.log('Connection');
		if(numConnects > 0) {
			numConnects = 0;
		};
		numConnects++;
		//ss(socket).emit('playSong', function(stream, data) {
			//var filename = path.basename('./mp3/Clazzi - How We Feel.mp3');
			//console.log(filename);
			//stream.pipe(fs.createReadStream(filename));
			//fs.createReadStream(filename).pipe(stream);
		//});
		var filename = path.basename('./mp3/Clazzi - How We Feel.mp3');
		ss(socket).emit('playSong', stream);
		fs.createReadStream('./mp3/8. Redbone - Come And Get Your Love.mp3').pipe(stream);
		console.log(stream);
		console.log(fs.createReadStream(filename));
	});*/
	
	app.get('/api/playyou/playSong', function(req, res){
		//console.log(req.headers);
		var rangeHeader = req.get("Range");
		//console.log(rangeHeader);
		if(rangeHeader != null)
		{
		   //return res.sendStatus(200);
		}
		console.log(req.user);
		
		var loc = req.query.loc;
		console.log(loc);
		if(loc == null) return res.sendStatus(406);
		//var loc = './mp3/8. Redbone - Come And Get Your Love.mp3';
		var size = fs.statSync(loc)["size"];
		console.log(size);
		res.writeHead(200, { "Content-Range": "bytes " + 0 + "-" + size-1 + "/" + size, "Accept-Ranges": "bytes", "Content-Length": size, "Content-Type": "audio/mp3" });
		fs.createReadStream(loc).pipe(res);
	});

	app.post('/api/playyou/getVideo', function(req, res){
		
		console.log(req.body.url);
		if(!req.body.url) return res.send(500);
		
		var cp = require('child_process');
		var YD = setUpYD();
		
		YD.download(req.body.url);
		
		YD.on("finished", function(data) {
			console.log("Finished");
			console.dir(data);
			res.send(JSON.stringify({info: data}));
		});
		 
		YD.on("error", function(error) {
			console.log("Error " + error);
		});
		 
		YD.on("progress", function(progress) {
			console.log("Progress:");
			console.log(progress);
		});
	});
	
	app.get('/api/playyou/getSongs', function(req, res){
		var songs = [];
		//if(!req.user) return res.sendStatus(412);
		
		/*for(var i = 0; i < 20; i++){
			var song = {};
			song.title = 'Song ' + i + ' Title';
			song.artist = 'Song ' + i + ' Artist';
			song.person = 'Song ' + i + ' Person';
			song.link = 'https://www.youtube.com/watch?v=hT_nvWreIhg'; //"Song " + i + " Link";
			if(Math.random() < 0.5 )song.voted = true;
			else song.voted = false;
			song.upvotes = Math.floor(Math.random() * 10);
			song.abst = Math.floor(Math.random() * 10);
			song.downvotes = Math.floor(Math.random() * 10);
			song.vote = Math.floor(Math.random() * 3) - 1;
			if(Math.random() < 0.8 && !song.voted) song.vote = null; 
			songs[songs.length] = song;
		}
		songs = orderSongs(songs);*/
		Song.find({}, function(err, songs){
			if(err){
				console.log(err);
				res.sendStatus(510);
			}
			
			for(var i = 0; i < songs.length; i++){
				if(req.user){
					if(songs[i].votes.up.indexOf(req.user._id) > -1) songs[i].vote = 1;				
					else if(songs[i].votes.down.indexOf(req.user._id) > -1) songs[i].vote = -1;
					else if(songs[i].votes.abs.indexOf(req.user._id) > -1) songs[i].vote = 0;
				}
				songs[i].upvotes = songs[i].votes.up.length;
				songs[i].downvotes = songs[i].votes.down.length;
				songs[i].absvotes = songs[i].votes.abs.length;
			}
			//console.log(songs);
			return res.send({songs: songs});
		});
	});
	
	function orderSongs(songs){
		var firstSongs = [];
		var lastSongs = [];
		for(var i = 0; i < songs.length; i++){
			if(!songs[i].voted && songs[i].vote === null) firstSongs[firstSongs.length] = songs[i];
			else lastSongs[lastSongs.length] = songs[i];
		}
		songs = firstSongs.concat(lastSongs);
		return songs;
	}
	
	app.post('/api/playyou/vote', function(req, res){
		if(!req.user) return res.sendStatus(412);
		console.dir(req.body.oldVote);
		console.dir(req.body.newVote);
		console.dir(req.body.songLink);
		
		Song.findOne({'link': req.body.songLink }, function (err, song) {
			if (err){
				console.log(err);
				return res.sendStatus(510);
			}
			
			if(req.body.newVote != undefined){
				if(req.body.newVote == 1){
					song.votes.up.push(req.user._id);
				}
				else if(req.body.newVote == -1){
					song.votes.down.push(req.user._id);
				}
				else{
					song.votes.abs.push(req.user._id);
				}
			}
			
			if(req.body.oldVote != undefined) {
				var remove;
				if(req.body.oldVote == 1){
					remove = song.votes.up.indexOf(req.user._id);
					if(remove > -1) song.votes.up.splice(remove, 1);
				}
				else if(req.body.oldVote == -1){
					remove = song.votes.down.indexOf(req.user._id);
					if(remove > -1) song.votes.down.splice(remove, 1);
				}
				else{
					remove = song.votes.abs.indexOf(req.user._id);
					if(remove > -1) song.votes.abs.splice(remove, 1);
				}
				if(remove == -1) console.log('User ID not found in any vote array');
			}
			
			//if(song.votes.up.length >= Math.ceil((11-song.votes.abs.length)/2)){
			console.log("Up: " + song.votes.up.length);
			console.log("Need: " + Math.ceil((5-song.votes.abs.length)/2));
			if(song.votes.up.length >= Math.ceil((5-song.votes.abs.length)/2)){
				song.status = true;
				if(!song.loc){
					downloadSong(song, res);
				} //else {
				console.log("Saving: " + song.status);
				song.save(function(err){
					if(err){
						console.log(err);
						return res.sendStatus(507);
					}
					return res.sendStatus(200);
				});
				//}
			}
			else {
				song.status = false;
				song.save(function(err){
					if(err) {
						console.log(err);
						return res.sendStatus(507);
					}
					return res.sendStatus(200);
				});
			}
		});
	});
	
	app.post('/api/playyou/addSong', function(req, res){

		var song = new Song(req.body.song);
		console.log(req.user);
		if(req.user){
			song.submitted_by = req.user.name;
			song.votes.up.push(req.user._id);
		} else {
			song.submitted_by = req.body.name;
			song.votes.up.push(req.body._id);
		}
		song.save(function(err){
			if(err) {
				console.log(err);
				return res.sendStatus(507);
			}
			else return res.send({song: song});
		});
	});
	
	function downloadSong(song, res){
		console.log("DL: " + song.link);
		var YD = setUpYD();
		YD.download(song.link);
		
		YD.on("finished", function(data) {
			console.log("Finished");
			console.dir(data);
			song.loc = data.file;
			song.save(function(err){
				if(err){
					console.log(err);
					//return res.sendStatus(507);
				}
				else console.log("Download Loc Saved");
				//return res.sendStatus(200);
			});
		});
		 
		YD.on("error", function(error) {
			console.log("Error " + error);
			//return res.sendStatus(503);
		});
		 
		YD.on("progress", function(progress) {
			console.log("Progress: " + parseFloat(progress.progress.percentage).toFixed(2) + "%");
			//console.log(progress);
		});
	}
	
	app.get('/api/playyou/download', function(req, res){
		/*var getSize = require('get-folder-size');
		
		var FolderSize = 0;
		getSize('mp3', function(err, size) {
			if (err) { throw err; }
			else {
				FolderSize = size;
				console.log(size + ' bytes');
				res.writeHead(200, {
					'Content-Type' : 'application/zip',
					'Content-Length': FolderSize
				});

			}
		});*/
		
		var loc = req.query.loc;
		if(loc === undefined) return res.sendStatus(400);
		console.log(loc);
		
		var archiver = require('archiver');
		var archive = archiver('zip');

		archive.on('error', function(err){
			throw err;
			res.sendStatus(500);
		});

		archive.pipe(res);
		
		if (typeof loc === 'string' || loc instanceof String){
			archive.append(fs.createReadStream(loc), { name: loc.split('./mp3/')[1] });
		} else {
			for(var i = 0; i < loc.length; i++){
				archive.append(fs.createReadStream(loc[i]), { name: loc[i].split('./mp3/')[1] });
			}
		}
		
		archive.finalize();
	});	
	
	app.get('/api/playyou/downloadAll', function(req, res){
		console.log("Hit!");
		
		/*var getSize = require('get-folder-size');
		
		var FolderSize = 0;
		getSize('mp3', function(err, size) {
			if (err) { throw err; }
			else {
				FolderSize = size;
				console.log(size + ' bytes');
				
				res.writeHead(200, {
				  'Content-Type' : 'application/zip',
				  'Content-Length': FolderSize
				});
			}
		});*/
		
		var archiver = require('archiver');
		var archive = archiver('zip');

		archive.on('error', function(err){
			throw err;
			return res.sendStatus(500);
		});
		
		archive.pipe(res);
		
		archive.bulk([
			{ expand: true, cwd: './mp3/', src: ['*.mp3'] }
		]);
		
		archive.finalize();
	});
	

	/*var key = "AIzaSyDjmNPQnA4RqNyYoILp733Jl9MABKQGzXQ";
	var playlist = "PL-rRWrSIsaj2mRdD0J1_TOXa6Ln3Q1N0J";

	var getJSON =require('get-json');
	var songItems = [];
	var names=['Jason','Emily','Luke','David','Kate','Monica','Joanna','Seán','Labhrás','Moya','Eoin', 'Dud'];
	
	function getVideoInfo(token){
		if(!token) getSongs(0);
			var string = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50";
			if(token != 'first') {
				string += '&pageToken=';
				string += token;
			}
			string += "&playlistId=";
			string += playlist;
			string += "&key=";
			string += key;
			getJSON(string, function (err, response){
				if(err){	console.log(err);}
				else{	
					//console.log(response.items);
					songItems = songItems.concat(response.items);
					console.log(response.nextPageToken);
					getVideoInfo(response.nextPageToken);
				}
			});
	}
	//getVideoInfo('first');
	
	function getSongs(num){
		debugger
		var start = 110;
		if(num < start) num = start;
		
		console.log('num: ' + num + ' out of: ' + songItems.length);
		if(num >= songItems.length){
			console.log('Done!!!');
			return;
		}
		
		if(!songItems[num] || !songItems[num].snippet || !songItems[num].snippet.resourceId || !songItems[num].snippet.resourceId.videoId){
			console.log('WRONG DATA!!!');
			console.log('num: ' + num);
			getSongs(num+1);
			return;
		}
		console.log('Passed checks: ' + num);
		
		var song = new Song();
		for(var i = 0; i < 11; i++){
			song.votes.up[i] = i;
		}
		song.submitted_by = names[Math.floor(num/10)];
		song.link = "https://www.youtube.com/watch?v=" + songItems[num].snippet.resourceId.videoId;
		song.status = true;
		console.log('Setup Song: ' + num);
		//console.log(songItems[num]);
		
		var cp = require('child_process');
		
		console.log('Starting DL: ' + num);
		var YD = setUpYD();
		YD.download(song.link);
		
		YD.on("finished", function(data) {
			console.log("Finished");
			//console.dir(data);
			song.loc = data.file;
			song.title = data.title;
			song.artist = data.artist;
			song.save(function(err){
				if(err){
					console.log(err);
				}
				setTimeout(function(){
					console.log('Going to: ' + (num + 1));
					YD = null;
					getSongs(++num);
				}, 1000);
			});
		});
		 
		YD.on("error", function(error) {
			console.log("Error " + error);
			getSongs(++num);
			return;
		});
		 
		YD.on("progress", function(progress) {
			console.log("Progress:" + num + " (" + parseFloat(progress.progress.percentage).toFixed(2) + "%)");
			//console.log(progress);
		});
		
		YD.on("queueSize", function(size) {
			console.log(size);
		});
	}*/
};