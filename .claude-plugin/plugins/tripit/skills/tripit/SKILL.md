---
name: tripit
description: Use the TripIt CLI (`tripit`) to authenticate and manage trips, hotels, flights, transport, activities, and document attachments.
---

# TripIt CLI Skill

Use this skill when a user asks to operate TripIt data through the `tripit` CLI.
This skill is for using the installed product, not reimplementing it.

## When to use

- User asks to log in to TripIt from terminal workflows
- User asks to create, list, inspect, update, or delete trips
- User asks to manage hotel, flight, transport, or activity objects
- User asks to attach or remove documents for itinerary objects

## Prerequisites

- `tripit` must be installed and available on `PATH`:
  - `npm install -g tripit`
- For local development in this repo, prefer:
  - `fnox run -- bun index.ts <command>`
- Verify command availability before task execution:
  - `tripit --help`

## Authentication expectations

- `tripit login` requires these environment variables:
  - `TRIPIT_CLIENT_ID`
  - `TRIPIT_CLIENT_SECRET`
  - `TRIPIT_USERNAME`
  - `TRIPIT_PASSWORD`
- Authentication caches an access token at:
  - `~/.config/tripit/token.json`
- If secrets are missing, request them explicitly and do not invent values.

## Command selection guidance

- Use `trips` for parent trip objects.
- Use `hotels`, `flights`, `transport`, and `activities` for child itinerary objects.
- Use `documents` for attachment workflows.
- Prefer `-o json` for machine-readable output when chaining commands.

## Failure guidance

- Missing env vars: stop and ask for required credentials.
- `403` or login failures: verify account credentials and client credentials.
- API errors: re-run with the same command and inspect returned status/body.
- UUID/id mismatches: use list/get commands first, then retry with exact IDs.
- Missing file on document attach: verify local path before retrying.

## References

- `references/commands.md`
- `references/auth.md`
- `references/usage.md`
