# AI Test Harness Examples

Use these examples when you need end-to-end validation with the local CLI entrypoint.

## Global CLI Lifecycle Examples

Use these when validating the installed `tripit` binary:

```bash
# Create trip
tripit trips create --name "CLI Lifecycle Trip" --start 2026-06-01 --end 2026-06-05 --location "Berlin" -o json

# Hotel add/delete
tripit hotels create --trip <TRIP_UUID> --name "Lifecycle Hotel" --checkin 2026-06-01 --checkout 2026-06-05 --checkin-time 15:00 --checkout-time 11:00 --timezone UTC --address "10 Example Str" --city "Berlin" --country DE -o json
tripit hotels delete <HOTEL_UUID>

# Flight add/delete
tripit flights create --trip <TRIP_UUID> --name "Lifecycle Flight" --airline "Example Air" --from "New York" --from-code US --to "Berlin" --to-code DE --airline-code EA --flight-num 789 --depart-date 2026-06-01 --depart-time 09:00 --depart-tz UTC --arrive-date 2026-06-01 --arrive-time 19:00 --arrive-tz UTC -o json
tripit flights delete <FLIGHT_UUID>

# Activity add/delete
tripit activities create --trip <TRIP_UUID> --name "Museum Visit" --start-date 2026-06-02 --start-time 14:00 --end-date 2026-06-02 --end-time 16:00 --timezone UTC --address "50 Museum Rd" --location-name "City Museum" -o json
tripit activities delete <ACTIVITY_UUID>
```

## Baseline Checks

```bash
fnox run -- bun index.ts --help
fnox run -- bun index.ts trips list
```

## Trip Lifecycle

```bash
fnox run -- bun index.ts trips create --name "<TRIP_NAME>" --start <YYYY-MM-DD> --end <YYYY-MM-DD> --location "<LOCATION>" -o json
fnox run -- bun index.ts trips get <TRIP_UUID>
fnox run -- bun index.ts trips update <TRIP_UUID> --name "<UPDATED_TRIP_NAME>"
```

## Child Resource Lifecycle

```bash
fnox run -- bun index.ts hotels create --trip <TRIP_UUID> --name "<HOTEL_NAME>" --checkin <YYYY-MM-DD> --checkout <YYYY-MM-DD> --checkin-time <HH:MM> --checkout-time <HH:MM> --timezone <TZ> --address "<ADDRESS>" --city "<CITY>" --country <COUNTRY_CODE> -o json
fnox run -- bun index.ts flights create --trip <TRIP_UUID> --name "<FLIGHT_NAME>" --airline "<AIRLINE>" --from "<FROM_CITY>" --from-code <FROM_COUNTRY_CODE> --to "<TO_CITY>" --to-code <TO_COUNTRY_CODE> --airline-code <AIRLINE_CODE> --flight-num <FLIGHT_NUMBER> --depart-date <YYYY-MM-DD> --depart-time <HH:MM> --depart-tz <TZ> --arrive-date <YYYY-MM-DD> --arrive-time <HH:MM> --arrive-tz <TZ> -o json
fnox run -- bun index.ts transport create --trip <TRIP_UUID> --from "<FROM_ADDRESS>" --to "<TO_ADDRESS>" --depart-date <YYYY-MM-DD> --depart-time <HH:MM> --arrive-date <YYYY-MM-DD> --arrive-time <HH:MM> --timezone <TZ> --name "<TRANSPORT_NAME>" -o json
fnox run -- bun index.ts activities create --trip <TRIP_UUID> --name "<ACTIVITY_NAME>" --start-date <YYYY-MM-DD> --start-time <HH:MM> --end-date <YYYY-MM-DD> --end-time <HH:MM> --timezone <TZ> --address "<ADDRESS>" --location-name "<LOCATION_NAME>" -o json
```

## Cleanup

```bash
fnox run -- bun index.ts activities delete <ACTIVITY_UUID>
fnox run -- bun index.ts transport delete <TRANSPORT_UUID>
fnox run -- bun index.ts flights delete <FLIGHT_UUID>
fnox run -- bun index.ts hotels delete <HOTEL_UUID>
fnox run -- bun index.ts trips delete <TRIP_UUID>
```
