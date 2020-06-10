/* global Module, MMM-ChartProvider-Finance */

/* Magic Mirror
 * Module: MMM-ChartProvider-JSON
 *
 * By Neil Scott
 * MIT Licensed.
 */

var startTime = new Date();

var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

var providerstorage = {};
var providerconfigs = [];

var trackingStuffEntry = { stuffID:'', consumerids:[], actualstuff: '' }; //format of the items that we need to track to see if we need to send them back again
//var trackingStuff = {};

//var trackingconsumerids = [];

var consumerpayload = { consumerid: '', stuffitems: [] };
var consumerpayloads = {};

// all stored data has to be at the providerid level otherwise it will get overwritten as other modules are run (this is async, multi use code)

// as this needs to track what has been sent then 

// need to store some kind of shortened representation of each individual stuff (or group of stuff?) as a key or ID
// then as each stuff is sent back to each consumer, the consumer key (as an index into the trackingconsumerids) is added to the
// stuff so it isn't sent again

// when we get the start message we need to clear all tracking information as the consumer may resend a start message

Module.register("MMM-ChartProvider-Finance", {

	// Default module config.
	defaults: {
		text: "MMM-ChartProvider-JSON",
		consumerids: ["MMFD1"], // the unique id of the consumer(s) to listen out for
		id: "MMFP1", //the unique id of this provider
		datarefreshinterval: 6000*60,	//milliseconds to pause before checking for new data // common timer for all consumers
										//one or more definitions of how the data in input will be processed
										//to produce array of item(s) keyed on the feedtitle
										//
										//certain key names can be prefixed with @ these use currently known addresses within the JSON to obtain that key
										// i.e. @open will get the open value for the stock from indicators.quote.0.open
		financefeeds: [
			{
				feedname: null,
				setid: null,			// | Yes | the setif of this particular data, used to identify the data when revived in display module
				rootkey: 'chart.result',// | No | the key value(s) in dot notation to determine at what level to extract data | a valid string | the first level
				errorkey: 'chart.error',// | No | the key value(s) in dot notation to determine at what level to extract error | a valid string | the first level
				object: null,			// | Yes | the KEY name(s) to use as an object for an item | expected to be indicators.quote.close,high,low,open,volume | none
				subject: 'stock',       // | No | the subject to insert into the item | any valid string | 'Stock' - the stock being extracted
				value: '@close',        // | Yes | @close,@open,@high,@low,@volume,@timestamp,@adjclose the KEY name to use to for the value field of the item | any valid string | the key name in the object field if null
				type: "string",         // | No | the type of the value when added to the output item | numeric(will validate using parsefloat) or string | string
				timestamp: '@timestamp', // | No |@close,@open,@high,@low,@volume,@timestamp,@adjclose the KEY name(s) of a timestamp to use for the timestamp field value in the item, | dot notation of timestamp from root key | 'timestamp'
				timestampformat: null,  // | No | a moment compatible timestamp format used to validate any dates found | timestamp string | Null - dont use any format
				filename: null,         // | No | local file name(no paths) to save a serialised version of the extracted data as an array of items | any valid filename or not defined for no output.| none
				oldestage: 'today',		//  oldestage:	indicates how young a feed/data within a feed must be to be considered either ,
										//				a timestamp, must be in YYYY-MM-DD HH:MM:SS format to be accepted (use moments to validate)
										//				the word today for midnight today, 
										//				the number of minutes old as an integer
				stocks: null,			//	an array of stock identifiers
				usenames: false,		//  use the meta data provided to name the stock in the output
				stocknames: null,		//  an array of names to use instead of the stock tickers if usemeta = true
				periodstart: null,		//  a valid date instance (will be converted internally to unix number of seconds ... (not milliseconds))
				periodend: null,		//  a valid date instance (will be converted internally to unix number of seconds ... (not milliseconds))
				periodrange: 'ytd',		//	one of the valid periods to extract - default unless both periodstart and periodend are defined
										//	1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
				interval: '1d',			//	one of the valid intervals to extract
										//	1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
				events: 'history',		// the type of events to extract, options are: history and ??

			},

		],
		waitforqueuetime: 0010, //don't change this - it simply helps the queue processor to run with a controlled internal loop
	},

	start: function () {

		Log.log(this.name + ' is started!');
		
		providerstorage[this.config.id] = {'trackingconsumerids': [], 'trackingStuff': {} }

		//tell node helper to store the config and display it's current status

		this.sendNotificationToNodeHelper("CONFIG", { moduleinstance: this.identifier, config: this.config });
		this.sendNotificationToNodeHelper("STATUS", { moduleinstance: this.identifier });

	},

	setConfig: function (config) {  //replace the standard to ensure feeds defaults are correctly set
		this.config = Object.assign({}, this.defaults, config);
		for (var jidx = 0; jidx < config.financefeeds.length; jidx++) {
			this.config.financefeeds[jidx] = Object.assign({}, this.defaults.financefeeds[0], config.financefeeds[jidx]);
			this.config.financefeeds[jidx]["useruntime"] = false;
			if (typeof this.config.financefeeds[jidx].timestamp == "number") { //wants an offset of the runtime, provided in seconds, or it was blank
				this.config.financefeeds[jidx]["useruntime"] = true;
				this.config.financefeeds[jidx]["adjustedruntime"] = new Date(moduleruntime.getTime() + (this.config.financefeeds[jidx].timestamp * 1000));
			}
		}
		this.config['input'] = 'https://query1.finance.yahoo.com/v8/finance/chart/';
		//validate that the provided settings are valid and log error if not

	},

	showElapsed: function () {
		endTime = new Date();
		var timeDiff = endTime - startTime; //in ms
		// strip the ms
		timeDiff /= 1000;

		// get seconds 
		var seconds = Math.round(timeDiff);
		return(" " + seconds + " seconds");
	},

	myconsumer: function (consumerid) {

		//check if this is one of  my consumers

		if (this.config.consumerids.indexOf(consumerid) >= 0) {
			return true;
		}

		return false;

	},

	notificationReceived: function (notification, payload, sender) {

		if (sender) {
			Log.log(this.name + " received a module notification: " + notification + " from sender: " + sender.name);
		} else {
			Log.log(this.name + " received a system notification: " + notification);
		}

		//if we get a notification that there is a consumer out there, if it one of our consumers, start processing
		//and mimic a response - we also want to start our cycles here
		//when we get multiple consumers to look after

		if ((notification == 'MMM-ChartDisplay_READY_FOR_ACTION' || notification == 'MMM-ChartDisplay_SEND_MORE_DATA') && this.myconsumer(payload.consumerid)){

			var self = this

			//clear all the tracking data for this consumer

			for (var key in providerstorage[self.config.id]['trackingStuff']) {

				stuffitem = providerstorage[self.config.id]['trackingStuff'][key];

				if (stuffitem['consumerids'].indexOf(payload.consumerid) > -1) {
					providerstorage[self.config.id]['trackingStuff'][key]['consumerids'].splice(stuffitem['consumerids'].indexOf(payload.consumerid),1);
				}

			}

			//store the consumer id so we know who to send data to in future
			//if we haven't already stored it

			if (providerstorage[this.config.id]['trackingconsumerids'].indexOf(payload.consumerid)==-1) {
				providerstorage[this.config.id]['trackingconsumerids'].push(payload.consumerid);
			}

			//now we need to use our nice little nodehelper to get us the stuff 
			//- be aware this is very very async and we migh hit twisty nickers

			//initial request to get data
			self.sendNotificationToNodeHelper("UPDATE", { moduleinstance: self.identifier, providerid: self.config.id });

			setInterval(function () {

				//within this loop, we request an update from the node helper of any new data it has found

				self.sendNotificationToNodeHelper("UPDATE", { moduleinstance: self.identifier, providerid: self.config.id } );

			}, this.config.datarefreshinterval); //perform every ? milliseconds.

		}

	},

	sleep: function (milliseconds) {
		const date = Date.now();
		let currentDate = null;
		do {
			currentDate = Date.now();
		} while (currentDate - date < milliseconds);
	},

	socketNotificationReceived: function (notification, nhpayload) {

		// as there is only one node helper for all instances of this module
		// we have to filter any responses that are not for us by checking this.identifier

		var self = this;

		//here we are getting an update from the node helper which has sent us 0 to many new data
		//we will have to store this data as a key so we can determine who got a copy and send everything as required

		if (notification == "UPDATED_STUFF_" + this.identifier) {

			//clear the consumer payloads that have been built previously

			consumerpayloads = {};

			// payload is an array of NDTF items, 
			// each item has a unique id created by the node helper// ????
			// each payload returned is flagged with the provider id who requested it
			// the node helper uses a timestamp on an item to determine which ones to send
			// so we have to assume that we wont get duplicates

			//because this is a generic piece of code, we use stuff as an indication of data we are receiving

			nhpayload.payloadformodule.forEach(function (stuffitem) {

				//create a new stuff entry and add to the tracking data

				var tse = { stuffID: stuffitem.id, consumerids: [], actualstuff: stuffitem };

				providerstorage[nhpayload.providerid]['trackingStuff'][stuffitem.id] = tse;

			});

			// now we send any new data to the consumer 
			// once a stuff item data has been sent to all consumers, we are asked to supply to, we remove 
			// it from the list, reducing the amount of processing required

			// but first lets send the data and track it with the consumerid we are sending it to

			for (var key in providerstorage[nhpayload.providerid]['trackingStuff']) {

				stuffitem = providerstorage[nhpayload.providerid]['trackingStuff'][key];

				// assume we are processing stuff that might not have been sent to everyone yet
				// we will be creating a payload for each consumer as a single blob of multiple stuff items
				// send this data to anyone who hasn't received it yet

				//look at each consumer we are tracking

				providerstorage[nhpayload.providerid]['trackingconsumerids'].forEach(function (trackingconsumerid) {

					//can we find this consumer in the list of consumers we have already sent this stuff to ?

					if (stuffitem['consumerids'].indexOf(trackingconsumerid) == -1) {

						//we assume when we add it to the payload and send it it goes!! (fire and forget)

						self.addtopayload(trackingconsumerid, stuffitem.actualstuff) 

						providerstorage[nhpayload.providerid]['trackingStuff'][stuffitem.stuffID]['consumerids'].push(trackingconsumerid); //and track we have sent this item to this consumer

					}
					
				});

			};

			//now send the payloads based on the payload contents

			for (var key in consumerpayloads) {

				//We may get a length key here, so we need to ignore it

				if (!(key == 'length')) {

					payload = consumerpayloads[key];

					//var feedDisplayPayload = { consumerid: '', providerid: '', payload: '' };

					var fdp = { consumerid: '', providerid: '', title: '', sourcetitle: '', payload: '' };

					fdp.consumerid = payload.consumerid;
					fdp.providerid = nhpayload.providerid;
					fdp.title = nhpayload.source.title;
					fdp.source = nhpayload.source;
					fdp.payload = payload.stuffitems;

					this.sendNotification('CHART_PROVIDER_DATA', fdp);
				}

			};

			//and finally clear out anything that has already been sent to everyone
			//we base this on the count of consumerids making it a bit quicker

			for (var key in providerstorage[nhpayload.providerid]['trackingStuff']) {

				stuffitem = providerstorage[nhpayload.providerid]['trackingStuff'][key];

				if (stuffitem.consumerids.length == this.config.consumerids.length) {

					delete providerstorage[nhpayload.providerid]['trackingStuff'][key];

				}

			};

		}

	},

	addtopayload: function (consumerid, stuff) {
		//build a new payload for each consumer that contains everything that needs to be sent
		//in the next update

		//check that the consumer has been added or not
		//if not add them and their data to their payload

		cpl = { consumerid: '', stuffitems: [] };

		if (!consumerpayloads[consumerid]) {

			cpl['consumerid'] = consumerid;
			cpl['stuffitems'].push(stuff);

			consumerpayloads[consumerid] = cpl;

		}
		else {

			//we have a payload being built for this consumer so just add the stuff to send to the  existing list

			consumerpayloads[consumerid]['stuffitems'].push(stuff);

		}

	},

	sendNotificationToNodeHelper: function (notification,payload) {
		this.sendSocketNotification(notification,payload);
	},

});

