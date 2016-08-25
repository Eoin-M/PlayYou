'use strict';

//window.onerror = function(message, source, lineno, colno) {alert("Hi");}
/*window.addEventListener("error", function(error) {
	alert('Error');
});*/

//notThere();

/* jshint -W098 */
angular.module('mean.playyou').controller('PlayyouController', ['$scope', '$rootScope', 'Global', '$http', 'MeanUser', '$sce', 'Playyou',
  function($scope, $rootScope, Global, $http, MeanUser, $sce, Playyou) {
    $scope.global = Global;
    $scope.package = {
      name: 'playyou'
    };
	
	$scope.loggedIn = false;
	$scope.onRandom = false;
	var LinearPos; //LinearPosition of the song in the array when playing normally in a row
	var RandomPos;
	$scope.currSong = {};
	var baseUrl = 'http://danu7.it.nuigalway.ie:8620/api/playyou/playSong?loc=';
	//var audio = document.getElementById('audio');
	var audio = new Audio();
	audio.volume = 0.8;
	audio.preload = "auto";
	audio.addEventListener("timeupdate", progressBar, true);
	audio.addEventListener("loadedmetadata", loadedMetaData, true);
	$scope.duration = "0:00";
	$scope.currTime = "0:00";
	//window.AudioContext = window.AudioContext||window.webkitAudioContext;
	//var context = new AudioContext();
	var sliding = false; //stops seekbar from moving with music while a user is sliding it
	var seekbar = $('#seekbar').slider({ //initialise seekbar slider
		formatter: function(value) {
			var time = audio.duration * (value / 1000);
			if(isNaN(time)) return "0:00";
			return formatTime(time);
		}
	})
	.on('slide', function(){sliding = true;})
	.on('slideStop', seekAudio);
	
	var sliding = false;
	var volume = $('#volume').slider({
		reversed : true
	})
	.on('slide', setVolume);
	
	function formatTime(time){
		if(isNaN(time)) return 0;
		var minutes = Math.floor(time / 60);
		var seconds = Math.floor(time - minutes * 60);
		
		var finalTime = str_pad_left(minutes,'',2)+':'+str_pad_left(seconds,'0',2);
		return finalTime;
	}
	
	function str_pad_left(string,pad,length) {
		return (new Array(length+1).join(pad)+string).slice(-length);
	}
		
	function seekAudio(){
		console.log(seekbar.slider('getValue') / 1000);
		console.log(audio.duration);
		console.log(audio.duration * (seekbar.slider('getValue') / 1000));
		audio.currentTime = audio.duration * (seekbar.slider('getValue') / 1000);
		sliding = false;
	}
	
	function progressBar(){
		if(sliding) return;
		var progress = (audio.currentTime/audio.duration) * 1000;
		seekbar.slider('setValue', progress);
		$scope.currTime = formatTime(audio.currentTime);
		$scope.$apply();
	}
	
	function setVolume(){
		audio.volume = volume.slider('getValue') / 100; //volume ranges from 0-1
	}
	
	function loadedMetaData(){
		$scope.duration = formatTime(audio.duration);
		$scope.$apply();
	}
	
	$scope.changePlayState = function(){
		$scope.playing = !$scope.playing;
		if($scope.playing){
			audio.play();
		} else {
			audio.pause();
		}
	}
	
	$scope.random = function(){
		$scope.onRandom = !$scope.onRandom;
		if($scope.songs.length < 40) return; //don't really know why I put this here. Only causes problems.
		
		if($scope.onRandom){
			/*for(var i = 0; i < $scope.songs.length; i++){
				var step = 0;
				if(i != LinearPos){
					randomPlaylist[i + step] = i;
				}
				else step = -1;
			}
			randomPlaylist = shuffle(randomPlaylist);
			randomPlaylist[randomPlaylist.length] = LinearPos;
			RandomPos = randomPlaylist.length - 1;*/
			var randomPlaylist = [];
			
			var step = 0;
			for(var i = 0; i < $scope.songs.length; i++){
				if(i != LinearPos){
					randomPlaylist[i + step] = $scope.songs[i];
				}
				else step = -1;
			}
			randomPlaylist = shuffle(randomPlaylist);
			randomPlaylist[randomPlaylist.length] = $scope.songs[LinearPos];
			LinearPos = randomPlaylist.length - 1;
			$scope.songs = randomPlaylist;
		} else {
			LinearPos = indexPos($scope.OGsongs, $scope.songs[LinearPos]);
			$scope.songs = $scope.OGsongs;
		}
	}
	
	function shuffle(array) {
		var counter = array.length;

		// While there are elements in the array
		while (counter > 0) {
			// Pick a random index
			var index = Math.floor(Math.random() * counter);

			// Decrease counter by 1
			counter--;

			// And swap the last element with it
			var temp = array[counter];
			array[counter] = array[index];
			array[index] = temp;
		}

		return array;
	}
	
	function indexPos(a, el){
		for(var i = 0; i < a.length; i++){
			if(el.link == a[i].link) return i;
		}
		return -1;
	}
	
	$scope.nextSong = function(){
		seekbar.slider('setValue', 0); //takes a while to do the next steps which eventually auto set time to 0. Do here instead.
		if(LinearPos >= $scope.songs.length) LinearPos = 0;
		console.log(LinearPos);
		console.dir($scope.songs[LinearPos].loc);
		/*$scope.currSong.title = $scope.songs[LinearPos].title;
		$scope.currSong.artist = $scope.songs[LinearPos].artist;
		$scope.currSong.submitted_by = $scope.songs[LinearPos].submitted_by;*/
		$scope.currSong = $scope.songs[LinearPos];
		var playSongLoc = $scope.songs[LinearPos].loc;
		audio.src = baseUrl + encodeURIComponent(playSongLoc);
		audio.load();
		/*$http.get('/api/playyou/playSong?loc=' + encodeURIComponent(playSongLoc))
		.success(function(data){
			//console.dir(data);
			console.log("Success");
			var source = context.createBufferSource(); // creates a sound source
			context.decodeAudioData(data, function(buffer){
			source.buffer = buffer;                    // tell the source which sound to play
			source.connect(context.destination);       // connect the source to the context's destination (the speakers)
			source.start(0);
			});
		})
		.error(function(data, status){
			alert("Error: " + status);
		});*/
	}
	
	audio.onended = function(){
		$scope.skipNext();
		$scope.$apply();
	}
	
	$scope.skipPrev = function(){
		console.log(audio.currentTime/audio.duration);
		if(audio.currentTime > 5) {
			//audio.pause();
			audio.currentTime = 0;
			//audio.play();
		} else {
			/*if($scope.onRandom) {
				RandomPos++;
				if(RandomPos == randomPlaylist.length) RandomPos = 0;
				LinearPos = randomPlaylist[RandomPos];
			} else {
				LinearPos++;
				if(LinearPos == $scope.songs.length) LinearPos = 0;
			}*/
			LinearPos++;
			if(LinearPos == $scope.songs.length) LinearPos = 0;
			if(!$scope.songs[LinearPos].loc || !$scope.songs[LinearPos].status){
				$scope.skipPrev();
				return;
			}
			$scope.nextSong();
			audio.play();
			$scope.playing = true;
		}
	}
	
	$scope.skipNext = function(){
		/*if($scope.onRandom){
			RandomPos--;
			if(RandomPos < 0) RandomPos = randomPlaylist.length - 1;
			LinearPos = randomPlaylist[RandomPos];
		} else {
			LinearPos--;
			if(LinearPos < 0) LinearPos = $scope.songs.length - 1;
		}*/
		LinearPos--;
		if(LinearPos < 0) LinearPos = $scope.songs.length - 1;
		if(!$scope.songs[LinearPos].loc || !$scope.songs[LinearPos].status){
			$scope.skipNext();
			return;
		}
		$scope.nextSong();
		audio.play();
		$scope.playing = true;
	}
	
	window.onkeydown = function (KeyEvent) {
		if(KeyEvent.target.tagName == 'INPUT') return;
		if (KeyEvent.keyCode === 32){
			KeyEvent.preventDefault();
			$scope.changePlayState();
		}
		else if(KeyEvent.which == 39){
			audio.currentTime += 10;
		}
		else if(KeyEvent.which == 37){
			if(audio.currentTime <= 5) {
				$scope.skipPrev();
				return;
			}
			audio.currentTime -= 10;
		}
		else if(KeyEvent.which == 38){
			KeyEvent.preventDefault();
			var v = volume.slider('getValue');
			v += 10;
			if(v > 100) v = 100;
			changeVolume(v);
		}
		else if(KeyEvent.which == 40){
			KeyEvent.preventDefault();
			var v = volume.slider('getValue');
			v -= 10;
			if(v < 0) v = 0;
			changeVolume(v);
		}
	}

	function changeVolume(v){
		volume.slider('setValue', v);
		audio.volume = v/100;
	}
	
	$scope.playThis = function(song){
		if($scope.selecting) return;
		if(song.link == $scope.currSong.link) $scope.changePlayState();
		else {
			LinearPos = indexPos($scope.songs, song) + 1;
			$scope.skipNext();
		}
	}
	
	if(MeanUser && MeanUser.user && MeanUser.user.name){
		$scope.loggedIn = true;
	}
	
	$rootScope.$on('loggedin', function(){
		$scope.loggedIn = true;
	});
	
	$rootScope.$on('logout', function(){
		$scope.loggedIn = false;
	});
	
	//var io = require('socket.io-client');
	//var ss = require('socket.io-stream');

	/*var socket = io.connect('http://danu7.it.nuigalway.ie:8621/musicStream');
	//var stream = ss.createStream();
	//var filename = 'profile.jpg';

	ss(socket).on('playSong', function(stream){
		console.log(stream);
		
	  
	  var songParts = [];
	  
	  stream.on('end', function(){
		  console.log('End');
	  });
	  
	  stream.on('data', function(data){
		  console.log('data');
		  songParts.push(data);
		  audio.src = (window.URL || window.webkitURL).createObjectURL(new Blob(songParts));
		  console.log(audio.src);
	  });
	  
	  var audio = document.getElementById("audio");
	});*/
	
	//stream.pipe(fs.createWriteStream('song.mp3'));
	
	/*$scope.getUrl = function(url){
		$http.post('/api/playyou/getVideo', {'url': url})
		.success(function(data){
			console.dir(data.info);
		});
	}*/
	
	$scope.getSongs = function(){
		$http.get('/api/playyou/getSongs')
		.success(function(data){
			console.dir(data.songs);
			$scope.songs = $scope.OGsongs = data.songs;
			LinearPos = $scope.songs.length;
			console.log(LinearPos);
			$scope.skipNext();
			$scope.changePlayState();
		})
		.error(function(data, status){
			alert("Error: " + status);
		});
	}
	
	$scope.songVote = function(song, v){
		if(song.status && $scope.selecting) return;
		if(song.upvotes == 11) return;
		if(!$scope.loggedIn) return;
		console.log(song.upvotes);
		
		if(song.vote == 1) song.upvotes--;
		else if(song.vote == 0) song.absvotes--;
		else if(song.vote == -1) song.downvotes--;
		
		if(song.vote == v) v = null;
		else if(v == 1) song.upvotes++;
		else if(v == 0) song.absvotes++;
		else if(v == -1) song.downvotes++;
		
		if(song.upvotes >= Math.ceil((5-song.absvotes)/2)) song.status = true;
		else song.status = false;
		
		console.log(song.vote);
		console.log(v);
		console.log(song.link);
		$http.post('/api/playyou/vote', {oldVote: song.vote, newVote: v, songLink: song.link})
		.success(function(data){
			console.log('Success');
		})
		.error(function(data, status){
			alert('Error: ' + status);
		});
		
		song.vote = v;
	}
	
	$scope.selecting = false;
	
	$scope.selectToDownload = function(){
		$scope.selecting = !$scope.selecting;
	}
	
	$scope.selectSong = function(song){
		if(!$scope.selecting) return;
		
		song.notSelected = !song.notSelected;
	}
	
	$scope.selectDeselect = function(){
		var all = true;
		for(var i = 0; i < $scope.songs.length; i++){
			if($scope.songs[i].notSelected){
				all = false;
				break;
			}
		}
		
		if(all){
			for(var i = 0; i < $scope.songs.length; i++){
				$scope.songs[i].notSelected = true;
			}
		} else {
			for(var i = 0; i < $scope.songs.length; i++){
				$scope.songs[i].notSelected = false;
			}
		}
	}
	
	$scope.countDownload = function(){
		$scope.downloadCount = 0;
		if(!$scope.songs) return true;
		for(var i = 0; i < $scope.songs.length; i++){
			if(!$scope.songs[i].notSelected && $scope.songs[i].status && $scope.songs[i].loc) $scope.downloadCount++;
		}
		console.log($scope.downloadCount);
		return ($scope.downloadCount == 0);
	}
	
	$scope.download = function(){
		var hrefText = '';
		for(var i = 0; i < $scope.songs.length; i++){
			if(!$scope.songs[i].notSelected && $scope.songs[i].status && $scope.songs[i].loc){
				if(hrefText != '') hrefText += '&';
				hrefText += 'loc=';
				hrefText += encodeURIComponent($scope.songs[i].loc);
			}
		}
		console.log(hrefText);
		if(hrefText == '') return;
		console.log('loc=' + encodeURIComponent($scope.songs[0].loc) + '&loc=' + encodeURIComponent($scope.songs[1].loc));
		
		var anchor = angular.element('<a/>');
		anchor.attr({
			href: '/api/playyou/download?' + hrefText,
			target: '_self',
			download: 'songs.zip'
		})[0].click();
		
		$scope.selecting = false;
		
		/*
		$http.get('/api/playyou/download')
		.success(function(data){
			var anchor = angular.element('<a/>');
			 anchor.attr({
				 href: 'data:attachment/mp3,' + encodeURI(data),
				 target: '_self',
				 download: 'playlist.zip'
			 })[0].click();
		})
		.error(function(data, status){
			alert("Error: " + status);
		});
		*/
	}
	
	$scope.correctTitle = " ";
	$scope.correctLink = " ";
	
	$scope.checkTitle = function(title){
		for(var i = 0; i < $scope.songs.length; i++){
			if(title.toLowerCase() == $scope.songs[i].title.toLowerCase()){
				$scope.correctTitle = "Song Title Already Submitted by: " + $scope.songs[i].submitted_by;
				return;
			} else {
				$scope.correctTitle = null;
			}
		}
	}
	
	$scope.checkLink = function(link){
		console.log(link);
		if(link === undefined || link == "") { $scope.correctLink = "Please Enter a Correct Link"; $scope.$apply(); return; }
		var correctLength = link.split("&");
		if(correctLength.length > 1) link = correctLength[0];
		var vID = link.split('v=');
		if(vID[1] === null || vID[1] === undefined) { $scope.correctLink = "Youtube VideoID Not Present"; return; }
		vID = vID[1].split("&");
		vID = vID[0];
		$scope.newSong.link = link;
		if(PlaylistLink(link)) { return; }
		else {
			var url = "https://www.googleapis.com/youtube/v3/videos";
			var videoId = "id=" + vID;
			var apiKey = "key=AIzaSyAaSh1l3C8s06zSRyNSh-GUnQr7nhZyHxo";
			var part = "part=snippet";
			var field = "fields=items(snippet(title))";

			$.get(url + "?" + apiKey + "&" + videoId + "&" + field + "&" + part, function(response) {
				console.log(response);
				//if(response.pageInfo.totalResults > 0) {$scope.correctLink = null; $scope.$apply();}
				if(response.items[0]) {
					var guess = response.items[0].snippet.title.split(" - ");
					console.log(guess);
					//if(guess.length > 1){
						if(emptyString($scope.newSong.title) && guess[1]) {
							$scope.newSong.title = guess[1];
							$scope.checkTitle($scope.newSong.title);
						}
						if(emptyString($scope.newSong.artist) && guess[0]) $scope.newSong.artist = guess[0];
					//}
					$scope.correctLink = null;
					$scope.$apply();
				}
				else { $scope.correctLink = "Youtube Link Not Valid"; $scope.$apply();}
			});
		}
	}
	
	function emptyString(str){
		return (str == "" || str == undefined);
	}
	
	function PlaylistLink(link){
		for(var i = 0; i < $scope.songs.length; i++){
			if($scope.songs[i].link == link) {
				$scope.correctLink = "That Song Has Already Been Submitted by: " + $scope.songs[i].submitted_by;
				return true;
			}
		}
		console.log('Not Already in Playlist');
		return false;
	}
	
	$scope.addSong = function(song){
		if(!$scope.loggedIn) return;
		
		$http.post('/api/playyou/addSong', {song: song})
		.success(function(data){
			console.log('Success');
			song.submitted_by = MeanUser.user.name;
			song.upvotes = 1;
			song.absvotes = 0;
			song.downvotes = 0;
			song.vote = 1;
			$scope.songs[$scope.songs.length] = (song);
		})
		.error(function(data, status){
			alert('Error: ' + status);
		});
	}
	
	$('#newSongModal').on('hidden.bs.modal', function () {
		$scope.newSong = undefined;
		$scope.correctLink = " ";
		$scope.$apply();
	});
	
	$scope.currVideo = {};
	
	$scope.playSong = function(song){
		if($scope.selecting) return;
		console.dir(song);
		var lk = 'http://www.youtube.com/embed/' + song.link.split('v=')[1];
		$scope.currVideo.title = song.title;
		$scope.currVideo.artist = song.artist;
		$scope.currVideo.link = $sce.trustAsResourceUrl(lk);
		console.log($scope.currVideo.link);
		$('#currVideoModal').modal('show');
	}
	
	$('#currVideoModal').on('hidden.bs.modal', function () {
		$scope.currVideo = {};
		$scope.currVideo.link = '';
		console.dir($('#currVideoFrame')[0]);
		$('#currVideoFrame')[0].src = '';
		$scope.$apply();
	});
	
	$scope.getSongs();
  }
]);
