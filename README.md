# MMM-Provider-JSON

This magic mirror module is a MMM-Provider module that will extract specified data from a JSON feed and provide it to any requesting consumers in a defined JSON format.

The module can obtain data from a URL, a local file or the output from another provider providing data in well formed JSON

## Usage

1) Specify the input source including base URL along with any API keys and parameters required
2) Specify field definitions that detail the data returned from the API call as well as any transformations for the output
3) Data can be sorted before being sent to the requesting consumer.

### Example
![Example of MMM-Provider-JSON output being displayed through the MMM-Consumer-Flights module](images/screenshot.png?raw=true "Example screenshot")

Example of MMM-Provider-JSON output being displayed through the MMM-Consumer-Flights module

### Dependencies

This module requires both MMM-FeedUtilities and MMM-ChartUtilies to be installed.

	Before installing this module;
		Install and then read README.md for https://github.com/TheBodger/MMM-ChartUtilities to setup the MMM-Chart... dependencies and  install all modules.
		Install and then read README.md for https://github.com/TheBodger/MMM-FeedUtilities to setup the MMM-Feed... dependencies and  install all modules.

		npd install moment

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-Provider-JSON`

## Using the module

### MagicMirror² Configuration

To use this module, add the following minimum configuration block to the modules array in the `config/config.js` file:
```js
{
module: "MMM-Provider-JSON",
			config: {
				consumerids: ["consumerid",],
				id: 'uniqueID', 
				package: 'packagename',
			}
},
```

Check out the example.config.js file for an example of a config that will produce an input of flights arriving at a specific airport for the MMM-Consumer-Flights module

### Configuration Options

| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - <br><br> **Possible values:** Any string.<br> **Default value:** The Module name
| `consumerids`                | *Required* - <br><br> **Possible values:** Any consumerid(s) matching requesting consumer modules .<br> **Default value:** none
| `id`                | *Required* - <br><br> **Possible values:** Any unique string identifying this instance of the module.<br> **Default value:** none
| `initialdelay`                | *Optional* - <br><br> **Possible values:** Any numeric value indicating the milliseconds to delay before the module starts checking for new data  .<br> **Default value:** none
| `datarefreshinterval`                | *Optional* - <br><br> **Possible values:** Any numeric value indicating the milliseconds to pause before checking for new data  .<br> **Default value:** 1000 * 60 * 60 * 24 (1 day)
| `package`                | *Optional* - <br><br> **Possible values:** Any package name of a package in the packages folder excluding the .js suffix that contains any config entries for this module that will overwrite and merged with the config during run time<br> **Default value:** none
| `input`                | *Optional* - <br><br> **Possible values:** 'URL', path of a file, 'provider'(TODO) <br> **Default value:** 'URL'
| `type`                | *Required* - <br><br> **Possible values:** Any string that will be sent in the Object field in the output<br> **Default value:** none
| `baseurl`                | *Optional* - <br><br> **Possible values:** if required, a fully formed api URL, with any parameters included in the format {paramatername}<br> **Default value:** none
| `urlparams`                | *Optional* - <br><br> **Possible values:** if required, an array of  paramater names and values that will be embedded into the baseurl<br> **Default value:** none
| `baseaddress`                | *Optional* - <br><br> **Possible values:** The JSON field from which all other data will be extracted in dot notation format. Must point to a JSON array if itemtype is array<br> **Default value:** none
| `itemtype`                | *Optional* - <br><br> **Possible values:** Currently array<br> **Default value:** `array`
| `fields`                | *Optional* - <br><br> **Possible values:** An array of field definitions<br> **Default value:** none
| `filename`                | *Optional* - <br><br> **Possible values:** The path and filename where the output JSON object can be wrritten to for debug usage<br> **Default value:** none


### Field definitions

	field definitions are in the format: (|entry is optional|)
	{fieldname:{|address:'dotnotation from the base|[]|'|,|inputtype:fieldtype|,|outputtype:fieldtype|,|key:true|,|outputname:''|,|sort:true|,|default:''|}}
		fieldname is  the  fieldname of the input field in the input data.
		address is optional, if not specified then the data is extracted from the base address level.  
		If suffixed by [] then it there is a secondary array of values of 0 or more entries. A record will be produced by looping through the secondary array and adding any non array fields from the main array. See the metoffice package for an example. 
		Currently only 1 subsequent level is supported and all fields with an secondary array address must have the same address
		
		!!These fields must come after none array fields, otherwise the data send to the consumer will be incomplete at best and corrupted at worst!!
		fieldtype can be 'n', 's', 'b', 't'
			n = numeric, the input is validated as numeric (converted to string if needed), the output is numeric 
			s = string, the input is converted to string if not string for output
			b = boolean, the input is converted to true/false for output
			t = timestamp, the input is converted to a numeric unix format of time (equivalent of new Date(inputvalue).getTime()
				timestamp can include a format to help the conversion of the input to the output (see examples)
			d = time of day, in format hh:mm:ss or hh:mm - 24 hour clock, assumes UTC, any timezone adjustements should be made by the consuming module
		key indicates that this field should be used for the subject entry within the output, if not specified then the first entry is the key, the key is the highest level to use if the data is sorted
		outputname is the name to use for the field in output, if not specified the fieldname is used
		sort indicates if this field should be included as a sort key, the sort order is always, key 1st and then any fields indicated as sort in the order they are entered in the fields array
		default can be used to provide the variable with a default value that can be used as if it is a literal for criteria validation 
		if no key is included and any field is flagged as sorting, even if first field, then the key field is also flagged as sort

### Example configuration

See example.config.js and the package FlightArrivals.js in the packages folder for a configuration that will return fleight departure data for an airport that is formatted to work with the WWW-Consumer-Flights module

### Additional Notes

This is a WIP; changes are being made all the time to improve the compatibility across the modules. Please refresh this and the MMM-feedUtilities and MMM-ChartUtilities modules with a `git pull` in the relevant modules folders.

The included packages provide data for arrivals and departures to/from an airport, which uses the aviationstack API. This api provides comprehensive live data from most airports in the world of the status of all flights amongst other flight information. There is a free option which provides a maximum of 500 calls per month or you can buy more.

The packages ending in Pag include pagination and filter options that will ensure all the available data for any airport is pulled back, and only flights scheduled in the last 2 hours or in the future are included.

To obtain an aviationstack api to embded in the config, sign up at https://www.aviationstack.com and then collect the API key. Use the dashboard provided to track your API usage.

The entries in the package file take precedence over the config, to ensure the option in the config is used (such as the input option) then remove the entry from the package file.

### initialdelay

The initialdelay option can be used to enable multiple providers in a config to send data to a consumer in a staggered fashion. 

For example, if you wanted to send arrivals information from multiple airports at 20 minute intervals on an hourly cycle to a single flights module, then initialdelay can be used as follows:

provider1, initialdelay 0 milliseconds, airport LHR, datarefreshinterval 1000 * 60 * 60 milliseconds<BR>
provider2, initialdelay 1000 * 60 * 20 milliseconds, airport LGW, datarefreshinterval 1000 * 60 * 60 milliseconds<BR>
provider3, initialdelay 1000 * 60 * 40 milliseconds, airport STN, datarefreshinterval 1000 * 60 * 60 milliseconds<BR>


The flight module would see data as follows:

@ 0 milliseconds:			0 minutes:	LHR Data<BR>
@ 1000 * 60 * 20 milliseconds: 20 minutes:	LGW Data<BR>
@ 1000 * 60 * 40 milliseconds: 40 minutes:	STN Data<BR>

then as the data refreshes every 1000 * 60 * 60 milliseconds (1 hour)

@60 minutes:	LHR Data<BR>
@80 minutes:	LGW Data<BR>
@100 minutes:	STN Data<BR>

repeating each hour

example config:

```
		{
			module: "MMM-Provider-JSON",
			config: {
				consumerids: ["arrivals",],
				initialdelay: 0, //wait 0 minutes before first data call
				datarefreshinterval:1000*60*60, //then repeat every 60 minutes
				id: 'FlightArrivalsLHR',
				package: 'FlightArrivals',
				urlparams: { apikey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxx', airportcode: 'LHR' },
			}
		},
		{
			module: "MMM-Provider-JSON",
			config: {
				consumerids: ["arrivals",],
				initialdelay: 1000 * 60 * 20, //wait 20 minutes before first data call
				datarefreshinterval: 1000 * 60 * 60, //then repeat every 60 minutes
				id: 'FlightArrivalsSTN',
				package: 'FlightArrivals',
				urlparams: { apikey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', airportcode: 'STN' },
			}
		},
		{
			module: "MMM-Provider-JSON",
			config: {
				consumerids: ["arrivals",],
				initialdelay: 1000 * 60 * 40, //wait 40 minutes before first data call
				datarefreshinterval: 1000 * 60 * 60, //then repeat every 60 minutes
				id: 'FlightArrivalsLGW',
				package: 'FlightArrivals',
				urlparams: { apikey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', airportcode: 'LGW' },
			}
		},
		{ module: "MMM-Consumer-Flights", position: "top_center", config: { id: "arrivals", icon: true } },
```

Extracting Metoffice weather details example:
```
		{
			module: "MMM-Provider-JSON",
				config: {
				consumerids: ["weatherConsumer",], //mandatory ID of the consumer receiving the data from the module
				id: 'metofficeAscot', //mandatory unique ID
				package: 'metofficeWeather', //name of the package that contains a standard set of config details
				urlparams: { appID: 'met office app id', locationID: '350153' }, //from https://www.metoffice.gov.uk/services/data/datapoint/uk-locations-site-list-detailed-documentation
				filename: 'metofficeweather.json', //the name of an output file containing the details sent to the consumer, for debug usage etc
				}
		},
```
https://www.metoffice.gov.uk/binaries/content/assets/metofficegovuk/pdf/data/datapoint_api_reference.pdf

Other parameters can be changed for each of the providers, for example an API or even the entire source of the data.
