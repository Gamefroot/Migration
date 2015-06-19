var mysql = require("mysql");
var _ = require("lodash");
var request = require("superagent");
var async = require("async");
var redis = require("redis").createClient();
var Path = require("path");

var storage = require("./storage.js");


var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "gamefroot_wp"
});

connection.connect();

var packDefault = {
    id: 0,
    owner: 0,
    name: ""
}


module.exports = function(old_id, user_id, cb, models) {
    connection.query("SELECT * FROM wp_posts WHERE post_type = ? AND post_author = ?", ["wpsc-product_new", old_id], function(err, rows) {
        if (err) throw new Error(err);

        if (!rows.length) return cb(); //no new packs

        //convert this pack
        async.each(rows, function(pack, callback) {
            // _.forEach( rows, function( pack ){
            var ID = pack.ID;
            //in pack
            connection.query("SELECT * FROM wp_ph_pack_contents WHERE pack_id = ?", [ID], function(err, rows) {
                //now we have the asset's what do we do with them?
                if (err) throw new Error(err);



                //now we need to create a pack really!				
                models.pack.create({
                    owner: user_id,
                    title: pack.post_title,
                    description: pack.post_content,
                }).then(function(pack) {
                    global.changed.push({old: ID, newID: pack.id });
                    if ( !rows.length ) return callback();
                    async.each(rows, function(asset, cb) {
                        var assetID = asset.asset_id;
                        //now lets do a query to get the asset_type
                        connection.query("SELECT post_type FROM wp_posts WHERE ID = ? LIMIT 1", [assetID], function(err, rows) {
                            if (err) throw new Error(err);
                            switch (rows[0].post_type) {
                                case "item_new":
                                    new Item(user_id, pack, assetID, models, cb, rows[0].post_type);
                                    break;
                                case "character_new":
                                    new Item(user_id, pack, assetID, models, cb, rows[0].post_type );
                                    break;
                                case "tile_new":
                                    new terrain( user_id, pack, assetID, models, cb, rows[0].post_type );
                                    break;
                                case "robot_new":
                                	new Script( user_id, pack, assetID, models, cb, rows[0].post_type );
                                    break;
                                case "sound_effect_new":
                                	cb();
                                    break;
                                // default:
                                //     console.log(rows[0].post_type);
                                //     callback();
                            }
                        });
                    }, function() {
                        callback();
                    });
                }, function(){
                	callback();
                });
            });
        }, function() {
        	cb();
        });
    });
}



var awsURL = "https://s3.amazonaws.com/gamefroot/";

function terrain(user_id, pack, id, models, callback, postType) {
    //lets create a asset	
    models.asset.create({
        owner: user_id,
        assetType: "gameObject",
    }).then(function(asset) {
        global.changed.push({old: id, newID: asset.id });      
        connection.query("SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = ?", [id], function(err, rows) {
            if (err) throw new Error(err);
            //check redis!!!
            redis.get("amazon-s3-loc-" + id, function(err, url) {
                if (err) throw new Error(err);
                if (url) {
                    models.asset.create({
                        owner: user_id,
                        assetType: "staticImage",
                    }).then(function(sprite) {
                        //now we have the image for the asset, so now we can create things....	
                        var sent = false;
                        request.get(awsURL + url)
                            .end(function(err, data) {                               
                                if (data && data.body && !err) {
                                    var buffer = data.body;
                                    //so now we have the file lets do magic! no really magic!
                                    storage.saveFile(buffer, Path.normalize('/users/' + user_id + '/pack/' + pack.id + '/' + sprite.id + ".png")).then(function(response) {
                                        pack.assets.add(asset.id);

                                        var meta = {
                                        	animations: new animation(sprite.id, response.publicUrl),
                                        	terrain: true
                                        };

                                        asset.update({
                                            meta: JSON.stringify(meta)
                                        }).then(function() {
                                            //saved the pack
                                            models.asset.update(sprite.id, {
                                                meta: JSON.stringify({
                                                    filePath: response.remoteUrl
                                                })
                                            }).then(function() {
                                                pack.save().then(function() {
                                                    callback();
                                                }, function( err ) {
                                                    //failed
                                                    callback(err);
                                                }).fail(function(){
                                                    callback();
                                                });
                                            }, function(){
                                                callback();
                                            }).fail(function(){
                                            	callback();
                                            });
                                        }).fail(function( err ){
                                        	callback( err );
                                        });
                                    }, function(err) {
                                        callback( err );
                                    });
                                } else {
                                    if (!sent){
                                        sent = true; 
                                        callback(); //only because superagent loves sending back multiple error messages for some reason...                                      
                                    }
                                }
                            });
                    }, function(){
                        callback();
                    }).fail(function(err) {
                        callback();
                    });
                } else {
                    callback();
                }
            });
        });
    }, function(){
        callback();
    }).fail(function(err) {
        callback();
    });
}


