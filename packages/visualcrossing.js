//https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/ascot?unitGroup=uk&key=YOUR KEY HERE&include=days&elements=datetime,moonphase,sunrise,sunset,moonrise,moonset


//{"queryCost":1,"latitude":51.4107,"longitude":-0.6738,"resolvedAddress":"Ascot, England, United Kingdom","address":"ascot","timezone":"Europe/London","tzoffset":1.0,
//"days": [{ "datetime": "2022-08-12", "sunrise": "05:43:32", "sunset": "20:30:57", "moonphase": 0.5, "moonrise": "21:20:40", "moonset": "05:37:21" }, { "datetime": "2022-08-13", "sunrise": "05:45:06", "sunset": "20:29:02", "moonphase": 0.52, "moonrise": "21:38:52", "moonset": "07:08:01" }, { "datetime": "2022-08-14", "sunrise": "05:46:41", "sunset": "20:27:05", "moonphase": 0.54, "moonrise": "21:53:48", "moonset": "08:34:20" }, { "datetime": "2022-08-15", "sunrise": "05:48:15", "sunset": "20:25:07", "moonphase": 0.58, "moonrise": "22:07:16", "moonset": "09:56:59" }, { "datetime": "2022-08-16", "sunrise": "05:49:50", "sunset": "20:23:08", "moonphase": 0.62, "moonrise": "22:20:51", "moonset": "11:16:14" }, { "datetime": "2022-08-17", "sunrise": "05:51:25", "sunset": "20:21:08", "moonphase": 0.67, "moonrise": "22:35:49", "moonset": "12:32:57" }, { "datetime": "2022-08-18", "sunrise": "05:53:00", "sunset": "20:19:06", "moonphase": 0.72, "moonrise": "22:53:34", "moonset": "13:49:10" }, { "datetime": "2022-08-19", "sunrise": "05:54:35", "sunset": "20:17:04", "moonphase": 0.77, "moonrise": "23:15:51", "moonset": "15:03:14" }, { "datetime": "2022-08-20", "sunrise": "05:56:10", "sunset": "20:15:00", "moonphase": 0.82, "moonrise": "23:44:44", "moonset": "16:14:02" }, { "datetime": "2022-08-21", "sunrise": "05:57:45", "sunset": "20:12:56", "moonphase": 0.86, "moonset": "17:19:16" }, { "datetime": "2022-08-22", "sunrise": "05:59:20", "sunset": "20:10:51", "moonphase": 0.9, "moonrise": "00:22:28", "moonset": "18:14:20" }, { "datetime": "2022-08-23", "sunrise": "06:00:55", "sunset": "20:08:44", "moonphase": 0.94, "moonrise": "01:12:09", "moonset": "18:58:43" }, { "datetime": "2022-08-24", "sunrise": "06:02:30", "sunset": "20:06:37", "moonphase": 0.97, "moonrise": "02:11:54", "moonset": "19:32:41" }, { "datetime": "2022-08-25", "sunrise": "06:04:06", "sunset": "20:04:29", "moonphase": 0.99, "moonrise": "03:20:18", "moonset": "19:57:51" }, { "datetime": "2022-08-26", "sunrise": "06:05:41", "sunset": "20:02:20", "moonphase": 1.0, "moonrise": "04:32:15", "moonset": "20:17:10" }]}

var package =
{
	type: 'visualcrossing', //mandatory //no spaces
	baseurl: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{locationID}?unitGroup={countryID}&key={appID}&include=days&elements=datetime,moonphase,moonrise,moonset',//optional
	baseaddress: 'days', //default is null = root
	itemstype: 'array', //default is array
	input: 'URL',
	fields: [//mandatory
		{ name: { key: true, outputname: 'location', } }, //this is a cludge to force the next field to use the outputname otherwise it will be called subject !!
		{ datetime: { outputname: 'date', inputtype: 't', timestampformat: 'YYY-MM-DD', outputtype: 't' } }, //as this is the 1st entry it will be a key it will be output as subject
		{ moonphase: { inputtype: 'n', outputname: 'moonphase', } },// Rep is an array so we need to loop through the data generating records for each one 
		{ moonrise: { inputtype: 'd', outputname: 'moonrise',  } },
		{ moonset: { inputtype: 'd', outputname: 'moonset', outputtype: 'd', } },
	],

}

//where moonphase is: from 0 (the new moon) to 0.5 (the full moon) and back to 1 (the next new moon)

//moonrise (day only, optional) – The formatted time of the moonrise (For example “2022-05-23T02:38:10”)

//moonriseEpoch(day only, optional) – moonrise time specified as number of seconds since 1st January 1970 in UTC time

//moonset(day only, optional) – The formatted time of the moonset(For example “2022 - 05 - 23T13: 40: 07”)

//moonsetEpoch(day only, optional) – moonset time specified as number of seconds since 1st January 1970 in UTC time

