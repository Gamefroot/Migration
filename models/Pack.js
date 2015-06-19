/**
 * Pack.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    tableName: "pack",
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

        assets: {
            dominant: true,
            collection: "asset",
            via: "id"
        },

        title: {
            type: "string",
            required: true
        },

        description: {
            type: "string",
            defaultsTo: ""
        },

        category: "string",
        icon: "string",

        forsale: {
            type: "boolean",
            defaultsTo: false
        },

        price: {
            type: "float",
            defaultsTo: 0
        },

        icon: "string",

        generating: {
            type: "boolean",
            defaultsTo: false
        }
    }
};