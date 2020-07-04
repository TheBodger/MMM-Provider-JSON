var package =
{
	type: 'FlightArrivals', //mandatory //no spaces
	baseurl: 'http://api.aviationstack.com/v1/flights?access_key={apikey}&arr_iata={airportcode}',//optional
	baseaddress: 'data', //default is null = root
	itemstype: 'array', //default is array
	input:'URL',
	fields: [//mandatory
		{ flight_status: { outputname: 'status' } },
		{ terminal: { address: 'arrival' } },
		{ gate: { address: 'arrival' } },
		{ delay: { address: 'arrival' } },
		{ scheduled: { address: 'arrival', inputtype: 't', sort: true } },
		{ estimated: { address: 'arrival', inputtype: 't' } },
		{ actual: { address: 'arrival', inputtype: 't' } },
		{
			actual: {
				address: 'arrival',
				outputname: 'landed',
				inputtype: 't'
			}
		},
		{ iata: { address: 'arrival', key: true, outputname: 'subject' } }, //as this is the key it will be output as subject
		{ iata: { address: 'departure', outputname: 'remoteairport' } },
		{ name: { address: 'airline', outputname: 'airline' } },
		{ iata: { address: 'airline', outputname: 'airlineiata' } },
		{ icao: { address: 'airline', outputname: 'airlineicao' } },
		{ iata: { address: 'flight', outputname: 'flight' } },
		{ codeshared: { address: 'flight', inputtype: 'b' } },
		{ flight_iata: { address: 'flight.codeshared', outputname: 'codeshared_flight_iata' } },
		{ timezone: { address: 'arrival', outputname: 'tzd' } },
		{ aircraft: {} },
	],

}