# AI Test Harness

Validate the CLI in `index.ts` using a full end-to-end flow.

## Scope

Run this first:

```sh
fnox run -- bun index.ts --help
```

Then execute the following sequence:

1. Create a test trip.
2. Run the trip list command and confirm it works.
3. Add a hotel, transport, activity, and flight to the trip.
4. Run `trips list` and `trips get` and confirm those items are included.
5. Run update commands for each child item (hotel, transport, activity, flight).
6. Check again whether those child items were updated successfully.
7. Try to update the trip itself and check whether it was updated.
8. Delete hotel, transport, activity, flight, etc., and verify they were removed from the trip.

## Command Templates

Use these command shapes (fill in values and UUIDs from your run):

```sh
# Trip
fnox run -- bun index.ts trips create --name "<TRIP_NAME>" --start <YYYY-MM-DD> --end <YYYY-MM-DD> --location "<LOCATION>" -o json
fnox run -- bun index.ts trips list
fnox run -- bun index.ts trips get <TRIP_UUID>
fnox run -- bun index.ts trips update <TRIP_UUID> --name "<UPDATED_TRIP_NAME>"

# Hotel
fnox run -- bun index.ts hotels create --trip <TRIP_UUID> --name "<HOTEL_NAME>" --checkin <YYYY-MM-DD> --checkout <YYYY-MM-DD> --checkin-time <HH:MM> --checkout-time <HH:MM> --timezone <TZ> --address "<ADDRESS>" --city "<CITY>" --country <COUNTRY_CODE> -o json
fnox run -- bun index.ts hotels get <HOTEL_UUID>
fnox run -- bun index.ts hotels update <HOTEL_UUID> --name "<UPDATED_HOTEL_NAME>"
fnox run -- bun index.ts hotels delete <HOTEL_UUID>

# Flight
fnox run -- bun index.ts flights create --trip <TRIP_UUID> --name "<FLIGHT_NAME>" --airline "<AIRLINE>" --from "<FROM_CITY>" --from-code <FROM_COUNTRY_CODE> --to "<TO_CITY>" --to-code <TO_COUNTRY_CODE> --airline-code <AIRLINE_CODE> --flight-num <FLIGHT_NUMBER> --depart-date <YYYY-MM-DD> --depart-time <HH:MM> --depart-tz <TZ> --arrive-date <YYYY-MM-DD> --arrive-time <HH:MM> --arrive-tz <TZ> -o json
fnox run -- bun index.ts flights get <FLIGHT_UUID>
fnox run -- bun index.ts flights update <FLIGHT_UUID> --name "<UPDATED_FLIGHT_NAME>"
fnox run -- bun index.ts flights delete <FLIGHT_UUID>

# Transport
fnox run -- bun index.ts transport create --trip <TRIP_UUID> --from "<FROM_ADDRESS>" --to "<TO_ADDRESS>" --depart-date <YYYY-MM-DD> --depart-time <HH:MM> --arrive-date <YYYY-MM-DD> --arrive-time <HH:MM> --timezone <TZ> --name "<TRANSPORT_NAME>" -o json
fnox run -- bun index.ts transport get <TRANSPORT_UUID>
fnox run -- bun index.ts transport update <TRANSPORT_UUID> --name "<UPDATED_TRANSPORT_NAME>"
fnox run -- bun index.ts transport delete <TRANSPORT_UUID>

# Activity
fnox run -- bun index.ts activities create --trip <TRIP_UUID> --name "<ACTIVITY_NAME>" --start-date <YYYY-MM-DD> --start-time <HH:MM> --end-date <YYYY-MM-DD> --end-time <HH:MM> --timezone <TZ> --address "<ADDRESS>" --location-name "<LOCATION_NAME>" -o json
fnox run -- bun index.ts activities get <ACTIVITY_UUID>
fnox run -- bun index.ts activities update <ACTIVITY_UUID> --name "<UPDATED_ACTIVITY_NAME>"
fnox run -- bun index.ts activities delete <ACTIVITY_UUID>
```


## Discover all commands

Check `index.ts --help` and use `--help` on each subcommand to see if there are additional commands that are not covered by this harness. Points them out and suggest adding them to the test harness.

