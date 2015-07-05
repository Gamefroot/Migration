var fs = require('fs');
var gcloud = require('gcloud'); 
var q = require('q');
var d = require('debug')('core:gcloud');
var Path = require('path');
var Stream = require('stream');
var URLUtils = require('url');
var Request = require( "request" );
var mime = require("./mime/index.js");

var assetBucket;

/**
 * The bucket name to use when in a staging environment.
 * @const
 * @type {string}
 */
var STAGING_BUCKET_NAME = 'staging-files.gamefroot.com';

/**
 * The bucket name to use when in a production environment.
 * @const
 * @type {string}
 */
var PRODUCTION_BUCKET_NAME = 'files.gamefroot.com';

/**
 * The name of the bucket that files will be stored in
 * on Google Cloud Storage. The default permission for items
 * in the bucket is public-access.
 * @const
 * @type {string}
 */
var ASSETS_BUCKET_NAME = PRODUCTION_BUCKET_NAME;


var gcloudClient = gcloud({
	projectId: "industrial-keep-519",
	keyFilename: Path.join(__dirname, './gcloud-key.json')
});

var client = gcloudClient.storage();

/**
 * 3rd party storage service - in our case we're using Google Cloud Storage.
 * Using this API layer, we will be able to swap out for another solution easily.
 * The storage service is responsible for saving/loading files and checking a users
 * current usage. The storage service also converts asset url keys to full urls and
 * back again.
 * @class Storage
 * @namespace gf.api.services
 */
var storage = {

	/**
	 * Saves a given local file to the remote path in storage
	 * @method saveFile
	 * @param {String} localFile The path of the local file
	 * @param {String} remotePath The remote key of the file, 
	 * relative to the top-level of the bucket
	 * @return {Promise}
	 */
	saveFile: function( localFile, remotePath ){
		var defer = q.defer();
		var self = this;
		d("Uploading file to - %s", remotePath );
		//var bucket = client.bucket( ASSETS_BUCKET_NAME );		
		if ( bucket ){
			var url = Path.normalize( remotePath );
			//var file = bucket.file( url );
			if ( !Buffer.isBuffer( localFile ) ) {
				defer.reject("Not a buffer");
				return defer.promise;
			}

			//var bufferStream = new Stream.PassThrough();
			//	bufferStream.end( localFile );

			// bufferStream
			// .pipe(file.createWriteStream({
			// 	resumable: false,
			// 	metadata: {
			// 		contentType: mime.lookup( url )
			// 	}
			// }))
			// .on('error', function(err) {		
			// 	defer.reject( err );
			// })
			// .on('complete', function( res ) {
				// file.makePublic(function(err){});

				// The file upload is complete.
				defer.resolve({
					remoteUrl: url,
					publicUrl: storage.getHTTPSurl( url )		
				});

			// 	//lets free up some memory...
			// 	delete localFile;
			// 	delete bufferStream;
			// });
		}
		return defer.promise;
	},

	/**
	 * Gets the HTTPS URL of a file stored in the Google Cloud Storage.
	 * @method getHTTPSurl
	 * @param {String} remotePath The path of the file on Google Cloud
	 * @return {String}
	 */
	getHTTPSurl: function( remotePath ){
		var bucket = ASSETS_BUCKET_NAME;
		var parts = {
			protocol: "https:",
			hostname: "storage.googleapis.com",
			pathname: "/" + bucket + "/" + encodeSpecialCharacters( remotePath )
		};
		return URLUtils.format(parts);
	}
}

function encodeSpecialCharacters(filename) {
  // Note: these characters are valid in URIs, but S3 does not like them for
  // some reason.
  return encodeURI(filename).replace(/[!'()* ]/g, function (char) {
    return '%' + char.charCodeAt(0).toString(16);
  });
}


module.exports = storage;