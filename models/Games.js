var Waterline = require("waterline");
/**
* Game.js
*
* @description :: A game represents a single release of a project, a project has multiple associated games, one
*                 for each release. A single release does not cover multiple platforms, so therefore the same
*                 version of a project deployed to both Chrome and Gamefroot.com would have two game models.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    tableName: "email",
    connection: "mysql",
    attributes: {
        id: {
            type: "integer", 
            primaryKey: true,
            autoIncrement: true
        },

        url: {
            type: "string",
            required: true
        },

        owner: {
            model: "User",
            required: true
        },

        meta: "JSON"
    }
};