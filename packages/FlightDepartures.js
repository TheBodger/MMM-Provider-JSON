var package = 
{
	type: 'FlightDepartures',
	baseurl: 'http://api.aviationstack.com/v1/flights?access_key={apikey}&dep_iata={airportcode}',
	baseaddress: 'data',
	input: 'URL',
	itemstype: 'array', 
	fields: [ //mandatory
		{ flight_status: { outputname: 'status' } },
		{ terminal: { address: 'departure' } },
		{ gate: { address: 'departure' } },
		{
			scheduled: {
				address: 'departure',
				inputtype: 't',
				sort: true
			}
		},
		{
			estimated: {
				address: 'departure',
				inputtype: 't'
			}
		},
		{ delay: { address: 'departure' } },
		{
			iata: {
				address: 'departure',
				key: true,
				outputname: 'subject'
			}
		}, //as this is the key it will be output as subject
		{
			iata: {
				address: 'arrival',
				outputname: 'remoteairport'
			}
		},
		{
			actual: {
				address: 'departure',
				outputname: 'landed',
				inputtype: 't'
			}
		},
		{
			name: {
				address: 'airline',
				outputname: 'airline'
			}
		},
		{
			iata: {
				address: 'airline',
				outputname: 'airlineiata'
			}
		},
		{
			icao: {
				address: 'airline',
				outputname: 'airlineicao'
			}
		},
		{
			iata: {
				address: 'flight',
				outputname: 'flight'
			}
		},
		{
			codeshared: {
				address: 'flight',
				inputtype: 'b'
			}
		},
		{
			flight_iata: {
				address: 'flight.codeshared',
				outputname: 'codeshared_flight_iata'
			}
		},
		{
			timezone: {
				address: 'departure',
				outputname: 'tzd'
			}
		},

		{ aircraft: {} },
	]
}