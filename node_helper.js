/* global Module, MMM-ChartProvider-Finance */

/* Magic Mirror
 * Module: node_helper
 *
 * By Neil Scott
 * MIT Licensed.
 */

const moduleruntime = new Date();

//this loads and formats JSON feeds from a finance provider into NDTF items, depending on its config when called to from the main module
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

	showElapsed: function () {
		endTime = new Date();
		var timeDiff = endTime - startTime; //in ms
		// strip the ms
		timeDiff /= 1000;

		// get seconds 
		var seconds = Math.round(timeDiff);
		return (" " + seconds + " seconds");
	},

	stop: function () {
		console.log("Shutting down node_helper");
		//this.connection.close();
	},

	setconfig: function (moduleinstance, config) {

		if (this.debug) { this.logger[moduleinstance].info("In setconfig: " + moduleinstance + " " + config); }

		if (config.input != null) {

			config['useHTTP'] = false;

			// work out if we need to use a HTTP processor

			if (config.input.substring(0, 4).toLowerCase() == "http") { config.useHTTP = true; }
		}

		//store a local copy so we dont have keep moving it about

		providerstorage[moduleinstance] = { config: config, trackingfeeddates: [] };

		var self = this;

		//store the required data for the processing and have as many feeds as there are incoming feeds and stocks!

		var totalfeedcount = 0;

		providerstorage[moduleinstance].config.financefeeds.forEach(function (configfeed) {

			configfeed.stocks.forEach(function (stockfeed,index) {

				//amend the addresses in the config to dot notation depending on the input if prefixed by @
				//all are full addresses with0ut the rootkey as that is used to extract the core of the JSON in yahoo
				//if the root key is changed from the default then this wont work
				const defaultrootkey = 'chart.result';
				const dotnotationkeys = {
					'@close': 'chart.result.indicators.quote.0.close',
					'@open': 'chart.result.indicators.quote.0.open',
					'@high': 'chart.result.indicators.quote.0.high',
					'@low': 'chart.result.indicators.quote.0.low',
					'@volume': 'chart.result.indicators.quote.0.volume',
					'@timestamp': 'chart.result.timestamp',
					'@adjclose': 'chart.result.indicators.adjclose'
					}

				if ((dotnotationkeys[configfeed.value] != null || dotnotationkeys[configfeed.timestamp] != null || dotnotationkeys[configfeed.object] != null || dotnotationkeys[configfeed.subject] != null) && configfeed.rootkey != defaultrootkey) {
					console.error("if using the @ key names, the root key must be left as default");
				}
				else {
					if (dotnotationkeys[configfeed.value] != null) { configfeed.value = dotnotationkeys[configfeed.value].replace(defaultrootkey+'.', '');}
					if (dotnotationkeys[configfeed.timestamp] != null) { configfeed.timestamp = dotnotationkeys[configfeed.timestamp].replace(defaultrootkey + '.', ''); }
					if (dotnotationkeys[configfeed.object] != null) { configfeed.object = dotnotationkeys[configfeed.object].replace(defaultrootkey + '.', ''); }
					if (dotnotationkeys[configfeed.subject] != null) { configfeed.subject = dotnotationkeys[configfeed.subject].replace(defaultrootkey + '.', ''); }
				}

				var feed = { sourcetitle: '', lastFeedDate: '', latestfeedpublisheddate: new Date(0), feedconfig: configfeed, stock: stockfeed, stockname: (configfeed.stocknames == null) ? null : configfeed.stocknames[index]};

				//we add some additional config information for usage in processing the data

				configfeed["useruntime"] = false;
				configfeed["usenumericoutput"] = false;

				if (configfeed.type == 'numeric') { configfeed["usenumericoutput"] = true; }

				if (typeof configfeed.timestamp == "number") { //wants an offset of the runtime, provided in seconds, or it was blank

					configfeed["useruntime"] = true;
					configfeed["runtime"] = new Date(moduleruntime.getTime() + (configfeed.timestamp * 1000));

				}

				//validate the yahoo options

				if (['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'].indexOf(configfeed.periodrange) == -1) { console.error("period range option is incorrect"); };
				if (['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'].indexOf(configfeed.interval) == -1) { console.error("interval option is incorrect"); };
				if (configfeed.events != 'history') { console.error("events only supports 'history' as an option"); }

				//store the actual timestamp to start filtering, this will change as new feeds are pulled to the latest date of those feeds
				//if no date is available on a feed, then the current latest date of a feed published is allocated to it

				feed.lastFeedDate = commonutils.calcTimestamp(configfeed.oldestage);
				feed.sourcetitle = configfeed.feedtitle;
				feed.feedconfig = configfeed;

				providerstorage[moduleinstance].trackingfeeddates.push(feed);

				totalfeedcount++;

			});
		});

		this.outputarray = new Array(totalfeedcount);

		for (oidx = 0; oidx < totalfeedcount; oidx++) {
			this.outputarray[oidx] = [];
		}

	},

	getconfig: function () { return config; },

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
		var feedidx = -1;

		if (this.debug) { this.logger[moduleinstance].info("In processfeeds: " + moduleinstance + " " + providerid); }

		providerstorage[moduleinstance].trackingfeeddates.forEach(function (feed) {

			//build the url

			const config = providerstorage[moduleinstance].config;
			var tempconfig = JSON.parse(JSON.stringify(config));
			var feedconfig = feed.feedconfig;

			if (feedconfig.periodstart == null || feedconfig.periodend == null) {
				var url = `${config.input}${feed.stock}?range=${feedconfig.periodrange}&interval=${feedconfig.interval}&events=${feedconfig.events}`;
			}
			else {
				var startperiod = Math.round(new Date(feedconfig.periodstart).getTime / 1000);
				var endperiod = Math.round(new Date(feedconfig.periodend).getTime / 1000);
				var url = `${config.input}${feed.stock}?period1=${startperiod}&period2=${endperiod}&interval=${feedconfig.interval}&events=${feedconfig.events}`;
			}

			tempconfig.input = url;

			const options = new URL(url);

			var JSONconfig = {
				options: options,
				config: tempconfig,
				feed: feed,
				moduleinstance: moduleinstance,
				providerid: providerid,
				feedidx: feedidx,
			};

			JSONconfig['callback'] = function (JSONconfig, inputjson) {

				var jsonerror = utilities.getkeyedJSON(inputjson, feedconfig.errorkey);

				var jsonarray = utilities.getkeyedJSON(inputjson, feedconfig.rootkey);

				//check to see if we have an actual error to report

				if (jsonerror != null) {
					console.error(jsonerror.code, jsonerror.description);
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

		});

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
			providerid: providerid, source: source, payloadformodule: [{ setid: source.sourcetitle, itemarray: this.outputarray[feedidx] }]
		};

		if (this.debug) {
			this.logger[moduleinstance].info("In send, source, feeds // sending items this time: " + (this.outputarray[feedidx].length > 0));
			this.logger[moduleinstance].info(JSON.stringify(source));
		}

		if (this.outputarray[feedidx].length > 0) {

			this.sendNotificationToMasterModule("UPDATED_STUFF_" + moduleinstance, payloadforprovider);

		}

		// as we have sent it and the important date is stored we can clear the outputarray

		this.outputarray[feedidx] = [];

		this.queue.processended();

	},

	//now to the core of the system, where there are most different to the feedprovider modules
	//we enter this for each of the financefeeds we want to create to send back for later processing

	processfeed: function (feed, moduleinstance, providerid, feedidx, jsonarray) {

		//we process a stock feed at a time here

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