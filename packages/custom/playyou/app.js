'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Playyou = new Module('playyou');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Playyou.register(function(app, auth, database, https) {

  //We enable routing. By default the Package Object is passed to the routes
  Playyou.routes(app, auth, database, https);
  
  /*Playyou.menus.add({
    title: 'playyou example page',
    link: 'playyou example page',
    roles: ['authenticated'],
    menu: 'main'
  });*/
  
  Playyou.aggregateAsset('css', 'playyou.css');
  /*Playyou.aggregateAsset('css', 'jplayer.blue.monday.min.css');
  Playyou.aggregateAsset('css', 'jplayer.pink.flag.min.css');
  Playyou.aggregateAsset('js', 'socket.io-stream.js');
  Playyou.aggregateAsset('js', 'socket.io.js');
  Playyou.aggregateAsset('js', 'jquery.jplayer.min.js');*/
  Playyou.aggregateAsset('js', 'socket.io.js');
  
  Playyou.angularDependencies(['infinite-scroll']);

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Playyou.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Playyou.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Playyou.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Playyou;
});
