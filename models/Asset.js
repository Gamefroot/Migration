/**
 * The Asset model represents any kind of uploaded file that a user has provided.
 * All assets contain a number of shared properties, but may also include additional
 * properties in the 'meta' attribute, specific to their type.
 * @class Asset
 * @namespace gf.api.models
 */
module.exports = {
    tableName: "asset",
    connection: "mysql",
    attributes: {
        /**
         * Unique id used to index model
         * @property id
         * @type Integer
         */
        id: {
          type: "integer", 
          primaryKey: true,
          autoIncrement: true
        },

        /**
         * The user that created this asset
         * @property owner
         * @type gf.api.models.User
         */
        owner: {
            model: "user",
            required: true
        },

        /** 
         * The type of asset this is
         * One of "gameObject" | "sound" | "script" | "staticImage"
         * @property type
         * @type String
         */
        assetType: {
            type: "string",
            enum: ["gameObject", "sound", "script", "staticImage"],
            required: true
        },

        /**
         * The url pointing to the thumbnail of this asset
         * @property thumbUrl
         * @type String
         */
        thumbUrl: {
            type: "string"
        },

        /**
         * The size of this asset in bytes
         * @property fileSize
         * @type Integer
         */
        fileSize: {
            type: "integer"
        },

        /**
         * Used to store additional meta data required for this asset type
         * @property meta
         * @type Object
         */
        meta: {
            type: "json"
        }
    }
};