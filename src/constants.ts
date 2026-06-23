import os from "node:os";
import path from "node:path";

export const CACHE_DIR = path.join(os.homedir(), ".config", "tripit");
export const TOKEN_CACHE_FILE = path.join(CACHE_DIR, "token.json");

export const BASE_URL = "https://www.tripit.com";
export const API_BASE_URL = "https://api.tripit.com";
export const REDIRECT_URI = "com.tripit://completeAuthorize";
export const SCOPES = "offline_access email";

// TripIt mobile app client ID (public, extracted from iOS/Android app)
export const DEFAULT_CLIENT_ID = "e400234a-f684-11e7-9d05-9cb654932688";

/**
 * Headers for the initial navigation GET request.
 * Sec-Fetch-Site is "none" because this simulates a user typing a URL
 * directly (not following a cross-site link).
 */
export const NAVIGATION_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.5",
	"Accept-Encoding": "gzip, deflate, br, zstd",
	DNT: "1",
	Connection: "keep-alive",
	"Upgrade-Insecure-Requests": "1",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "none",
	"Sec-Fetch-User": "?1",
	Priority: "u=0, i",
};

/**
 * Headers for the login form POST request.
 * Sec-Fetch-Site is "same-origin" because we're posting back to the
 * same site that served the form.
 */
export const FORM_POST_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,en;q=0.5",
	"Accept-Encoding": "gzip, deflate, br, zstd",
	DNT: "1",
	Connection: "keep-alive",
	"Upgrade-Insecure-Requests": "1",
	"Content-Type": "application/x-www-form-urlencoded",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "same-origin",
	"Sec-Fetch-User": "?1",
	Priority: "u=0, i",
};

/**
 * @deprecated Use NAVIGATION_HEADERS or FORM_POST_HEADERS instead.
 * Kept for backward compatibility.
 */
export const BROWSER_HEADERS = NAVIGATION_HEADERS;

/** Maximum number of retry attempts for transient auth failures (e.g. 403). */
export const AUTH_MAX_RETRIES = 3;

/** Base delay in milliseconds between auth retries (doubled each attempt). */
export const AUTH_RETRY_BASE_DELAY_MS = 1000;

export const TRIP_UPDATE_FIELD_ORDER = [
	"primary_location",
	"TripPurposes",
	"is_private",
	"start_date",
	"display_name",
	"is_expensible",
	"end_date",
	"description",
] as const;

export const LODGING_FIELD_ORDER = [
	"uuid",
	"trip_id",
	"trip_uuid",
	"is_client_traveler",
	"display_name",
	"Image",
	"booking_rate",
	"supplier_conf_num",
	"supplier_name",
	"is_purchased",
	"notes",
	"total_cost",
	"StartDateTime",
	"EndDateTime",
	"Address",
] as const;

export const AIR_FIELD_ORDER = [
	"uuid",
	"trip_id",
	"trip_uuid",
	"is_client_traveler",
	"display_name",
	"Image",
	"supplier_conf_num",
	"supplier_name",
	"is_purchased",
	"notes",
	"total_cost",
	"Segment",
] as const;

export const AIR_SEGMENT_FIELD_ORDER = [
	"uuid",
	"StartDateTime",
	"EndDateTime",
	"start_city_name",
	"start_country_code",
	"end_city_name",
	"end_country_code",
	"marketing_airline",
	"marketing_flight_number",
	"aircraft",
	"service_class",
] as const;

export const TRANSPORT_FIELD_ORDER = [
	"uuid",
	"trip_id",
	"trip_uuid",
	"is_client_traveler",
	"display_name",
	"Image",
	"is_purchased",
	"is_tripit_booking",
	"has_possible_cancellation",
	"Segment",
] as const;

export const TRANSPORT_SEGMENT_FIELD_ORDER = [
	"uuid",
	"StartLocationAddress",
	"StartDateTime",
	"EndLocationAddress",
	"EndDateTime",
	"vehicle_description",
	"start_location_name",
	"end_location_name",
	"confirmation_num",
	"carrier_name",
] as const;

export const ACTIVITY_FIELD_ORDER = [
	"uuid",
	"trip_id",
	"trip_uuid",
	"is_client_traveler",
	"display_name",
	"Image",
	"is_purchased",
	"notes",
	"StartDateTime",
	"EndDateTime",
	"Address",
	"location_name",
] as const;

export const IMAGE_FIELD_ORDER = [
	"caption",
	"segment_uuid",
	"ImageData",
] as const;

export const ADDRESS_FIELD_ORDER = [
	"address",
	"city",
	"state",
	"zip",
	"country",
] as const;
