var mysql = require("mysql");
var config = require("./connection.js");


var _ = require("lodash");
var request = require("superagent");
var async = require("async");
var phpunserialize = require("php-unserialize");


var setupWaterline = require('./bootstrap.js');

var Game = require("./games.js");
var Pack = require("./packs.js");

var ProgressBar = require("progress");
var validator = require("validator");



global.changed = [];




var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "bk_db"
});

connection.connect();

var packDefault = {
    id: 0,
    username: "",
    password: "",
    subscriptionType: "none",
    firstName: "",
    lastName: "",
};




setupWaterline(config, function(err, results) {
    console.log("started");
    if (err) {
        return console.log(err);
    }

    connection.query("SELECT * FROM wp_users ORDER BY ID ASC LIMIT 1230", function(err, rows) {

        if (err) throw new Error(err);
        var bar = new ProgressBar("Migrating [:bar]:percent :current/:total eta :eta(s)", {
            total: rows.length,
            width: 100,
            callback: function(){
                console.log("done");
            }
        });

        console.log("started");

        if (rows.length == 0) {
            bar.tick();
            return; //done
        }

        // console.log( rows.length );
        var len = rows.length;
        async.each(rows, function(user, callback) {
            //lets get the meta
            connection.query("SELECT meta_value FROM wp_usermeta WHERE user_id = ? AND meta_key = 'wp_capabilities' LIMIT 1", [user.ID], function(err, rows) {
                if (rows && rows.length ) {
                    var perm = phpunserialize.unserialize(rows[0].meta_value);
                    var pro = _.has(perm, "pro");
                    var admin = _.has(perm, "administrator");

                    results.collections.user.create(_.extend(packDefault, {
                        username: user.user_login,
                        password: user.user_pass,
                        firstName: user.display_name,
                        subscriptionType: pro ? "pro" : admin ? "admin" : "none"
                    })).then(function(data) {
                        if (!validator.isEmail( user.user_email )){
                            new Pack( user.ID, data.id , function(){
                                new Game( user.ID, data.id, function(){
                                    bar.tick();
                                    callback();
                                }, results.collections);
                            }, results.collections);
                        } else {
                            results.collections.email.create({
                                owner: data.id,
                                value: user.user_email
                            }).then(function(){
                                //now lets go and create packs for that said user
                                new Pack( user.ID, data.id , function(){
                                    // bar.tick();
                                    new Game( user.ID, data.id, function(){
                                        bar.tick();
                                        callback();
                                    }, results.collections);
                                }, results.collections);
                            }, function( err ){
                                callback();
                                bar.tick();
                            }).fail(function(){
                                bar.tick();
                                callback();
                            });
                        }
                    }, function(err){
                        callback();
                        bar.tick();
                    }).fail(function(){
                        callback();
                        bar.tick();
                    })
                } else {
                    callback();
                    bar.tick();
                }
            });
        }, function( err ){
            bar.tick();
            console.log("done");
        });
    });
});
