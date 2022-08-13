


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

var package =
{
	type: 'OpenWeather', //mandatory //no spaces
	baseurl: 'http://datapoint.metoffice.gov.uk/public/data/val/wxfcs/all/json/{locationID}&units=metric&lang=en&key={appID}',//optional
	baseaddress: 'list', //default is null = root
	itemstype: 'array', //default is array
	input:'URL',
	fields: [//mandatory
		{ dt: { key: true, outputname: 'date', inputtype: 'n',outputtype: 'n' } }, //as this is the key it will be output as subject
		{ temp: { address: 'main', inputtype: 'n' } },
		{ icon: { address: 'weather', } },
		{ description: { address: 'weather', outputname: 'type', } },
		{ name: { address: 'city', outputname: 'location', } },

	],

}