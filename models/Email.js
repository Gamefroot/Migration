/**
* Email.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    tableName: "email",
    connection: "mysql",

  	attributes: {
  		id: {
          type: 'integer', 
          primaryKey: true,
          autoIncrement: true
        },

  		owner: {
  			model: "user"
  		},

  		value: {
	  		type: "string",
	  		unique: true,
	  		required: true,
	  		//email: true
	  	},

	  	verified:  {
	  		type: "boolean",
	  		required: true,
	  		// TODO send confirmation email when a user logs in with their email address
	  		// TODO default to false
	  		defaultsTo: true
	  	}
	}
};