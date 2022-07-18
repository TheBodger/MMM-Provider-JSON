


//http://api.aviationstack.com/v1/flights?access_key={apikey}&arr_iata={airportcode}

//http://api.openweathermap.org/geo/1.0/direct?q={city name},{state code},{country code}&limit={limit}&appid={API key}
//http://api.openweathermap.org/geo/1.0/direct?q=Ascot&limit=5&appid=3508e37c895681628e59eb77bc181b49

//old call formats - still supported
//https://api.openweathermap.org/data/2.5/weather?id=2656992&units=metric&lang=en&APPID=e7c8f92f8c281a8679abe84c37d4883c
//https://api.openweathermap.org/data/2.5/forecast?id=2656992&units=metric&lang=en&APPID=3508e37c895681628e59eb77bc181b49

//new call formats
//https://api.openweathermap.org/data/2.5/weather?lat=51.4062&lon=-0.6756&appid=3508e37c895681628e59eb77bc181b49
//http://api.openweathermap.org/data/2.5/forecast?lat=51.4101286&lon=-0.6680194&appid=3508e37c895681628e59eb77bc181b49


//51.4062° N, 0.6756° W
//"lat": 51.4101286,
//"lon": -0.6680194,


////config settings:
//{
//	module: "MMM-Provider-JSON",
//		config: {
//		consumerids: ["testConsumer",], //mandatory ID of the consumer receiving the data from the module
//		id: 'openweatherAscot', //mandatory unique ID
//		package: 'OpenWeather', //name of the package that contains a standard set of config details
//		urlparams: { appID: '3508e37c895681628e59eb77bc181b49', locationID: '2656992' },
//		filename: 'openweather.json', //the name of an output file containing the details sent to the consumer for debug usage etc
//		}
//},

//{
//	module: "MMM-Provider-JSON",
//		config: {
//		consumerids: ["testConsumer",], //mandatory ID of the consumer receiving the data from the module
//		id: 'metofficeAscot', //mandatory unique ID
//		package: 'metofficeWeather', //name of the package that contains a standard set of config details
//		urlparams: { appID: '2acecf0e-fb12-4870-b1e0-975b728172f7', locationID: '350153' },
//		filename: 'openweather.json', //the name of an output file containing the details sent to the consumer for debug usage etc
//		}
//},

//		//		apiBase: "http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/",
		//		locationID: 350153, //Ascot http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/sitelist?key=2acecf0e-fb12-4870-b1e0-975b728172f7
		//		apiKey: "2acecf0e-fb12-4870-b1e0-975b728172f7",
//http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/xml/3840?res=3hourly&key=01234567-89ab-cdef-0123-456789abcdef
var package =
{
	type: 'metOfficeWeather', //mandatory //no spaces
	baseurl: 'http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/{locationID}?res=3hourly&key={appID}',//optional
	baseaddress: 'SiteRep.DV.Location.Period', //default is null = root
	itemstype: 'array', //default is array
	input:'URL',
	fields: [//mandatory
		//2022-07-15Z
		{ name: { key: true, outputname: 'location', } }, //as this is the key it will be output as subject
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

//where weathercode:
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
