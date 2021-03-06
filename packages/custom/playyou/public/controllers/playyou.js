'use strict';

Array.prototype.last = function() {
    return this[this.length-1];
}

Array.prototype.rotate = (function() {
    var unshift = Array.prototype.unshift,
        splice = Array.prototype.splice;

    return function(count) {
        var len = this.length >>> 0,
            count = count >> 0;

        unshift.apply(this, splice.call(this, count % len, len));
        return this;
    };
})();

//window.onerror = function(message, source, lineno, colno) {alert('Hi');}
/*window.addEventListener('error', function(error) {
	alert('Error');
});*/

//notThere();

/* jshint -W098 */
angular.module('mean.playyou').controller('PlayyouController', ['$scope', '$rootScope', 'Global', '$http', 'MeanUser', '$sce', 'Playyou', 'socket',
  function($scope, $rootScope, Global, $http, MeanUser, $sce, Playyou, socket) {
    $scope.global = Global;
    $scope.package = {
      name: 'playyou'
    };
	
	$scope.loggedIn = false;
	$scope.onRandom = false;
	$scope.limit = 50;
	//var LinearPos; //LinearPosition of the song in the array when playing normally in a row
	$scope.songs = [];
	$scope.currSong = {};
	var baseUrl = 'https://eoinmaguire.com/api/playyou/playSong?loc=';
	//var audio = document.getElementById('audio');
	var audio = new Audio();
	audio.volume = 0.8;
	audio.preload = 'auto';
	audio.addEventListener('timeupdate', progressBar, true);
	audio.addEventListener('loadedmetadata', loadedMetaData, true);
	$scope.duration = '0:00';
	$scope.currTime = '0:00';
	//window.AudioContext = window.AudioContext||window.webkitAudioContext;
	//var context = new AudioContext();
	var sliding = false; //stops seekbar from moving with music while a user is sliding it
	var seekbar = $('#seekbar').slider({ //initialise seekbar slider
		formatter: function(value) {
			var time = audio.duration * (value / 1000);
			if(isNaN(time)) return '0:00';
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
		
		if($scope.onRandom){ //if now on random
			var randomPlaylist = $scope.songs.splice(1, $scope.songs.length); //allSongs but the current playing song
			randomPlaylist = shuffle(randomPlaylist);
			randomPlaylist.unshift($scope.songs[0]);
			$scope.songs = randomPlaylist;
		} else {
			var index = indexPos($scope.songs[0], $scope.OGsongs);
			var tempArray = $scope.OGsongs.slice();
			$scope.songs = tempArray.splice(index, tempArray.length).concat(tempArray.splice(0, index));
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
	
	function indexPos(el, a){
		for(var i = 0; i < a.length; i++){
			if(el.link === a[i].link) return i;
		}
		return -1;
	}
	
	$scope.nextSong = function(){
		seekbar.slider('setValue', 0); //takes a while to do the next steps which eventuallSongsy auto set time to 0. Do here instead.
		/*$scope.currSong.title = $scope.songs[LinearPos].title;
		$scope.currSong.artist = $scope.songs[LinearPos].artist;
		$scope.currSong.submitted_by = $scope.songs[LinearPos].submitted_by;*/
		$scope.currSong = $scope.songs[0];
		document.title = $scope.currSong.title + ' - PlayYou';
		var playSongLoc = $scope.currSong.loc;
		audio.src = baseUrl + encodeURIComponent(playSongLoc);
		audio.load();
		/*$http.get('/api/playyou/playSong?loc=' + encodeURIComponent(playSongLoc))
		.success(function(data){
			//console.dir(data);
			console.log('Success');
			var source = context.createBufferSource(); // creates a sound source
			context.decodeAudioData(data, function(buffer){
			source.buffer = buffer;                    // tell the source which sound to play
			source.connect(context.destination);       // connect the source to the context's destination (the speakers)
			source.start(0);
			});
		})
		.error(function(data, status){
			alert('Error: ' + status);
		});*/
	}
	
	audio.onended = function(){
		$scope.skipNext();
		$scope.$apply();
	}
	
	$scope.skipNext = function(startPlaying){
		var tempSong = 1;
		while(!$scope.songs[tempSong].loc || !$scope.checkVotes($scope.songs[tempSong]) || !$scope.songs[tempSong].status){
			tempSong++;
		}
		var tempArray = $scope.songs.slice();
		$scope.songs = tempArray.rotate(tempSong);
		$scope.nextSong();
		if(startPlaying !== false) {
			audio.play();
			$scope.playing = true;
		}
	}
	
	$scope.skipPrev = function(){
		if(audio.currentTime > 5) {
			audio.currentTime = 0;
		} else {
			var tempSong = $scope.songs.length - 1;
			while(!$scope.songs[tempSong].loc || !$scope.checkVotes($scope.songs[tempSong]) || !$scope.songs[tempSong].status){
				tempSong--;
			}
			var tempArray = $scope.songs.slice();
			$scope.songs = tempArray.rotate(tempSong);
			console.log($scope.songs.length);
			$scope.nextSong();
			audio.play();
			$scope.playing = true;
		}
	}
	
	$scope.searchPlayThis = function(song) {
		$('#searchDiv').blur();
		$scope.interacting = $scope.searching = false;
		$scope.playThis(song);
	}
	
	$scope.playThis = function(song){
		if($scope.selecting) return;
		if(song.link === $scope.currSong.link) $scope.changePlayState();
		else {
			var tempSong = 0;
			while($scope.songs[tempSong].link !== song.link){
				tempSong++;
			}
			var tempArray = $scope.songs.slice();
			$scope.songs = tempArray.splice(tempSong, tempArray.length).concat(tempArray.splice(0, tempSong));
			$('html,body').animate({scrollTop: 0}, 1000);
			$scope.nextSong();
			audio.play();
			$scope.playing = true;
		}
	}
	
	window.onkeydown = function (KeyEvent) {
		//console.log(KeyEvent.keyCode);
		if(KeyEvent.target.tagName === 'INPUT') return;
		if (KeyEvent.keyCode === 32 || KeyEvent.keyCode === 179){
			KeyEvent.preventDefault();
			$scope.changePlayState();
		}
		else if(KeyEvent.which === 39){
			audio.currentTime += 10;
		}
		else if(KeyEvent.which === 37){
			if(audio.currentTime <= 5) {
				$scope.skipPrev();
				return;
			}
			audio.currentTime -= 10;
		}
		else if(KeyEvent.which === 38){
			KeyEvent.preventDefault();
			volumePopIn();
			var v = volume.slider('getValue');
			v += 10;
			if(v > 100) v = 100;
			changeVolume(v);
		}
		else if(KeyEvent.which === 40){
			KeyEvent.preventDefault();
			volumePopIn();
			var v = volume.slider('getValue');
			v -= 10;
			if(v < 0) v = 0;
			changeVolume(v);
		}
		else if(KeyEvent.which === 78){
			$scope.skipNext();
		}
		else if(KeyEvent.which === 66){
			$scope.skipPrev();
		}
		else if(KeyEvent.which === 82){
			$scope.random()
			$scope.$apply()
		}
	}
	
	function volumePopIn() {		
		$('#volume').children('div.tooltip-main').addClass('in');
		setTimeout(function(){ $('#volume').children().removeClass('in'); }, 1000);
	}
	
	var volumeScrollFN = function(e) {
		//console.log(e.wheelDelta);
		
		if($scope.volumeScroll) {
			e.preventDefault();
			var v = volume.slider('getValue');
			if(e.wheelDelta > 0) v += Math.ceil(e.wheelDelta / 120);
			else v += Math.floor(e.wheelDelta / 120);
			if(v > 100) v = 100;
			else if(v < 0) v = 0;
			changeVolume(v);
		}
	};

	if ('onmousewheel' in document) {
		document.onmousewheel = volumeScrollFN;
	} else {
		document.addEventListener('DOMMouseScroll', volumeScrollFN, false);
	}

	function changeVolume(v){
		volume.slider('setValue', v);
		audio.volume = v/100;
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

	/*var socket = io.connect('http://eoinmaguire.com:8080/musicStream');
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
	  
	  var audio = document.getElementById('audio');
	});*/
	
	//stream.pipe(fs.createWriteStream('song.mp3'));
	
	/*$scope.getUrl = function(url){
		$http.post('/api/playyou/getVideo', {'url': url})
		.success(function(data){
			console.dir(data.info);
		});
	}*/
	
	$scope.increaseLimit = function(){
		if($scope.songs === [] || $scope.limit >= $scope.songs.length) return;
		$scope.limit += 50;
	}
	
	$scope.voteFilter = function(song){
		if(song.upvotes === 11) return false;
		if(!$scope.checkVotes(song) || song.vote === null || song.vote === undefined) return true;
		return false;
	}
	
	$scope.getSongs = function(){
		$http.get('/api/playyou/getSongs')
		.success(function(data){
			console.dir(data.songs);
			$scope.songs = $scope.OGsongs = data.songs;
			$scope.skipNext(false);
			//$scope.changePlayState();
		})
		.error(function(data, status){
			alert('Error: ' + status);
		});
	}
	
	String.prototype.contains = function(substring) {
		if(emptyString(substring)) return -1;
		return this.toLowerCase().indexOf(substring.toLowerCase());
	};
	
	$scope.searchFilter = function(song) {
		if(emptyString($scope.searchParam)) return false;
		if(song.title.contains($scope.searchParam) !== -1) return true;
		if(song.artist.contains($scope.searchParam) !== -1) return true;
		return false;
	}
	
	$scope.searchBold = function(str) {
		var cutOffPoint = str.contains($scope.searchParam);
		if(cutOffPoint === -1) return str;
		return str.substring(0, cutOffPoint) + '<span class="searchBoldColor">' + str.substring(cutOffPoint, cutOffPoint + $scope.searchParam.length) + '</span>' + str.substring(cutOffPoint + $scope.searchParam.length);
	}
	
	$scope.necessaryVotes = 0.6;
	
	$scope.checkVotes = function(song){
		if(song.upvotes < 3) return false;
		var ups = song.upvotes + song.absvotes / 3;
		var total = ups + song.downvotes;
		
		return (ups/total > $scope.necessaryVotes);
	}
	
	$scope.songVote = function(song, v){
		if($scope.checkVotes(song) && $scope.selecting) return;
		if(song.upvotes === 11) return;
		if(!$scope.loggedIn) return;
		console.log(song.upvotes);
		
		if(song.vote === 1) song.upvotes--;
		else if(song.vote === 0) song.absvotes--;
		else if(song.vote === -1) song.downvotes--;
		
		if(song.vote === v) v = null;
		else if(v === 1) song.upvotes++;
		else if(v === 0) song.absvotes++;
		else if(v === -1) song.downvotes++;
		
		if($scope.checkVotes(song)) song.status = true;
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
		var allSongs = true;
		for(var i = 0; i < $scope.songs.length; i++){
			if($scope.songs[i].notSelected){
				allSongs = false;
				break;
			}
		}
		
		if(allSongs){
			for(var i = 0; i < $scope.songs.length; i++){
				$scope.songs[i].notSelected = true;
			}
		} else {
			for(var i = 0; i < $scope.songs.length; i++){
				$scope.songs[i].notSelected = false;
			}
		}
	}
	
	$scope.songsToVote = function() {
		$scope.votableSongs = 0;
		if(!$scope.songs) return true;
		for(var i = 0; i < $scope.songs.length; i++){
			if(($scope.songs[i].vote === undefined || $scope.songs[i].vote === null) && $scope.songs[i].upvotes !== 11) $scope.votableSongs++;
		}
		return ($scope.votableSongs === 0);
	}
	
	$scope.countPlaylist = function() {
		$scope.playlistCount = 0;
		if(!$scope.songs) return true;
		for(var i = 0; i < $scope.songs.length; i++){
			if($scope.checkVotes($scope.songs[i])) $scope.playlistCount++;
		}
		return ($scope.playlistCount === 0);
	}
	
	$scope.countDownload = function(){
		$scope.downloadCount = 0;
		if(!$scope.songs) return true;
		for(var i = 0; i < $scope.songs.length; i++){
			if(!$scope.songs[i].notSelected && $scope.checkVotes($scope.songs[i]) && $scope.songs[i].status && $scope.songs[i].loc) $scope.downloadCount++;
		}
		console.log($scope.downloadCount);
		return ($scope.downloadCount === 0);
	}
	
	$scope.download = function(){
		var hrefText = '';
		for(var i = 0; i < $scope.songs.length; i++){
			if(!$scope.songs[i].notSelected && $scope.checkVotes($scope.songs[i]) && $scope.songs[i].status && $scope.songs[i].loc){
				if(hrefText !== '') hrefText += '&';
				hrefText += 'loc=';
				hrefText += encodeURIComponent($scope.songs[i].loc);
			}
		}
		console.log(hrefText);
		if(hrefText === '') return;
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
			alert('Error: ' + status);
		});
		*/
	}
	
	$scope.correctTitle = ' ';
	$scope.correctLink = ' ';
	
	$scope.checkTitle = function(title){
		for(var i = 0; i < $scope.songs.length; i++){
			if(title.toLowerCase() === $scope.songs[i].title.toLowerCase()){
				$scope.correctTitle = 'Song Title Already Submitted by: ' + $scope.songs[i].submitted_by;
				return;
			} else {
				$scope.correctTitle = null;
			}
		}
	}
	
	$scope.checkLink = function(link){
		console.log(link);
		if(emptyString(link)) { $scope.correctLink = 'Please Enter a Correct Link'; $scope.$apply(); return; }
		if(link.length == 11) link = 'https://www.youtube.com/watch?v=' + link; //just the 11 char video id
		var ytReg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i;
		var vID = link.match(ytReg) || ['', '']; //second string will always be video id, or it could return null
		vID = vID[1];
		if(emptyString(vID)) { $scope.correctLink = 'Youtube VideoID Not Present'; return; }
		$scope.newSong.link = link;
		if(PlaylistLink(link)) { return; }
		else {
			var url = 'https://www.googleapis.com/youtube/v3/videos';
			var videoId = 'id=' + vID;
			var apiKey = 'key=AIzaSyAaSh1l3C8s06zSRyNSh-GUnQr7nhZyHxo';
			var part = 'part=snippet';
			var field = 'fields=items(snippet(title))';

			$.get(url + '?' + apiKey + '&' + videoId + '&' + field + '&' + part, function(response) {
				console.log(response);
				//if(response.pageInfo.totalResults > 0) {$scope.correctLink = null; $scope.$apply();}
				if(response.items[0]) {
					var guess = response.items[0].snippet.title.split(' - ');
					console.log(guess);
					//if(guess.length > 1){
						if(emptyString($scope.newSong.title) && guess[1]) {
							$scope.newSong.title = guess[1];
							$scope.checkTitle($scope.newSong.title);
						}
						if(emptyString($scope.newSong.artist) && guess[0]) $scope.newSong.artist = guess[0];
					//}
					$scope.newSong.link = 'https://www.youtube.com/watch?v=' + vID;
					$scope.correctLink = null;
					$scope.$apply();
				}
				else { $scope.correctLink = 'Youtube Link Not Valid'; $scope.$apply();}
			});
		}
	}
	
	function emptyString(str){
		return (str === '' || str === undefined || str === null);
	}
	
	function PlaylistLink(link){
		for(var i = 0; i < $scope.songs.length; i++){
			if($scope.songs[i].link === link) {
				$scope.correctLink = 'That Song Has Already Been Submitted by: ' + $scope.songs[i].submitted_by;
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
			/*song.submitted_by = MeanUser.user.name;
			song.upvotes = 1;
			song.absvotes = 0;
			song.downvotes = 0;
			song.vote = 1;
			$scope.songs[$scope.songs.length] = (song);*/
		})
		.error(function(data, status){
			alert('Error: ' + status);
		});
	}
	
	$('#newSongModal').on('hidden.bs.modal', function () {
		$scope.newSong = undefined;
		$scope.correctLink = ' ';
		$scope.$apply();
	});
	
	$scope.currVideo = {};
	
	$scope.searchPlayVideo = function(song) {
		$('#searchDiv').blur();
		$scope.interacting = $scope.searching = false;
		$scope.playVideo(song);
	}
	
	$scope.playVideo = function(song){
		if($scope.selecting) return;
		console.dir(song);
		var lk = 'https://www.youtube.com/embed/' + song.link.split('v=')[1];
		$scope.currVideo = song;
		$scope.currVideo.embedLink = $sce.trustAsResourceUrl(lk);
		console.log($scope.currVideo.embedLink);
		$('#currVideoModal').modal('show');
	}
	
	$('#currVideoModal').on('hidden.bs.modal', function () {
		$scope.currVideo = {};
		$scope.currVideo.link = '';
		console.dir($('#currVideoFrame')[0]);
		$('#currVideoFrame')[0].src = '';
		$scope.$apply();
	});
	
	socket.on('newSong', function (data) {
		//console.dir(data.song);
		if(!$scope.songs || $scope.songs.length < 100 || !$scope.OGsongs || $scope.OGsongs.length < 100) return;
		if(!data.song.absvotes) data.song.absvotes = 0;
		if(!data.song.downvotes) data.song.downvotes = 0;
		if($scope.loggedIn && data.song.submitted_by === MeanUser.user.name) data.song.vote = 1;
		$scope.OGsongs.unshift(data.song);
		$scope.songs.unshift(data.song);
	});
	
	socket.on('voteChange', function (data) {
		for(var i = 0; i < $scope.songs.length; i++) {
			if(voteChange($scope.songs[i], data.song)) break;
		}
		
		for(var i = 0; i < $scope.OGsongs.length; i++) {
			if(voteChange($scope.OGsongs[i], data.song)) break;
		}
	});
	
	function voteChange(song, emitSong) {
		if(song.link === emitSong.link) {
			song.upvotes = emitSong.up.length;
			song.absvotes = emitSong.abs.length;
			song.downvotes = emitSong.down.length;
			if($scope.loggedIn){
				if(emitSong.up.indexOf(MeanUser.user._id) >= 0) song.vote = 1;
				else if(emitSong.abs.indexOf(MeanUser.user._id) >= 0) song.vote = 0;
				else if(emitSong.down.indexOf(MeanUser.user._id) >= 0) song.vote = -1;
				else song.vote = null;
			}
			return true;
		}
		return false;
	}
	
	$scope.getSongs();
  }
]).factory('socket', function($rootScope){
    //Creating connection with server
    var socket = io();

    return {
		on: function (eventName, callback) {
		  socket.on(eventName, function () {  
			var args = arguments;
			$rootScope.$apply(function () {
			  callback.apply(socket, args);
			});
		  });
		},
		emit: function (eventName, data, callback) {
		  socket.emit(eventName, data, function () {
			var args = arguments;
			$rootScope.$apply(function () {
			  if (callback) {
				callback.apply(socket, args);
			  }
			});
		  })
		}
	};
});

