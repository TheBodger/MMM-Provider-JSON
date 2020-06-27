var package =
{
	type: 'FlightArrivals', //mandatory //no spaces
	baseurl: 'http://api.aviationstack.com/v1/flights?access_key={apikey}&arr_iata={airportcode}',//optional
	baseaddress: 'data', //default is null = root
	itemstype: 'array', //default is array
	fields: [//mandatory
		{ flight_status: { outputname: 'status' } },
		{ terminal: { address: 'departure' } },
		{ gate: { address: 'departure' } },
		{ delay: { address: 'departure' } },
		{ scheduled: { address: 'departure', inputtype: 't', sort: true } },
		{ estimated: { address: 'departure', inputtype: 't' } },
		{ actual: { address: 'departure', inputtype: 't' } },
		{ iata: { address: 'arrival', key: true, outputname: 'subject' } }, //as this is the key it will be output as subject
		{ iata: { address: 'departure', outputname: 'remoteairport' } },
		{ actual: { address: 'arrival', outputname: 'landed', inputtype: 't' } },
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