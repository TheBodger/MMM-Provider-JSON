Details of the Aviationastack API can be found at: https://aviationstack.com/documentation

to call the API to get departure details for a specific airport, the url should look like this:

http://api.aviationstack.com/v1/flights?access_key=yourapikeyhere&dep_iata=BOS

the returned data (a single data element is included here) looks like this.

```
{
    "pagination": {
    "limit": 100,
    "offset": 0,
    "count": 100,
    "total": 758
    },
    "data": [
        {
            "flight_date": "2020-06-10",
            "flight_status": "scheduled",
            "departure": {
                "airport": "Logan International",
                "timezone": "America\/New_York",
                "iata": "BOS",
                "icao": "KBOS",
                "terminal": "B",
                "gate": null,
                "delay": null,
                "scheduled": "2020-06-10T11:00:00+00:00",
                "estimated": "2020-06-10T11:00:00+00:00",
                "actual": null,
                "estimated_runway": null,
                "actual_runway": null
            },
            "arrival": {
                "airport": "Philadelphia International",
                "timezone": "America\/New_York",
                "iata": "PHL",
                "icao": "KPHL",
                "terminal": "B",
                "gate": "B3",
                "baggage": "D",
                "delay": null,
                "scheduled": "2020-06-10T12:32:00+00:00",
                "estimated": "2020-06-10T12:32:00+00:00",
                "actual": null,
                "estimated_runway": null,
                "actual_runway": null
            },
            "airline": {
                "name": "Republic Airways",
                "iata": "YX",
                "icao": "RPA"
            },
            "flight": {
                "number": "4706",
                "iata": "YX4706",
                "icao": "RPA4706",
                "codeshared": null
            },
            "aircraft": null,
            "live": null
        },
       ]
```

