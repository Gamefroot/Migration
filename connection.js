var User = require("./models/User.js");
var Email = require("./models/Email.js");
var Passport = require("./models/Passport.js");
var Projects = require("./models/Project.js");
var Pack = require("./models/Pack.js");
var Asset = require("./models/Asset.js");
var Version = require("./models/Version.js");
var mysqlAdapter = require("sails-mysql");

// Build A Config Object
module.exports = {
    // Setup Adapters
    // Creates named adapters that have have been required
    adapters: {
        mysql: mysqlAdapter
    },

    // Build Connections Config
    // Setup connections using the named adapter configs
    connections: {
        mysql: {
            adapter: 'mysql',
            host: 'localhost',
            database: 'gamefroot_dev',
            user: "root"
        }
    },

    collections: {
        user: User,
        email: Email,
        passport: Passport,
        project: Projects,
        pack: Pack,
        asset: Asset,
        version: Version
    },

    defaults: {
        migrate: "safe"
    }
};
