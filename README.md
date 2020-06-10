# MMM-ChartProvider-Finance

This magic mirror module is a MMM-ChartProvider module that is part of the MMM-Chartxxx and MMM-Feedxxx interrelated modules.

For an overview of these modules see the README.md in https://github.com/TheBodger/MMM-ChartDisplay.

the -Finance module reads data from the yahoo finance feeds and formats it into one of more NDTF standard feeds to one or more MMM-ChartDisplay consumers.

### Example
![Example of MMM-ChartProvider-Finance output being displayed](images/screenshot.png?raw=true "Example screenshot")

### Dependencies

This module requires both MMM-FeedUtilities and MMM-ChartUtilies to be installed.

Before installing this module;
		use https://github.com/TheBodger/MMM-ChartUtilities to setup the MMM-Chart... dependencies and  install all modules.
		use https://github.com/TheBodger/MMM-FeedUtilities to setup the MMM-Feed... dependencies and  install all modules.

## Installation
To install the module, use your terminal to:
1. Navigate to your MagicMirror's modules folder. If you are using the default installation directory, use the command:<br />`cd ~/MagicMirror/modules`
2. Clone the module:<br />`git clone https://github.com/TheBodger/MMM-ChartProvider-Finance`

## Using the module

### MagicMirror² Configuration

To use this module, add the following minimum configuration block to the modules array in the `config/config.js` file:
```js
{
  consumerids:['consumerid of MMM-ChartDisplay'],
  id:'unique id of this module instance',
  financefeeds: [
    {
      setid: "unique setid of this data set",
      object: "string denoting the object(ive) of this data set",
      value: "key name in the input to be used as the actual value",
	  stocks:['stock name'], //an array of stock names
    }, 
  ]
}
```

### Configuration Options

| Option                  | Details
|------------------------ |--------------
| `text`                | *Optional* - <br><br> **Possible values:** Any string.<br> **Default value:** The Module name
| `consumerids`            | *Required* - a list of 1 or more consumer modules this module will provide for.<br><br> **Possible values:** An array of strings exactly matching the ID of one or more MMM-ChartDisplay modules <br> **Default value:** none
| `id`         | *Required* - The unique ID of this provider module<br><br> **Possible values:** any unique string<br> **Default value:** none
| `datarefreshinterval`            | *Optional* - milliseconds to pause before checking for new data in the feeds.<br><br> **Possible values:** a number in milliseconds <br> **Default value:** `6000*60` 
| `financefeeds`        | *Required* - An array of one or more feed definitions, see below for the financefeeds configuration options 
| `waitforqueuetime`            |*Ignore* -  Queue delay between ending one queue item and starting the next <br><br> **Possible values:** a number in milliseconds. <br> **Default value:** `10`
| `financefeed Format`            |
| `feedname`            |*Optional* -  Name of the feed for reference purposes<br><br> **Possible values:** Any unique string. <br> **Default value:** none
| `setid`            |*Required* - The unique identifier of this set of data produced by this definition. It will be used in the MMM-ChartDisplay configuration to uniquely identify this set.<br><br> **Possible values:** Any unique string. <br> **Default value:** none
| `rootkey`            |*Optional* - the JSON address of the base level of the data to use for extracting data<br><br> **Possible values:** Any string representing, in dot notation the JSON  that identifies the root level of data to extract. <br> **Default value:** 'chart.result'
| `oldestage`            |*Optional* -  Currently unused. <br><br> **Possible values:** 'today' or a number of minutes or a valid date(See [Moment.js formats](http://momentjs.com/docs/#/parsing/string-format/). <br> **Default value:** none
| `subject`            |*Optional* - 'stock' or the key name, including any parent levels up to but excluding the rootkey level that will be used to populate the subject field value.<br><br> **Possible values:** Any string of a dot notation JSON key address or 'stock'. <br> **Default value:** 'stock' - uses the stock name
| `object`            |*Required* - The value that will be used to populate the object field value. Expected to be one of indicators,quote,close,high,low,open,volume.<br><br> **Possible values:** Any string. <br> **Default value:** none
| `value`            |*Required* - The key name, either prefixed with @ to get one of the standard values or a keyname including any parent levels up to but excluding the rootkey level that will be used to populate the value field value.<br><br> **Possible values:** one of @close,@open,@high,@low,@volume,@timestamp,@adjclose or any string of a dot notation JSON key address. <br> **Default value:** the field name in the object field will be used to obtain a value
| `type`            |*Optional* - The format the value will be held in the output feed. if numeric, then the value will be validated as numeric and if it fails the item will be dropped<br><br> **Possible values:** 'string' or 'numeric'. <br> **Default value:** `'string'`
| `timestamp`            |*Optional* - The key name, including any parent levels up to but excluding the rootkey level that will be used to populate the timestamp field value or an offset from the runtime of the module as a number of seconds.<br><br> **Possible values:** Any string of a dot notation JSON key address or a numeric value of seconds offset (+-). <br> **Default value:** '@timestamp'
| `timestampformat`            |*Optional* - A moment compatible string indicating the format of the timestamp in the input JSON feed.<br><br> **Possible values:** Any valid moment string <br> **Default value:** none
| `filename`            |*Optional* - The filename, with path, where the output feed will be written in a JSON format<br><br> **Possible values:** Any valid filename and path string <br> **Default value:** none
| `stocks`            |*Required* - An array of one or more stock names or other identifiers compatible with yahoo finance<br><br> **Possible values:** Any valid identifier string <br> **Default value:** none
| `periodstart`            |*Optional* - A start date of a period to obtain stock information for<br><br> **Possible values:** Any valid string that a new Date can be created from <br> **Default value:** none
| `periodend`            |*Optional* - An end date of a period to obtain stock information for<br><br> **Possible values:** Any valid string that a new Date can be created from <br> **Default value:** none
| `periodrange`            |*Optional* - A predefined period range compatible with yahoo finance<br><br> **Possible values:** 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max <br> **Default value:** 'ytd'
| `interval`            |*Optional* - A predefined interval of time between information obtained compatible with yahoo finance. Values less than 1h are only valid within certain time periods<br><br> **Possible values:** 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo <br> **Default value:** '1d'
| `events`            |*Optional* - An event compatible with yahoo finance<br><br> **Possible values:** 'history'<br> **Default value:** 'history'

### Example configuration

this configuration produces stock information for 4 stocks. Note the use of dot notation for the value entry. This can be determined by investigating the JSON feed from yahoo finance.

```
		{
			module: "MMM-ChartProvider-Finance",
			config: {
				id: "mmcp1",
				consumerids: ["MMCD7",],
				datarefreshinterval: 1000 * 60 * 60 * 24, // set to match the interval value (if getting daily information only update daily)
				financefeeds: [
					{
						feedname: "tstocks",
						setid: "TJXStocks",
						subject: 'stock',
						object: 'close',
						value: 'indicators.quote.0.close', //dot address of the value field, relative to rootkey (defaults)
						type: "numeric",
						timestamp: 'timestamp',
						//stocks: [ '^FTSE'],
						stocks: ['tjx', 'msft', 'rost', '^DJI'],
						periodrange: '1y',
						interval: '1d',
					}
				]
			}
		},

```

### Additional Notes

This is a WIP; changes are being made all the time to improve the compatibility across the modules. Please refresh this and the MMM-feedUtilities and MMM-ChartUtilities modules with a `git pull` in the relevant modules folders.

The availability of the yahoo finance feeds can change sporadically or altogether.

The yahoo finance feed cannot currently be read by the MMM-ChartProvider-JSON module.