function Item(user_id, pack, id, models, cb, postType) {
    //lets create a asset	
    models.asset.create({
        owner: user_id,
        assetType: "gameObject",
    }).then(function(Asset) {
        global.changed.push({old: id, newID: Asset.id });
        connection.query("SELECT * FROM wp_gfdl_items WHERE post_id = ?", [id], function(err, rows) {
            var sprites = JSON.parse(rows[0].sprites);
            var animation = JSON.parse(rows[0].animations);
            var called = false;
            // console.log(animation);
            async.each(sprites, function(sprite, callback) {
                connection.query("SELECT post_id, filename, size_w, size_h FROM wp_gfdl_sprites WHERE post_id = ?", [sprite], function(err, rows) {
                    if (rows[0] && rows[0].filename) {          
                        var sent = false;        	
                        getImage(rows[0].filename, function(err, body) {
                            if (body && !err) {
                                models.asset.create({
                                    owner: user_id,
                                    assetType: "staticImage",
                                }).then(function(sprite) {
                                    storage.saveFile(body, Path.normalize('/users/' + user_id + '/pack/' + pack.id + '/' + sprite.id + ".png")).then(function(response) {
                                       	models.asset.update(sprite.id, {
                                            meta: JSON.stringify({
                                                filePath: response.remoteUrl
                                            })
                                        }).then(function() {
                                        	updateAnimation( animation, rows[0].post_id, response.publicUrl, sprite.id );
                                        	callback();
                                    	}, function( err ){
                                    		callback();
                                    	}).fail(function(){
                                            callback();
                                        });
                                    }, function( err ){
                                    	callback();
                                    }).fail(function(){
                                        callback();
                                    });
                                }, function(){
                                    callback();
                                }).fail(function(){
                                    callback();
                                });
                            } else {
                                if (! sent ){
                            	   callback(); //only because superagent loves sending back multiple error messages for some reason...
                                   sent = true; 
                                }
                            }
                        });
                    } else {
                    	callback();
                    }
                });
            }, function( err ){
            	var meta = {
                	animations: animation
                };

                if ( postType == "character_new" ){
                	//woop woop character
                	meta.character = true;
                }

        		models.asset.update(Asset.id, {
                    meta: JSON.stringify(meta)
                }).then(function(){        				
        			cb(); //done
            	}, function(){
                    cb();
                }).fail(function(){
                    cb();
                });
            });
        });
    });
}


function Script( user_id, pack, id, models, cb, postType ){
	connection.query("SELECT * FROM wp_postmeta WHERE post_id = ? AND meta_key = 'script'", [id], function(err, rows) {
		if ( rows[0] && rows[0].meta_value ){
			var script = JSON.parse( rows[0].meta_value );
			models.asset.create({
		        owner: user_id,
		        assetType: "script",
		        meta: JSON.stringify({
	        		name: script.name,
					version: script.version,
					behaviour: script.behaviour,
					icons: null,
					description: script.description
		        })
		    }).then(function( res ) {
                global.changed.push({old: id, newID: res.id });
		   		cb();
	    	}, function(err){
	    		cb( err );
	    	}).fail(function(){
                cb();
            })
		} else {
            cb();
        }
	});
}


function getImage(url, cb) {
    console.log("getting image %s", awsURL + url);
    request.get(awsURL + url)
    .end(function(err, data) {   
        console.log("got image %s", awsURL + url);    
        if (data && data.body && !err) {
            cb(false, data.body);
        } else {
            cb(new Error(err), false);
        }
    });
}


function updateAnimation(animation, id, url, newID) {
    _.forEach(animation, function(sequences, key) {
        _.forEach(sequences.sprites, function(sprite, i) {
            if (sprite && sprite.id == id) {
                animation[key].sprites[i] = {
                    sprite: url,
                    hitbox_x: sprite.hitbox_x,
                    hitbox_y: sprite.hitbox_y,
                    hitbox_w: sprite.hitbox_w,
                    hitbox_h: sprite.hitbox_h,
                    id: newID
                }
            }
        });
    });
}


function animation(id, url, w, h) {
    return {
        idle: {
            sprites: [{
                sprite: url,
                hitbox_x: 0,
                hitbox_y: 0,
                hitbox_w: w || 48,
                hitbox_h: h || 48,
                id: id
            }]
        }
    }
}

//http://staging.industrial-keep-519.appspot.com/