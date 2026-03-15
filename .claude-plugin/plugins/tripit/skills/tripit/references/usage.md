# Usage Workflows and Failure Handling

## Recommended workflow

1. Verify command availability: `tripit --help`
2. Authenticate: `tripit login`
3. Create or locate a trip: `tripit trips create ...` or `tripit trips list`
4. Add child items (hotel, flight, transport, activity)
5. Confirm with `tripit trips get <TRIP_UUID>`
6. Apply updates with resource-specific `update` commands
7. Clean up with resource-specific `delete` commands

## Command selection by task

- Parent itinerary: `tripit trips ...`
- Lodging: `tripit hotels ...`
- Air travel: `tripit flights ...`
- Ground transport: `tripit transport ...`
- Activities/events: `tripit activities ...`
- Attachments/removals: `tripit documents ...`

## Common errors and fixes

- `Missing required env var`: set the missing `TRIPIT_*` variable before retrying.
- `Login failed (403)` or auth errors: verify credentials and client config.
- `API error (4xx/5xx)`: inspect returned response body and retry with corrected inputs.
- `Could not find object with identifier`: confirm object type and UUID/id first with list/get commands.
- `File not found` during attach: fix local path and rerun attach.

## Output guidance

- Use `-o json` for reliable parsing and automation.
- Use text output for quick operator summaries during manual checks.
