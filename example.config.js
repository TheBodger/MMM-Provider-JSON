The Output format is specified and can be a variation of the NDTF standard.

1) Specify the feed including base URL, API keys
2) Specify the rules to build the URL request portion
3) Specify where the data of interest is(Dot notation), the type(Array, object), fields(dot notation) and data format if required(timestamp conversion to Date().gettime, string to numeric, etc) 
4) The data is extracted and combined into base NDTF extended to(subject, object, timestamp, data values) - renamed accordingly: using codes that the display module will understand if neccessary(no data enhancement at this stage)
	I.e { Airport: 'BOS', object: 'FlightDepartures', departuretimestamp: 1912398713542, from: 'BOS', to: 'LHR', airline: 'BA', remarks: 'Delayed' }
5) Data can be sorted before output by any output key

Specifications:

id: '', // the id of this extracted data that will be used in the object field of the output
	baseurl: '', //the fixed part of the url, can include insertable values {apikey} that will be taken from the named variables in the config, may also include defaults such as time or date 
		urlparams: { fieldname: fieldvalue }, // (i.e. {apikey:'jakhsdfasdkfjh9875t-987asdgwe'},
baseaddress: '', //a dotnotation base entry level from which all other data addresses are defined
	itemstype: 'array/object' // how the items to process are arranged within the input
// if array, then each item is accessed via an index
// if object, then each item is accessed via some other method to be determined
fields: [], //an array of field definitions 
//field definitions are in the format of (|entry is optional|)
// {fieldname:{|address:'dotnotation from the base'|,|inputtype:fieldtype|,|timestampformat:'format'|,|outputtype:fieldtype|,|key:true|,outputname:''|,|sort:true|}}
// fieldname is  the  fieldname of the input field in the input data
// address is optional, if not specified then the data is extracted from the base address level
// fieldtype can be 'n', 's', 'b', 't' //if null it is copied as null regardless of output type
// n = numeric, the input is validated as numeric (converted to string if needed), the output is numeric 
// s = string, the input is converted to string if not string for output 
// b = boolean, the input is converted to true/false for output
// t = timestamp, the input is converted to a numeric unix format of time (equivalent of new Date(inputvalue).getTime()
// timestampformat=moment compatible format   timestamp can includes a format to help the conversion of the input to the output
// outputtype if ommitted the fieldvalue is simply copied as is, timestamps converted to unix numeric
// key indicates that this field should be used for the subject entry within the output, if not specificed then the first entry is the key, the key is the highest level to use if the data is sorted
//outputname is the name to use for the field in output, if not specified the fieldname is used
//sort indicates if this field should be included as a sort key, the sort order is always, key 1st and then any fields indicated as sort in the order they are entered in the fields array
//

{
    id: 'Flight Departures', //mandatory
    baseurl: 'http://api.aviationstack.com/v1/flights?access_key={apikey}&dep_iata={airportcode}',//mandatory
    urlparams: { apikey: '969f59f520085c78329e6ac8d439da32', airportcode: 'BOS' }, //optional
    baseaddress: 'data', //default is null = root
    itemstype: 'array', //default is array
    fields: [//mandatory
        { terminal: {address:'departure'} },
        { gate: { address: 'departure' } },
        { delay: { address: 'departure' } },
        { scheduled: { address: 'departure', inputtype: 't', timestampformat: 'TBD' ,sort:true} },
        { estimated: { address: 'departure', inputtype: 't', timestampformat: 'TBD' } },
        { actual: { address: 'departure', inputtype: 't', timestampformat: 'TBD' } },
        { delay: { address: 'departure' } },
        { iata: { address: 'departure', key: true } },
        { iata: { address: 'arrival', outputname: 'destination' } },
        { airline: { address: 'airline' } },
        { flight: { address: 'flight' } },
        { aircraft: { } },
        ],

}

//http://api.aviationstack.com/v1/flights?access_key=969f59f520085c78329e6ac8d439da32&dep_iata=BOS

{
    "pagination": {
        "limit": 100,
            "offset": 0,
                "count": 100,
                    "total": 758
    },
    "data": [
        {
            "flight_date": "2020-06-10",
            "flight_status": "scheduled",
            "departure": {
                "airport": "Logan International",
                "timezone": "America\/New_York",
                "iata": "BOS",
                "icao": "KBOS",
                "terminal": "B",
                "gate": null,
                "delay": null,
                "scheduled": "2020-06-10T11:00:00+00:00",
                "estimated": "2020-06-10T11:00:00+00:00",
                "actual": null,
                "estimated_runway": null,
                "actual_runway": null
            },
            "arrival": {
                "airport": "Philadelphia International",
                "timezone": "America\/New_York",
                "iata": "PHL",
                "icao": "KPHL",
                "terminal": "B",
                "gate": "B3",
                "baggage": "D",
                "delay": null,
                "scheduled": "2020-06-10T12:32:00+00:00",
                "estimated": "2020-06-10T12:32:00+00:00",
                "actual": null,
                "estimated_runway": null,
                "actual_runway": null
            },
            "airline": {
                "name": "Republic Airways",
                "iata": "YX",
                "icao": "RPA"
            },
            "flight": {
                "number": "4706",
                "iata": "YX4706",
                "icao": "RPA4706",
                "codeshared": null
            },
            "aircraft": null,
            "live": null
        },
        {
