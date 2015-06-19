/**
* Project.js
*
* @description :: A project represents any game that is still in development. Releases are created as 'Game' models,
*				  and a single project may have a number of games associated with it.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  tableName: "project",
  connection: "mysql",

    attributes: {

        id: {
            type: 'integer', 
            primaryKey: true,
            autoIncrement: true
        },

        owner: {
            model: "user",
            required: true
        },

        name: {
            type: "string",
            defaultsTo: "Untitled Game"
        },

        description: {
            type: "string",
            defaultsTo: ""
        },

        images: {
            type: "json"
        },

        versions: {
            collection: "version",
            via: "project"
        },
        
        currentVersion: {
            type: "integer",
            defaultsTo: 1
        },

        publicAccess: {
            type: "string",
            enum: ["","r","rw"],
            defaultsTo: ""
        }
    }
};