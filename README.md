# tripit-cli (and library) for JS

`tripit` works as both:

- a CLI (`tripit ...`)
- a JavaScript package (`import TripIt from "tripit"`)

## Install

Library:

```bash
npm install tripit
```

CLI:

```bash
npm install -g tripit
```

## CLI

Show available commands:

```bash
tripit --help
```

### Using through agent skills

- Either add `dvcrn/skills` or `dvcrn/tripit` as skill repository which should discover the `tripit` skill
- - You can also do a `npx skills add dvcrn/skills` or `npx skills add dvcrn/tripit`

### Common Workflow

1. Authenticate:

```bash
tripit login
```

2. Create a trip:

```bash
tripit trips create --name "Test Trip" --start 2026-03-20 --end 2026-03-23 --location "Tokyo" -o json
```

3. List and inspect the trip:

```bash
tripit trips list
tripit trips get <TRIP_UUID>
```

4. Add reservations/activities:

```bash
tripit hotels create --trip <TRIP_UUID> --name "Test Hotel" --checkin 2026-03-20 --checkout 2026-03-23 --checkin-time 15:00 --checkout-time 11:00 --timezone UTC --address "1 Market St" --city "San Francisco" --country US -o json

tripit flights create --trip <TRIP_UUID> --name "Test Flight" --airline "Example Air" --from "San Francisco" --from-code US --to "Seattle" --to-code US --airline-code EA --flight-num 123 --depart-date 2026-03-20 --depart-time 10:00 --depart-tz UTC --arrive-date 2026-03-20 --arrive-time 14:00 --arrive-tz UTC -o json

tripit transport create --trip <TRIP_UUID> --from "1 Market St" --to "SFO Airport" --depart-date 2026-03-20 --depart-time 08:00 --arrive-date 2026-03-20 --arrive-time 09:00 --timezone UTC --name "Hotel to Airport" -o json

tripit activities create --trip <TRIP_UUID> --name "Dinner" --start-date 2026-03-20 --start-time 19:00 --end-date 2026-03-20 --end-time 21:00 --timezone UTC --address "200 Example St" --location-name "Downtown" -o json
```

5. Update resources:

```bash
tripit trips update <TRIP_UUID> --name "Updated Test Trip"
tripit hotels update <HOTEL_UUID> --name "Updated Hotel"
tripit flights update <FLIGHT_UUID> --name "Updated Flight"
tripit transport update <TRANSPORT_UUID> --name "Updated Transport"
tripit activities update <ACTIVITY_UUID> --name "Updated Activity"
```

6. Attach and remove documents (images/PDFs):

```bash
tripit documents attach <HOTEL_UUID> --file ./confirmation.pdf --caption "Booking Confirmation"
tripit documents attach <HOTEL_UUID> --file ./photo.png --type lodging
tripit documents remove <HOTEL_UUID> --caption "Booking Confirmation"
tripit documents remove <HOTEL_UUID> --index 1
tripit documents remove <HOTEL_UUID> --all
```

The `--type` flag (lodging, activity, air, transport) is auto-detected from the UUID when omitted.

7. Delete resources:

```bash
tripit activities delete <ACTIVITY_UUID>
tripit transport delete <TRANSPORT_UUID>
tripit flights delete <FLIGHT_UUID>
tripit hotels delete <HOTEL_UUID>
tripit trips delete <TRIP_UUID>
```

## Library Usage

```ts
import TripIt from "tripit";

const client = new TripIt({
  clientId: process.env.TRIPIT_CLIENT_ID!,
  clientSecret: process.env.TRIPIT_CLIENT_SECRET!,
  username: process.env.TRIPIT_USERNAME!,
  password: process.env.TRIPIT_PASSWORD!,
});

await client.authenticate();

const list = await client.listTrips(20, 1, false);
console.log(list.Trip);

const created = await client.createTrip({
  displayName: "SDK Trip Example",
  startDate: "2026-04-01",
  endDate: "2026-04-04",
  primaryLocation: "New York",
});

console.log(created.Trip.uuid);
```

The package also exports types from `src/types.ts`.
