/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

// var bcrypt = require('bcrypt-nodejs');

/**
 * Hash a passport password.
 *
 * @param {Object}   password
 * @param {Function} next
 */
function hashPassword (user, next) {
  	if (user.password) {
  		var salt = bcrypt.genSaltSync(10);
    	bcrypt.hash(user.password, salt, null, function(err, result){
    		if (result && !err) {
    			user.password = result;
    		}
    		next(err, passport);
    	});
  	} else {
    	next(null, passport);
  	}
};

module.exports = {
    tableName: "user",
    connection: "mysql",

	SUBSCRIPTION_NONE: "none",
	SUBSCRIPTION_PRO: "pro",

  	attributes: {

  		id: {
          type: 'integer', 
          primaryKey: true,
          autoIncrement: true
        },

  		emails: {
	  		collection: "email",
	  		via: "owner",
	  	},

	  	username: {
	  		type: "string",
	  		unique: true,
	  		required: true
	  	},

	  	password: {
	  		type: "string",
	  		required: true
	  	},

	  	subscriptionType: {
	  		type: "string",
	  		enum: ["none","pro", "admin"],
	  		defaultsTo: "none"
	  	},

	  	firstName: {
	  		type: "string",
	  		defaultsTo: ""
	  	},

	  	lastName: {
	  		type: "string",
	  		defaultsTo: ""
	  	},

	  	passports: {
	  		collection: "passport",
	  		via: "user"
	  	},

	  	projects: {
	  		collection: "project",
	  		via: "owner"
	  	},

	  	packs: {
	  		collection: "pack",
	  		via: "owner",
	  		dominate: true
	  	},

	  	assets: {
	  		collection: "asset",
	  		via: "owner"
	  	},

	  	// Override toJSON instance method
	    toJSON: function() {
	      	var obj = this.toObject();
	      	delete obj.password;
	      	return obj;
	    }

  	},

  	// Run before a user is created
	beforeCreate: function(user, next){
		next();
		// hashPassword(user, next);
	},

	// Run before a user is updated
	// beforeUpdate: function(user, next){
	// 	hashPassword(user, next);
	// },


	validateUsername: function(username){
		return username.replace(' ','');
	}
};

