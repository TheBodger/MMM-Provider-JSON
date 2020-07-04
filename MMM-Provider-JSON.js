/* global Module, MMM-ChartProvider-Finance */

/* Magic Mirror
 * Module: MMM-ChartProvider-JSON
 *
 * By Neil Scott
 * MIT Licensed.
 */


//todo: add a package option where the fields definiton can be pulled from an external package (i.e. flight arrival, flighdeparture)

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
													// adjust to ensure quota not breached on restricted aPi call limits
		input:'URL',		// either 'URL' (default), 'provider', 'filename'
		id: '',				// the id of this module that must be unique
		type: 'FlightArrivals',				// the type of this extracted data that will be used in the object field of the output
		baseurl: '',		// the fixed part of the url, can include insertable values such as {apikey} that will be taken from the named variables in the config, may also include defaults such as time or date 
		urlparams: null,	// (i.e. {apikey:'jakhsdfasdkfjh9875t-987asdgwe',something:'else'}, //TODO add dynamic URLparams
		baseaddress: null,  // a dotnotation base entry level from which all other data addresses are defined
		itemtype: 'array',	// how the items to process are arranged within the input
							// if array, then each item is accessed via an index
							// if object, then each item is accessed via some other method to be determined
		package:'',
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
							// key indicates that this field should be used for the subject entry within the output, if not specified then the first entry is the key, the key is the highest level to use if the data is sorted
							// outputname is the name to use for the field in output, if not specified the fieldname is used
							// sort indicates if this field should be included as a sort key, the sort order is always, key 1st and then any fields indicated as sort in the order they are entered in the fields array
							// default provides a value that the field will be initialized to before the data is processed for each entry, ensuring that the output will contain a value
							// default provides the ability to create literals to be sued in the pagination process
							// if no key is included and any field is flagged as sorting, even if first field, then the key field is flagged as sort
		pagination: false,	//pagination supports polling the api multiple times, maintaining a counter of data obtained, so that an offset can be sent to the api
							//it has an end condition that will be either when the data pulled is equal to the total records obtained from the API
							//or some other condition defined and fulfilled based on the counter/actual contents of the data
							//the latter is possible as we have a good definition of the data from the fields definitions and hence can apply numeric or date 
							//criteria.
							//when pagination is turned on, no data is sent to the consumer until all data is captured. TODO An option will be added to send data as it is polled.
							//which of course relies on a) only sending deltas and b) the consumer being set up to aggregate.
							//when using pagination, the baseurl should include any additional variables that will be substituted each time the api is called
							//available variables are:
							//offset, starts at 0, and is incremented by the value of returned count for each subsequent api call
							//count, the number of entries to poll; set through the config value, pagcount
							//these values should not be included int the urlparams entry
							//pagination is only usable if the input type is URL
							//pagination is applied after all processing has been completed from each call to the api.
							//pagination takes place before sorting is applied, so all data is only sorted once.
		pagcount: 0,			//the number of entries to send to the API via the count variable if included in the base url
		pagcountname: 'count',	//the name of the variable to be used in the substitution in the baseurl (i.e. {count} will become count=0)
		pagoffsetname: 'offset',//the name of the variable to be used in the substitution in the baseurl (i.e. {offset} will become offset=0)
		
		pagbaseaddress: null,	//a dotnotation base entry level from which the pagfields are defined from
		pagfields: [],		//an array of field definitions that have special meaning if their outputname is one of the following
							//total: the field in the data from the api call that provides an expected total number of records available
							//offset: the field in the data that details the start of the current data in comparison to the total dataset
							//count: the field in the data that details the number of entries returned (may not be the count requested through pagcount)
							//if not count is available, then the count is populated from the length of the array of items returned

							//other fields that are required within the end point criteria can be any of those defined in fields, using their outputnames (actual or implied)

		pagcriteria: null,	//the criteria, using javascript notation,  expressed as a formulae that when true will stop the polling/processing of data
							//the criteria is applied after each set of items returned from an api call has been processed, so processed=1 etc
							//the criteria will be evaluated once all fields have been replaced based on the various rules, so that any other valid javascript will also be applied
							//this enables the ability for example of adding or subtraction of time periods from today or now, such as (%indate%<%today%-new Date(200 days))
							//variable replacement takes place by simply replacing any occurrence of the available fieldnames in the criteria with their current value
							//therefore fields to be replaced in the criteria must be delimited by %
							
							//variables can be taken from the fields defined in pagfields or the internal ones of:
							//counter, the number of calls to the API
							//returned, the total number of entries returned in the arrays
							//today, a timestamp of today at 1 second after midnight
							//now, a timestamp created at the point of checking
							//examples (%processed%==%total%) (%processed%=%max%) where max is defined in fields with a default value
							//(%arrivaldate%>=%now%) where arrivaldate is taken from the data as defined in fields and now is recalculated as a timetamp each time the criteria is applied
							//if a field in the criteria is defined as a timestamp type then it will be tested based on the unix timestamp in numeric format

							//an empty or null pagcriteria when carrying out pagination will apply a check before processing commences to determine if there are any entries returned from the call to the api.
							//if the count returned is 0 then polling and processing ends and whatever data captured to date will be sent to the module.
		filter: false,		//if true the filter criteria are applied to each item and only if true will the item be stored 
							//filter doesn't impact the processed counter
							//filter can be applied even if pagination is false so it can be used to filter data from any source
		filcriteria: null,	//the same process as with pagcriteria except it is applied against every candidate item
							//criteria must return true for the item to be kept for sending to the module for reporting, the results are included in any sort processing

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

		if ((notification == 'MMM-Consumer_READY_FOR_ACTION' || notification == 'MMM-Consumer_SEND_MORE_DATA') && this.myconsumer(payload.consumerid)) {
		
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

