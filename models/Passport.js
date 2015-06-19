/**
* UserProvider.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  tableName: "passport",
  connection: "mysql",
  attributes: {

    id: {
      type: 'integer', 
      primaryKey: true,
      autoIncrement: true
    },

  	platform: {
  		type: "string",
  		enum: ["facebook","google"],
      required: true
  	},

  	platformId: {
  		type: "string",
  		required: true
  	},

  	user: {
  		model: "user"
  	}
  }
};

