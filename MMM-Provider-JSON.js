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

Module.register("MMM-Provider-JSON", {

	// Default module config.
	defaults: {
		text: "MMM-Provider-JSON",
		consumerids: ["MMFD1"], // the unique id of the consumer(s) to listen out for
		id: "MMPJ1", //the unique id of this provider
		datarefreshinterval: 1000 * 60 * 60 * 24,	//milliseconds to pause before checking for new data // common timer for all consumers // 
													// adjust to ensure quote not breached on restricted aPi call limits
		input:'URL',		// either 'URL' (default), 'provider', 'filename'
		id: '',				// the id of this extracted data that will be used in the object field of the output
		baseurl: '',		// the fixed part of the url, can include insertable values {apikey} that will be taken from the named variables in the config, may also include defaults such as time or date 
		urlparams: null,	// (i.e. {apikey:'jakhsdfasdkfjh9875t-987asdgwe',something:'else'}, //TODO add dynamic URLparams
		baseaddress: null,  // a dotnotation base entry level from which all other data addresses are defined
		itemtype: 'array',	// how the items to process are arranged within the input
							// if array, then each item is accessed via an index
							// if object, then each item is accessed via some other method to be determined
		fields: [],			// an array of field definitions 
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
							// if no key is included and any field is flagged as sorting, even if first field, then the key field is flagged as sort

		waitforqueuetime: 0010, //don't change this - it simply helps the queue processor to run with a controlled internal loop
		filename:null,		//if set, the output data is also stored to this filename
	},

	start: function () {

		Log.log(this.name + ' is started!');
		
		providerstorage[this.config.id] = {'trackingconsumerids': [], 'trackingStuff': {} }

		//tell node helper to store the config and display it's current status

		this.sendNotificationToNodeHelper("CONFIG", { moduleinstance: this.identifier, config: this.config });
		this.sendNotificationToNodeHelper("STATUS", { moduleinstance: this.identifier });

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

		if ((notification == 'MMM-Consumer_READY_FOR_ACTION' || notification == 'MMM-Consumer_SEND_MORE_DATA') && this.myconsumer(payload.consumerid)){

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
			//- be aware this is very very async and we might hit twisty nickers

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

					this.sendNotification('PROVIDER_DATA', fdp);
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

