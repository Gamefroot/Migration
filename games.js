var mysql = require("mysql");
var _ = require("lodash");
var request = require("superagent");
var async = require("async");
var redis = require("redis").createClient();
var Path = require("path");
var fs = require("fs");

var storage = require("./storage.js");


var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bk_db"
});

connection.connect();

var awsURL = "https://s3.amazonaws.com/gamefroot/gamefroot-dev/";
module.exports = function(old_id, user_id, cb, models) {
	connection.query("SELECT * FROM wp_posts WHERE post_type = ? AND post_author = ?", ["game_new", old_id], function(err, rows) {
		if (err) throw new Error(err);
		if ( rows.length <= 0 ) return cb();

		
		async.eachSeries( rows, function( game, callback ){
			var gameurl = Path.normalize( "users/" + old_id + "/games/" +  game.ID + "/game.json" );
			var sent = false;
			getJSON( gameurl, function( err, json ){
				if (!err && json ){
				 	json.packs = replaceInArray( json.packs );

					//lets now just json up the string and do some replacement finding :P
					var gamejson = findInString ( JSON.stringify( json ) );

					//now lets create the games :P
					//
					
					var data = {
						owner: user_id,
						name: game.post_title,
						description: game.post_content,
						currentVersion: 1
					}


					models.project.create(data).then(function(project){
						//lets create a new version.						
						//first we need to upload the json file
						
						var gameData = gamejson;

						storage.saveFile( new Buffer( gameData ), Path.normalize('/users/' + project.owner + '/games/' + project.id + '/versions/game-1.json' )).then(function( Ures ){
							models.version.create({
								project: project.id,
								version: 1,
								jsonUrl: Ures.remoteUrl
							}).then(function(){
								callback();
							}, function( err ){
								//failed
								callback( err );
							});
						}, function( err ){
							callback( err );
						});

					}, function(){
						callback();
					}).fail(function(err){
						callback( err );
					});					
				} else {
					if ( !sent ){
						sent = true;
						callback();
					}
				}
			});	
		});
	});
}

function findInString ( gamejson ){
	_.forEach( global.changed, function( obj ){
		if ( gamejson.indexOf( obj.old ) > -1 ){
			gamejson = gamejson.replace( new RegExp(parseInt(obj.old), "gi"), parseInt(obj.newID) );
		}
	});
	return gamejson;
}


function replaceInArray( array ){
	var newArray = [];
	_.forEach( array, function( id ){
		var res = _.findWhere(global.changed, { old: parseInt(id) });
		if ( res ){
			newArray.push( res.newID );
		} else {
			newArray.push( id ); //cant find :(
		}
	});
	return newArray;
}


function getJSON(url, cb) {
    request.get(awsURL + url)
    .end(function(err, data) {
        if (data && data.body && !err) {
            cb(false, data.body);
        } else {
            cb(new Error(err), false);
        }
    });
}