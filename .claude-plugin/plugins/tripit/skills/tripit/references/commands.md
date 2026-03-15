# TripIt CLI Command Cookbook

## Setup and validation

```bash
tripit --help
tripit login
```

## Trip lifecycle

```bash
tripit trips create --name "Test Trip" --start 2026-03-20 --end 2026-03-23 --location "Tokyo" -o json
tripit trips list -o json
tripit trips get <TRIP_UUID> -o json
tripit trips update <TRIP_UUID> --name "Updated Test Trip" -o json
tripit trips delete <TRIP_UUID> -o json
```

## Child object lifecycle

```bash
tripit hotels create --trip <TRIP_UUID> --name "Test Hotel" --checkin 2026-03-20 --checkout 2026-03-23 --checkin-time 15:00 --checkout-time 11:00 --timezone UTC --address "1 Market St" --city "San Francisco" --country US -o json
tripit hotels update <HOTEL_UUID> --name "Updated Hotel" -o json
tripit hotels delete <HOTEL_UUID> -o json

tripit flights create --trip <TRIP_UUID> --name "Test Flight" --airline "Example Air" --from "San Francisco" --from-code US --to "Seattle" --to-code US --airline-code EA --flight-num 123 --depart-date 2026-03-20 --depart-time 10:00 --depart-tz UTC --arrive-date 2026-03-20 --arrive-time 14:00 --arrive-tz UTC -o json
tripit flights update <FLIGHT_UUID> --name "Updated Flight" -o json
tripit flights delete <FLIGHT_UUID> -o json

tripit transport create --trip <TRIP_UUID> --from "1 Market St" --to "SFO Airport" --depart-date 2026-03-20 --depart-time 08:00 --arrive-date 2026-03-20 --arrive-time 09:00 --timezone UTC --name "Hotel to Airport" -o json
tripit transport update <TRANSPORT_UUID> --name "Updated Transport" -o json
tripit transport delete <TRANSPORT_UUID> -o json

tripit activities create --trip <TRIP_UUID> --name "Dinner" --start-date 2026-03-20 --start-time 19:00 --end-date 2026-03-20 --end-time 21:00 --timezone UTC --address "200 Example St" --location-name "Downtown" -o json
tripit activities update <ACTIVITY_UUID> --name "Updated Activity" -o json
tripit activities delete <ACTIVITY_UUID> -o json
```

## Document attachments

```bash
tripit documents attach <HOTEL_UUID> --file ./confirmation.pdf --caption "Booking Confirmation" -o json
tripit documents attach <HOTEL_UUID> --file ./photo.png --type lodging -o json
tripit documents remove <HOTEL_UUID> --caption "Booking Confirmation" -o json
tripit documents remove <HOTEL_UUID> --index 1 -o json
tripit documents remove <HOTEL_UUID> --all -o json
```

## Local repo execution (without global install)

```bash
fnox run -- bun index.ts --help
fnox run -- bun index.ts trips list -o json
```
