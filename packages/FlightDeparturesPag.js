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
		{
			actual: {
				address: 'arrival',
				outputname:'landed',
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