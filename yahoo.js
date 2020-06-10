
var request = require('request');



var burl = 'https://query1.finance.yahoo.com/v7/finance/download/TJX?period1=1556992451&period2=1588614851&interval=1d&events=history';


var baseurl7 = 'https://query1.finance.yahoo.com/v7/finance/download/';
var baseurl8 = 'https://query1.finance.yahoo.com/v8/finance/chart/';

var stock = "TJX";
var defaultelapsed = '1 year';
var startperiod = Math.floor(new Date("2019-05-04T17:54:11.000Z").getTime() / 1000);
var endperiod = Math.floor(new Date().getTime() / 1000);

startperiod = endperiod - (20 * 24 * 60 * 60);

// 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
// 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo

var range = '1y';

var interval = '5d'; //1 day

var events = 'history';

var url = `${baseurl7}${stock}?period1=${startperiod}&period2=${endperiod}&interval=${interval}&events=${events}`;

console.info("1",url);

request({ url: url, method: 'GET' }, function (error, response, body) {

	console.info("1",response.statusCode,error);

	if (!error && response.statusCode == 200) {

		console.info("1",body);

	}

	stock = "TJX%20MSFT"
	range = '1d';
	interval = '30m';
	var url = `${baseurl8}${stock}?range=${range}&interval=${interval}&events=${events}`;

	console.info("2",url);

	request({ url: url, method: 'GET' }, function (error, response, body) {

		console.info("2",response.statusCode, error);

		if (!error && response.statusCode == 200) {

			console.info("2",body);

		}

	})



})


