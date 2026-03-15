# Authentication and Secrets

## Required environment variables

`tripit login` expects all of the following:

- `TRIPIT_CLIENT_ID`
- `TRIPIT_CLIENT_SECRET`
- `TRIPIT_USERNAME`
- `TRIPIT_PASSWORD`

If any variable is missing, stop and request the missing value instead of guessing.

## Secret handling

- Treat all four variables as secrets.
- Do not print secret values in terminal logs or chat output.
- Prefer secret managers (`fnox`, CI secret store, or shell profile) over committed files.

Example with `fnox`:

```bash
fnox set TRIPIT_CLIENT_ID "<value>" --provider age
fnox set TRIPIT_CLIENT_SECRET "<value>" --provider age
fnox set TRIPIT_USERNAME "<value>" --provider age
fnox set TRIPIT_PASSWORD "<value>" --provider age
```

## Token cache behavior

- Successful login stores a cached token at `~/.config/tripit/token.json`.
- If auth appears stale or broken, rerun `tripit login`.
