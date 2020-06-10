/* global Module, MMM-Provider-JSON */

/* Magic Mirror
 * Module: node_helper
 *
 * By Neil Scott
 * MIT Licensed.
 */

const moduleruntime = new Date();

//this loads and formats JSON feeds from a specified source into extended NDTF items, depending on its config when called to from the main module

//TODO 

//to minimise activity, it will track what data has been already sent back to the module
//and only send the delta each time, using the timestamp of the incoming data.

//this is done by making a note of the last timestamp data of feeds sent to the module, tracked at the financefeeds level
//and ignoring anything older than that

//as some feeds wont have a timestamp date, they will be allocated a pseudo timestamp date of the latest timestamp date in the current processed financefeeds

//if the module calls a RESET, then the date tracking is reset and all data will be sent (TODO)

var NodeHelper = require("node_helper");
var moment = require("moment");

//pseudo structures for commonality across all modules
//obtained from a helper file of modules

var LOG = require('../MMM-FeedUtilities/LOG');
var QUEUE = require('../MMM-FeedUtilities/queueidea');
var RSS = require('../MMM-FeedUtilities/RSS');
var commonutils = require('../MMM-FeedUtilities/utilities');

// get required structures and utilities

const structures = require("../MMM-ChartUtilities/structures");
const utilities = require("../MMM-ChartUtilities/common");

const JSONutils = new utilities.JSONutils();
const configutils = new utilities.configutils();

// local variables, held at provider level as this is a common module

var providerstorage = {};

var trackingfeeddates = []; //an array of last date of feed recevied, one for each feed in the feeds index, build from the config
var aFeed = { lastFeedDate: '', feedURL: '' };

var payloadformodule = []; //we send back an array of identified stuff
var payloadstuffitem = { stuffID: '', stuff: '' }

