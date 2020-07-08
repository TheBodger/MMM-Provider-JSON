var package =
{
	type: 'FlightArrivals', //mandatory //no spaces
	baseurl: 'http://api.aviationstack.com/v1/flights?access_key={apikey}&arr_iata={airportcode}&{countname}={count}&{offsetname}={offset}',//optional
	baseaddress: 'data', //default is null = root
	itemstype: 'array', //default is array
	input: 'URL',
	fields: [//mandatory
		{ flight_status: { outputname: 'status' } },
		{ terminal: { address: 'arrival' } },
		{ gate: { address: 'arrival' } },
		{ delay: { address: 'arrival' } },
		{ scheduled: { address: 'arrival', inputtype: 't', sort: true } },
		{ estimated: { address: 'arrival', inputtype: 't' } },
		{ iata: { address: 'arrival', key: true, outputname: 'subject' } }, //as this is the key it will be output as subject
		{ iata: { address: 'departure', outputname: 'remoteairport' } },
		{ actual: { address: 'arrival', inputtype: 't' } },
		{
			actual: {
				address: 'arrival',
				outputname: 'landed',
				inputtype: 't'
			}
		},
		{ name: { address: 'airline', outputname: 'airline' } },
		{ iata: { address: 'airline', outputname: 'airlineiata' } },
		{ icao: { address: 'airline', outputname: 'airlineicao' } },
		{ iata: { address: 'flight', outputname: 'flight' } },
		{ codeshared: { address: 'flight', inputtype: 'b' } },
		{ flight_iata: { address: 'flight.codeshared', outputname: 'codeshared_flight_iata' } },
		{ timezone: { address: 'arrival', outputname: 'tzd' } },
		{ aircraft: {} },
	],
	pagination: true,
	pagcountname: 'count',
	pagcount: 100,
	pagoffsetname: 'offset',
	pagbaseaddress: 'pagination',
	pagfields: [
		{ offset: { outputname: 'offset' } },
		{ total: { outputname: 'total' } },
		{ count: { outputname: 'count' } },
	],
	pagcriteria: '%returned%==%total%',
	//if count isn't returned from api then use the array length
	//if total available isn't returned from API, then use an array of 0 to indicate the end
	filter: true,
	//filcriteria: '%estimated%>=new Date(new Date(%today%).getTime() - (1000 * 60 * 60)).getTime()', //anything estimated to arrive today
	filcriteria: '%estimated%>=new Date(new Date().getTime() - (1000 * 60 * 60 * 48)).getTime()', //anything estimated to arrive around now

	//the dates are numeric unix ones, representing the local time at the airport of interest and held as UTC, no TZ and no DST indicated
	//i.e. 15:00 in NY is 15:00 15:00 in Sydney is 15:00; 
	//to create a date that can correctly be used to compare to the aviationstack dates, this formula should be used for a specific date and time
	//new Date(new Date('2020-07-04 18:40:00').getTime() - (1000 * 60 * 60)).getTime())
	//and this to check for any that arrived today
	//new Date(new Date(%today%).getTime() - (1000 * 60 * 60)).getTime())
}


//pagination: false,	//pagination supports polling the api multiple times, maintaining a counter of data obtained, so that an offset can be sent to the api
////it has an end condition that will be either when the data pulled is equal to the total records obtained from the API
////or some other condition defined and fulfilled based on the counter/actual contents of the data
////the latter is possible as we have a good definition of the data from the fields definitions and hence can apply numeric or date 
////criteria.
////when pagination is turned on, no data is sent to the consumer until all data is captured. TODO An option will be added to send data as it is polled.
////which of course relies on a) only sending deltas and b) the consumer being set up to aggregate.
////when using pagination, the baseurl should include any additional variables that will be substituted each time the api is called
////available variables are:
////offset, starts at 0, and is incremented by the value of returned count for each subsequent api call
////count, the number of entries to poll; set through the config value, pagcount
////these values should not be included int the urlparams entry
////pagination is only usable if the input type is URL
////pagination is applied after all processing has been completed from each call to the api.
////pagination takes place before sorting is applied, so all data is only sorted once.
//pagcount: 0,			//the number of entries to send to the API via the count variable if included in the base url
//	pagcountname: 'count',	//the name of the variable to be used in the substitution in the baseurl (i.e. {count} will become count=0)
//		pagoffsetname: 'offset',//the name of the variable to be used in the substitution in the baseurl (i.e. {offset} will become offset=0)

//			pagbaseaddress: null,	//a dotnotation base entry level from which the pagfields are defined from
//				pagfields: [],		//an array of field definitions that have special meaning if their outputname is one of the following
//					//total: the field in the data from the api call that provides an expected total number of records available
//					//offset: the field in the data that details the start of the current data in comparison to the total dataset
//					//count: the field in the data that details the number of entries returned (may not be the count requested through pagcount)
//					//if not count is available, then the count is populated from the length of the array of items returned

//					//other fields that are required within the end point criteria can be any of those defined in fields, using their outputnames (actual or implied)

//					pagcriteria: null,	//the criteria, using javascript notation,  expressed as a formulae that when true will stop the polling/processing of data
//						//the criteria is applied after each set of items returned from an api call has been processed, so processed=1 etc
//						//the criteria will be evaluated once all fields have been replaced based on the various rules, so that any other valid javascript will also be applied
//						//this enables the ability for example of adding or subtraction of time periods from today or now, such as (%indate%<%today%-new Date(200 days))
//						//variable replacement takes place by simply replacing any occurrence of the available fieldnames in the criteria with their current value
//						//therefore fields to be replaced in the criteria must be delimited by %

//						//variables can be taken from the fields defined in pagfields or the internal ones of:
//						//counter, the number of calls to the API
//						//processed, the number of entries within arrays that have been processed
//						//today, a timestamp of today at 1 second after midnight
//						//now, a timestamp created at the point of checking
//						//examples (%processed%==%total%) (%processed%=%max%) where max is defined in fields with a default value
//						//(%arrivaldate%>=%now%) where arrivaldate is taken from the data as defined in fields and now is recalculated as a timetamp each time the criteria is applied
//						//if a field in the criteria is defined as a timestamp type then it will be tested based on the unix timestamp in numeric format

//						//an empty or null pagcriteria when carrying out pagination will apply a check before processing commences to determine if there are any entries returned from the call to the api.
//						//if the count returned is 0 then polling and processing ends and whatever data captured to date will be sent to the module.
//						filter: false,		//if true the filter criteria are applied to each item and only if true will the item be stored 
//							//filter doesn't impact the processed counter
//							//filter can be applied even if pagination is false so it can be used to filter data from any source
//							filcriteria: null,	//the same process as with pagcriteria except it is applied against every candidate item
//							//criteria must return true for the item to be kept for sending to the module for reporting, the results are included in any sort processing