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
var fs = require('fs');

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
		//this.paginationend = false;
		//this.pagoffset = 0; // maintains the current offset request to send to the api
		this.pagdetails = {
			paginationend: false,
			offset: 0,
			count: 0,
			total: 0,
			pagprocessed: 0,
			pagcounter: 0, // total number of items downloaded // populated from a count variable or the actual number in the array of items returned
			pagtoday: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0),
			pagnow: new Date(),
			pagallprocessed: false,
			usearraylength: true,
		}; 
	},

	stop: function () {
		console.log("Shutting down node_helper");
	},

	buildURL: function (config) {

		var tempURL = config.baseurl;

		// replace any parameters in the baseurl

		for (var param in config.urlparams) {
			tempURL = tempURL.replace('{' + param + '}', config.urlparams[param]);
		}

		//if we are paginating, check the pagination variables as well

		if (config.pagination) {

			//offset, starts at 0, and is incremented by the value of processed for each subsequent api call
			//count, the number of entries to poll; set through the config value, pagcount

			tempURL = tempURL.replace('{count}', config.pagcount);
			tempURL = tempURL.replace('{offset}', this.pagdetails.pagoffset);

			tempURL = tempURL.replace('{countname}', config.pagcountname);
			tempURL = tempURL.replace('{offsetname}', config.pagoffsetname);

		}

		console.log("API URL:", tempURL);

		return tempURL
	},

	setconfig: function (moduleinstance, config) {

		const self = this;

		if (this.debug) { this.logger[moduleinstance].info("In setconfig: " + moduleinstance + " " + config); }

		//deepcopy config

		var tempconfig = JSON.parse(JSON.stringify(config));

		// add a package if requested and specified

		if (tempconfig.package != null) {
			//try and read a file and merge its contents with the deepcopy
			var packagename = 'modules/MMM-Provider-JSON/packages/' + tempconfig.package + '.js';
			try {
				eval(fs.readFileSync(packagename) + '');
				Object.assign( tempconfig, package); //merge
			}
			catch (err) {
				//failed so we report and continue

				console.error("Reading package file:", tempconfig.package , ' returned error: ', JSON.stringify(err));
			}
        }

		//build the input details

		if (tempconfig.input != null) {

			tempconfig['useHTTP'] = false;

			// work out if we need to use a HTTP processor and build the url and store in the input field for compatibility 
			// with the old code for handling JSON

			if (tempconfig.input == "URL") {
				tempconfig.useHTTP = true;
			}

		}

		//now build all the required values from the defaults if not entered in the config
		//creating a working fields set for this instance

		//add an outputname if not specified
		//find any sort values and populate the sort control arrays
		//if key not specified then make first field the key field
		//if inputtype not set make it 's'
		
		var keyfound = false;
		var sorting = false;
		var sortkeys = [];

		tempconfig.fields.forEach(function (field, index) {

			//get the fieldname

			var fieldname = Object.keys(field)[0];
			var fieldparams = field[fieldname];

			tempconfig.fields[index]['fieldname'] = fieldname;

			tempconfig.fields[index]['outputname'] = fieldparams.outputname;

			if (fieldparams.outputname == null) { tempconfig.fields[index]['outputname'] = fieldname; }

			tempconfig.fields[index].fieldtype = fieldparams.inputtype;

			if (fieldparams.inputtype == null) {
				tempconfig.fields[index].fieldtype = 's'; 
			}

			if (fieldparams.timestampformat != null) {
				tempconfig.fields[index]['timestampformat'] = fieldparams.timestampformat;
			}

			if (fieldparams.key) { //add to the sort list, just in case, in first place
				keyfound = true;
				sortkeys.unshift(tempconfig.fields[index]['outputname'])
				tempconfig.fields[index]['key'] = true;
			}
			else if (fieldparams.sort) {
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

		tempconfig['sorting'] = sorting;
		tempconfig['sortkeys'] = sortkeys;

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

		tempconfig.rootkey = tempconfig.baseaddress;

		//store a local copy so we dont have keep moving it about

		providerstorage[moduleinstance] = { config: tempconfig, trackingfeeddates: [] };

		this.outputarray = [];

		//pagination and filtering

		//if some fields are entered as '' they are converted to null to simplify testing downstream

		if (!tempconfig.pagination) { this.pagdetails.paginationend = true;} //we force a true situation to process data after processfeed

		this.pagdetails.usearraylength = true;

		tempconfig.pagfields.forEach(function (pagfield, index) {

			var fieldname = Object.keys(pagfield)[0];
			var fieldparams = pagfield[fieldname];

			tempconfig.pagfields[index]['fieldname'] = fieldname;

			tempconfig.pagfields[index]['outputname'] = fieldparams.outputname;

			if (fieldparams.outputname == null) {
				tempconfig.pagfields[index]['outputname'] = fieldname;
			}

			if (tempconfig.pagfields[index].outputname == 'count') { self.pagdetails.usearraylength = false;}

		})

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
		var options;

		const tempconfig = providerstorage[moduleinstance].config;

		if (this.debug) { this.logger[moduleinstance].info("In processfeeds: " + moduleinstance + " " + providerid); }

		//if pagination is set then this module will be recursively called from processfeed

		if (tempconfig.useHTTP) {
			tempconfig.input = this.buildURL(tempconfig); //rebuilds for each call, with offset etc being updated
			options = new URL(tempconfig.input);
		}

		var JSONconfig = {
			options: options,
			config: tempconfig,
			feed: '',
			moduleinstance: moduleinstance,
			providerid: providerid,
			feedidx: 0,
		};

		JSONconfig['callback'] = function (JSONconfig, inputjson) {

			var jsonerror = utilities.getkeyedJSON(inputjson, JSONconfig.config.errorkey);

			var jsonarray = utilities.getkeyedJSON(inputjson, JSONconfig.config.rootkey);


			//check to see if we have an actual error to report

			if (jsonerror != null) {
				console.error(jsonerror[JSONconfig.config.errorcode], jsonerror[JSONconfig.config.errordescription]);
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

			if (JSONconfig.config.pagination) {//get the count etc details
				var pagmeta = utilities.getkeyedJSON(inputjson, JSONconfig.config.pagbaseaddress);

				JSONconfig.config.pagfields.forEach(function (pagfield) {

					var dotaddress = pagfield.fieldname;

					if (pagfield[pagfield.fieldname].address != null) { dotaddress = pagfield[pagfield.fieldname].address + '.' + dotaddress; }

					self.pagdetails[pagfield[pagfield.fieldname].outputname] = utilities.getkeyedJSON(pagmeta, dotaddress);

				})

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

		if (this.outputarray.length > 0) {

			this.sendNotificationToMasterModule("UPDATED_STUFF_" + moduleinstance, payloadforprovider);

		}

		// as we have sent it and the important date is stored we can clear the outputarray

		this.outputarray = [];

		this.queue.processended();

	},

	processfeed: function (feed, moduleinstance, providerid, feedidx, jsonarray) {

		//we process the JSON  here / 1 dataset

		const config = providerstorage[moduleinstance].config;

		var sourcetitle = feed.sourcetitle;

		var self = this;

		var maxfeeddate = new Date(0);

		//pagination - we are about to start processing the incoming entries
		//so we count them and check at the end of each one if we have met the criteria
		//otherwise we call processfeeds again

		//if the count field variable isn't defined, then we use the number of items returned
		
		if (this.pagdetails.usearraylength) {
			this.pagdetails.pagcounter += jsonarray.length;
		}
		else {
			this.pagdetails.pagcounter += this.pagdetails.count;
		}

		for (var idx = 0; idx < jsonarray.length; idx++) {

			var processthisitem = true; //drop items not meeting any validation rules
			var tempitem = {object:config.type};

			const item = jsonarray[idx];

			config.fields.forEach( function(field) {

			//depending on the field type we need to validate and convert

				var dotaddress = field.fieldname;

				if (field[field.fieldname].address != null) { dotaddress = field[field.fieldname].address + '.' + dotaddress;}

				var validatedfield = self.validateconvertfield(field, utilities.getkeyedJSON(item, dotaddress));//extract using a dotnotation key

				if (validatedfield.valid) {
					if (field.key) {
						tempitem['subject'] = validatedfield.value;
					}
					else {
						tempitem[field.outputname] = validatedfield.value;
					}
				}
				else {
					processthisitem = false;
				}

			})

			if (processthisitem) {

				//filtering

				//we check now if we should include this item Dependant on filtering

				if (this.filterkeep(config,tempitem)) { this.outputarray.push(tempitem); }

			}
				
		}  //end of process loop - input array

		// if paginating, and not end criteria met, we call processfeeds again

		if (config.pagination) {
			this.pagdetails.pagoffset = this.pagdetails.pagcounter;
			this.pagdetails.paginationend = this.checkendofpagination(config, tempitem);
		}

		if (!this.pagdetails.paginationend) {
			this.processfeeds(moduleinstance, providerid);
		}
		else { //we are finished at the last check so we go to sorting and sending 

			if (config.sorting) { //carry out multi level sort

				var sortutility = new utilities.mergeutils();

				sortutility.preparesort('sortme', this.outputarray[0], config.sortkeys, false);
				JSONutils.putJSON("./" + "B" + config.filename, this.outputarray);
				this.outputarray = sortutility.sortset(this.outputarray);
				JSONutils.putJSON("./" + "A" + config.filename, this.outputarray);
			}

			if (config.filename == null) {
				console.info("Extracted " + this.outputarray.length + " records");
			}
			else {

				// write out to a file

				JSONutils.putJSON("./" + config.filename, this.outputarray);

				console.info("Extracted " + this.outputarray.length + " records");

			}

			var rsssource = new RSS.RSSsource();
			rsssource.sourceiconclass = '';
			rsssource.sourcetitle = '';
			rsssource.title = '';

			self.send(moduleinstance, providerid, rsssource, feedidx);
			self.done();
		}

	},

	filterkeep: function (config, tempitem) {

		//if filter is true, then apply the criteria to the current item



		return true;

	},

	checkendofpagination: function (config, currentitem) {


		asrfg alkfslk ajflsg lfsj glkjdsf lajl dsfjlklakj g

		return false; // force not end of pagination
    },

	validateconvertfield: function (fieldconfig, value) {

		// fieldtype can be 'n', 's', 'b', 't'
		// n = numeric, the input is validated as numeric (converted to string if needed), the output is numeric 
		// s = string, the input is converted to string if not string for output
		// b = boolean, the input is converted to true/false for output
		// t = timestamp, the input is converted to a numeric unix format of time (equivalent of new Date(inputvalue).getTime()
		//	timestamp can includes a format to help the conversion of the input to the output

		var result = { valid: true, value: value };

		if (value == null) { //if  null just pass it on
			return result;
		}

		if (fieldconfig.fieldtype == 's' ) { //if a string just pass it on
			result.value = value.toString();
			return result;
		}

		if (fieldconfig.fieldtype == 'n' && ( (typeof value) == "number" || !isNaN(parseFloat(value)) ) ) {
			result.value = parseFloat(value);
			return result;
        } 

		if (fieldconfig.fieldtype == 'b') {
			if (typeof value == 'string' && (value.toLowerCase == 'false' || parseFloat(value) == 0)) {
				result.value = false;
			} else {
				result.value = Boolean(value);
			}
			return result;
		} 

		if (fieldconfig.fieldtype == 't') {
			if (fieldconfig.timestampformat == null) {
				if (moment(value).isValid()) {
					result.value = moment(value).toDate().getTime();
					return result;
				}
			}
			else {
				if (moment(value,fieldconfig.timestampformat).isValid()) {
					result.value = moment(value).toDate().getTime();
					return result;
				}
			}
		}

		result.valid = false;
		
		return result;

	},

});