module.exports = NodeHelper.create({

	start: function () {
		this.debug = false;
		console.log(this.name + ' node_helper is started!');
		this.logger = {};
		this.logger[null] = LOG.createLogger("logs/logfile_Startup" + ".log", this.name);
		this.queue = new QUEUE.queue("single", false);
	},

	stop: function () {
		console.log("Shutting down node_helper");
	},

	buildURL: function (config) {

		var tempURL = config.baseurl;

		// replace any paramaters in the baseurl

		for (var param in config.urlparams) {
			tempURL = tempURL.replace('{'+param+'}',urlparams[param])
        }

		return tempURL
    },

	setconfig: function (moduleinstance, config) {

		if (this.debug) { this.logger[moduleinstance].info("In setconfig: " + moduleinstance + " " + config); }

		//deepcopy config

		var tempconfig = JSON.parse(JSON.stringify(config));

		if (tempconfig.input != null) {

			tempconfig['useHTTP'] = false;

			// work out if we need to use a HTTP processor and build the url and store in the input field for compatibility 
			// with the old code for handling JSON

			if (tempconfig.input == "URL") {
				tempconfig.useHTTP = true;
				tempconfig.input = buildURL(config);
			}

		}

		//now build all the required values from the defaults if not entered in the config
		//creating a working fields set for this instance

		
		//add an outputname if not specified
		//find any sort values and populate the sort control arrays
		//if key not specified then make first field the key field
		var keyfound = false;
		var sorting = false;
		var sortkeys = [];

		//and 

		config.fields.forEach(function (field, index) {
			if (field.outputname == null) { tempconfig.fields[index]['outputname'] = fieldname;}
			if (field.sort) {
				sorting = true;
				sortkeys.push(tempconfig.fields[index]['outputname'])
			}

		})

		if (!keyfound) {
			tempconfig.fields[0]['key'] = true;
			//add this as first sortkey if we are sorting, as defined by any field sort=true
			if (sorting && !tempconfig.fields[0].sort) {
				tempconfig.fields[0]['sort'] = true;
				sortkeys.unshift(tempconfig.fields[0].outputname)
			};
		}

		tempconfig[sorting] = sorting;


		//fields: [],		// an array of field definitions 
							// field definitions are in the format of (|entry is optional|)
							// {fieldname:{|address:'dotnotation from the base'|,|inputtype:fieldtype|,|outputtype:fieldtype|,|key:true|,outputname:''|,|sort:true|}}
							// fieldname is  the  fieldname of the input field in the input data
							// address is optional, if not specified then the data is extracted from the base address level
							// fieldtype can be 'n', 's', 'b', 't'
							// n = numeric, the input is validated as numeric (converted to string if needed), the output is numeric 
							// s = string, the input is converted to string if not string for output
							// b = boolean, the input is converted to true/false for output
							// t = timestamp, the input is converted to a numeric unix format of time (equivalent of new Date(inputvalue).getTime()
							//	timestamp can includes a format to help the conversion of the input to the output
							// key indicates that this field should be used for the subject entry within the output, if not specificed then the first entry is the key, the key is the highest level to use if the data is sorted
							// outputname is the name to use for the field in output, if not specified the fieldname is used
							// sort indicates if this field should be included as a sort key, the sort order is always, key 1st and then any fields indicated as sort in the order they are entered in the fields array

		//convert to keys for JSON Extraction

		tempconfig.errorkey = 'error';
		tempconfig.errorcode = 'code';
		tempconfig.errordescription = 'info';

		tempconfig.rootkey = config.baseaddress;

		//add a error location just in case


		//store a local copy so we dont have keep moving it about

		providerstorage[moduleinstance] = { config: tempconfig, trackingfeeddates: [] };

		var self = this;

		this.outputarray = [];

	},

	getconfig: function (moduleinstance) { return providerstorage[moduleinstance].config; },

	socketNotificationReceived: function (notification, payload) {

		var self = this;

		if (this.logger[payload.moduleinstance] == null) {
			this.logger[payload.moduleinstance] = LOG.createLogger("logfile_" + payload.moduleinstance + ".log", payload.moduleinstance);
		};

		if (this.debug) {
			this.logger[payload.moduleinstance].info(this.name + " NODE HELPER notification: " + notification + " - Payload: ");
			this.logger[payload.moduleinstance].info(JSON.stringify(payload));
		}

		//we can receive these messages:
		//
		//RESET: clear any date processing or other so that all available stuff is returned to the module
		//CONFIG: we get our copy of the config to look after
		//UPDATE: request for any MORE stuff that we have not already sent
		//STATUS: show the stored local config for a provider
		//

		switch (notification) {
			case "CONFIG":
				this.setconfig(payload.moduleinstance, payload.config);
				break;
			case "RESET":
				this.reset(payload);
				break;
			case "UPDATE":
				//because we can get some of these in a browser refresh scenario, we check for the
				//local storage before accepting the request
				if (providerstorage[payload.moduleinstance] == null) { break; } //need to sort this out later !!
				this.processfeeds(payload.moduleinstance, payload.providerid);
				break;
			case "STATUS":
				this.showstatus(payload.moduleinstance);
				break;
		}

	},

	processfeeds: function (moduleinstance, providerid) {

		var self = this;

		if (this.debug) { this.logger[moduleinstance].info("In processfeeds: " + moduleinstance + " " + providerid); }

		//as there is only 1 feed for a provider reduce this code to 1 iteration

		const tempconfig = providerstorage[moduleinstance].config;
		const options = new URL(url);

		var JSONconfig = {
			options: options,
			config: tempconfig,
			feed: '',
			moduleinstance: moduleinstance,
			providerid: providerid,
			feedidx: 0,
		};

		JSONconfig['callback'] = function (JSONconfig, inputjson) {

			var jsonerror = utilities.getkeyedJSON(inputjson, tempconfig.errorkey); 

			var jsonarray = utilities.getkeyedJSON(inputjson, tempconfig.rootkey);

			//check to see if we have an actual error to report

			if (jsonerror != null) {
				console.error(jsonerror[tempconfig.errorcode], jsonerror[tempconfig.errordescription]);
			}

			//check it actually contains something, assuming if empty it is in error
			if (jsonarray != null) {
				if (jsonarray.length == 0) {
					console.error("json array is empty");
					return null;
				}
			}
			else {
				console.error("json array is empty");
				return null;
            }

			self.queue.addtoqueue(function () {
				self.processfeed(JSONconfig.feed, JSONconfig.moduleinstance, JSONconfig.providerid, ++JSONconfig.feedidx, jsonarray);
			});

			self.queue.startqueue(providerstorage[JSONconfig.moduleinstance].config.waitforqueuetime); //the start function ignores a start once started
		}

		JSONutils.getJSONnew(JSONconfig);
	},

	showstatus: function (moduleinstance) {

		console.log('============================ start of status ========================================');

		console.log('config for provider: ' + moduleinstance);

		console.log(providerstorage[moduleinstance].config);

		console.log('feeds for provider: ' + moduleinstance);

		console.log(providerstorage[moduleinstance].trackingfeeddates);

		console.log('============================= end of status =========================================');

	},

	sendNotificationToMasterModule: function (stuff, stuff2) {
		this.sendSocketNotification(stuff, stuff2);
	},

	done: function (err) {

		if (err) {

			console.log(err, err.stack);

		}

	},

	send: function (moduleinstance, providerid, source, feedidx) {

		//wrap the output array in an object so the main module handles it in the same way as if it was a collection of feeds
		//and add an id for tracking purposes and wrap that in an array

		var payloadforprovider = {
			providerid: providerid, source: source, payloadformodule: [{ setid: source.sourcetitle, itemarray: this.outputarray }]
		};

		if (this.debug) {
			this.logger[moduleinstance].info("In send, source, feeds // sending items this time: " + (this.outputarray.length > 0));
			this.logger[moduleinstance].info(JSON.stringify(source));
		}

		if (this.outputarray[feedidx].length > 0) {

			this.sendNotificationToMasterModule("UPDATED_STUFF_" + moduleinstance, payloadforprovider);

		}

		// as we have sent it and the important date is stored we can clear the outputarray

		this.outputarray = [];

		this.queue.processended();

	},

	//now to the core of the system, where there are most different to the feedprovider modules
	//we enter this for each of the financefeeds we want to create to send back for later processing

	processfeed: function (feed, moduleinstance, providerid, feedidx, jsonarray) {

		//we process the JSON  here / 1 dataset

		var sourcetitle = feed.sourcetitle;

		var self = this;

		var maxfeeddate = new Date(0);

		for (var idx = 0; idx < jsonarray.length; idx++) {

			//look for any key value pairs required and create an item
			//ignore any items that are older than the max feed date
			//code specialised for handling the yahoo v8 chart feed

			var processthisitem = true;
			var errcounter = 0;

			var mainitem = new structures.NDTFItem()

			// the subject is common for this feed as it should be the stock

			if (feed.feedconfig.subject != null) {

				if (feed.feedconfig.subject == 'stock') {

					//check if we use provided names instead of the actual ticker
					if (feed.feedconfig.usenames) {
						mainitem.subject = feed.stockname;
					}
					else {
						mainitem.subject = feed.stock;
					}
				}

				else {
					mainitem.subject = utilities.getkeyedJSON(jsonarray[idx], feed.feedconfig.subject);;
				}

			}
			else {
				config.info("No subject");
				processthisitem = false;
			}

			//console.info(errcounter++, processthisitem);

			//determine which of the objects to process, using the dot notation keys

			if (feed.feedconfig.object != null) {

				mainitem.object = feed.feedconfig.object

			}
			else {
				config.info("No object");
				processthisitem = false;
			}

			//console.info(errcounter++, processthisitem);

			if (feed.feedconfig.value != null) {

				var valuearray = utilities.getkeyedJSON(jsonarray[idx], feed.feedconfig.value);

			}
			else {
				config.info("No value");
				processthisitem = false;
			}

			//console.info(errcounter++, processthisitem);

			//now we have an array of values to process 
			//but we are not pointing at a matching timestamp
			//so we need to get them as well

			if (feed.feedconfig.timestamp != null && !feed.feedconfig.useruntime) {

				var timestamparray = utilities.getkeyedJSON(jsonarray[idx], feed.feedconfig.timestamp);

			}

			if (valuearray.length != timestamparray.length) {
				console.error("Something wonderful has happened, it broke !! - array lengths not equal");
				processthisitem = false;
			}

			//console.info(errcounter++, processthisitem);

			//we should now have 2 matching arrays, values and timestamps, merge them into tempitems and send onwards

			if (processthisitem) {

				for (var aidx = 0; aidx < valuearray.length; aidx++) {

					processthisitem = true; //reset for each item

					var tempitem = new structures.NDTFItem()

					tempitem.subject = mainitem.subject;
					tempitem.object = mainitem.object;

					if (feed.feedconfig.usenumericoutput) {
						if (isNaN(parseFloat(valuearray[aidx]))) {
							console.error("Invalid numeric value: " + valuearray[aidx]);
							processthisitem = false;
						}
						else {
							tempitem.value = parseFloat(valuearray[aidx]);
						}
					}
					else {
						tempitem.value = valuearray[aidx];
					}

					//if the timestamp is requested do we have one of those as well
					//removed all validation at the moment as this isn't generic 

					//yahoo timestamps are seconds, so adjust to milliseconds

					var temptimestamp = timestamparray[aidx];

					if (temptimestamp != null) {

						temptimestamp = new Date(temptimestamp * 1000);

						maxfeeddate = new Date(Math.max(maxfeeddate, temptimestamp));

						//console.info(temptimestamp, feed.latestfeedpublisheddate, tempitem.value);
						//console.info(temptimestamp > feed.latestfeedpublisheddate);

						if (temptimestamp > feed.latestfeedpublisheddate) {

							tempitem.timestamp = temptimestamp;
						}
						else {
							processthisitem = false;
							//console.info("Too old");
						} //too old

					}
					else { // use an offset timestamp
						tempitem.timestamp = feed.feedconfig.adjustedruntime;
					}

					//we want to just capture any changes when looking for live updates (intraday) so this may need tweaking

					//console.info(processthisitem);

					if (processthisitem) {

						this.outputarray[feedidx].push(tempitem);

					}
				}
			}

		}  //end of process loop - input array

		if (feed.feedconfig.filename == null) {
			console.info("Extracted " + this.outputarray[feedidx].length + " stock records");
		}
		else {

			// write out to a file

			JSONutils.putJSON("./" + feed.feedconfig.filename, this.outputarray[feedidx]);

			console.info("Extracted " + this.outputarray[feedidx].length + " stock records");

		}

		var rsssource = new RSS.RSSsource();
		rsssource.sourceiconclass = '';
		rsssource.sourcetitle = feed.feedconfig.setid;
		rsssource.title = feed.feedconfig.setid;

		providerstorage[moduleinstance].trackingfeeddates[feedidx]['latestfeedpublisheddate'] = maxfeeddate;

		self.send(moduleinstance, providerid, rsssource, feedidx);
		self.done();

	},

});