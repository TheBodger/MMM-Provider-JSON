
var package =
{
	type: 'metOfficeWeather', //mandatory //no spaces
	baseurl: 'http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/{locationID}?res=3hourly&key={appID}',//optional
	baseaddress: 'SiteRep.DV.Location.Period', //default is null = root
	itemstype: 'array', //default is array
	input:'URL',
	fields: [//mandatory
		{ name: { key: true, outputname: 'location', } }, //as this is the key it will be output as subject // this doesnt pick up location but forces no object in output
		{ value: { outputname: 'date', inputtype: 't', timestampformat: 'YYY-MM-DD ', outputtype: 't' } }, //as this is the key it will be output as subject
		{ $: { address: 'Rep[]', inputtype: 'n', outputname: 'minutesPastmidnight', } },// Rep is an array so we need to loop through the data generating records for each one 
		{ G: { address: 'Rep[]', inputtype: 'n', outputname: 'windGust', } }, 
		{ S: { address: 'Rep[]', inputtype: 'n', outputname: 'windSpeed', } },
		{ P: { address: 'Rep[]', inputtype: 'n', outputname: 'pressure', } },
		{ Pp: { address: 'Rep[]', inputtype: 'n', outputname: 'precipitationPercent', } },
		{ T: { address: 'Rep[]', inputtype: 'n', outputname: 'temp', } },
		{ W: { address: 'Rep[]', outputname: 'weatherCode', } },
	],

}

//where weathercode returned is in:
//NA Not available
//0 Clear night
//1 Sunny day
//2 Partly cloudy(night)
//3 Partly cloudy(day)
//4 Not used
//5 Mist
//6 Fog
//7 Cloudy
//8 Overcast
//9 Light rain shower(night)
//10 Light rain shower(day)
//11 Drizzle
//12 Light rain
//13 Heavy rain shower(night)
//14 Heavy rain shower(day)
//15 Heavy rain
//16 Sleet shower(night)
//17 Sleet shower(day)
//18 Sleet
//19 Hail shower(night)
//20 Hail shower(day)
//21 Hail
//22 Light snow shower(night)
//23 Light snow shower(day)
//24 Light snow
//25 Heavy snow shower(night)
//26 Heavy snow shower(day)
//27 Heavy snow
//28 Thunder shower(night)
//29 Thunder shower(day)
//30 Thunder
