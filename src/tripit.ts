import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as cheerio from "cheerio";
import fetchCookie from "fetch-cookie";
import fetch from "node-fetch";
import { CookieJar } from "tough-cookie";

interface CachedToken {
	access_token: string;
	expires_in: number;
	token_type: string;
	scope: string;
	expiresAt: number;
}

interface TripItConfig {
	clientId: string;
	clientSecret: string;
	username: string;
	password: string;
}

const CACHE_DIR = path.join(os.homedir(), ".config", "tripit");
const TOKEN_CACHE_FILE = path.join(CACHE_DIR, "token.json");

const BASE_URL = "https://www.tripit.com";
const API_BASE_URL = "https://api.tripit.com";
const REDIRECT_URI = "com.tripit://completeAuthorize";
const SCOPES = "offline_access email";

const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:142.0) Gecko/20100101 Firefox/142.0",
	Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
	"Accept-Language": "en-US,ja;q=0.7,en;q=0.3",
	"Accept-Encoding": "gzip, deflate, br, zstd",
	DNT: "1",
	"Sec-GPC": "1",
	Connection: "keep-alive",
	"Upgrade-Insecure-Requests": "1",
	"Sec-Fetch-Dest": "document",
	"Sec-Fetch-Mode": "navigate",
	"Sec-Fetch-Site": "cross-site",
	Priority: "u=0, i",
	Pragma: "no-cache",
	"Cache-Control": "no-cache",
};

function normalizeTime(time: string): string | undefined {
	if (!time) return undefined;
	const parts = time.split(":");
	if (parts.length === 2) return `${time}:00`;
	return time;
}

function clean(obj: any): any {
	if (typeof obj !== "object" || obj === null) return obj;
	if (Array.isArray(obj))
		return obj.map(clean).filter((v) => v !== undefined && v !== null);
	return Object.entries(obj).reduce<Record<string, any>>((acc, [k, v]) => {
		if (v !== undefined && v !== null) acc[k] = clean(v);
		return acc;
	}, {});
}

function normalizeArray(node: any): any[] {
	if (!node) return [];
	if (Array.isArray(node)) return node;
	return [node];
}

function orderObjectByKeys<T extends object>(
	obj: T,
	orderArray: readonly string[],
): T {
	return orderArray.reduce<T>((ordered, key) => {
		if (key in obj) {
			ordered[key as keyof T] = obj[key as keyof T];
		}
		return ordered;
	}, {} as T);
}

function toBoolean(value: unknown): boolean | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value === "boolean") return value;
	if (typeof value === "string") return value === "true";
	return Boolean(value);
}

const TRIP_UPDATE_FIELD_ORDER = [
	"primary_location",
	"TripPurposes",
	"is_private",
	"start_date",
	"display_name",
	"is_expensible",
	"end_date",
	"description",
] as const;

const LODGING_FIELD_ORDER = [
	"uuid",
	"trip_uuid",
	"trip_id",
	"is_client_traveler",
	"display_name",
	"supplier_name",
	"supplier_conf_num",
	"booking_rate",
	"is_purchased",
	"notes",
	"total_cost",
	"StartDateTime",
	"EndDateTime",
	"Address",
] as const;

const AIR_FIELD_ORDER = [
	"uuid",
	"trip_uuid",
	"trip_id",
	"is_client_traveler",
	"display_name",
	"supplier_name",
	"supplier_conf_num",
	"is_purchased",
	"notes",
	"total_cost",
	"Segment",
] as const;

const AIR_SEGMENT_FIELD_ORDER = [
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

const TRANSPORT_FIELD_ORDER = [
	"uuid",
	"trip_uuid",
	"trip_id",
	"is_client_traveler",
	"display_name",
	"is_purchased",
	"is_tripit_booking",
	"has_possible_cancellation",
	"Segment",
] as const;

const TRANSPORT_SEGMENT_FIELD_ORDER = [
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

const ACTIVITY_FIELD_ORDER = [
	"uuid",
	"trip_uuid",
	"trip_id",
	"is_client_traveler",
	"display_name",
	"is_purchased",
	"notes",
	"StartDateTime",
	"EndDateTime",
	"Address",
	"location_name",
] as const;

const ADDRESS_FIELD_ORDER = [
	"address",
	"city",
	"state",
	"zip",
	"country",
] as const;

export class TripIt {
	private config: TripItConfig;
	private accessToken: string | null = null;

	constructor(config: TripItConfig) {
		this.config = config;
	}

	async authenticate(): Promise<string> {
		const cached = this.loadCachedToken();
		if (cached && cached.expiresAt > Date.now()) {
			this.accessToken = cached.access_token;
			return this.accessToken;
		}

		const fetchWithCookie = fetchCookie(fetch, new CookieJar());

		// Establish session
		await fetchWithCookie(`${BASE_URL}/home`, { headers: BROWSER_HEADERS });

		// PKCE setup
		const codeVerifier = crypto.randomBytes(32).toString("hex");
		const codeChallenge = crypto
			.createHash("sha256")
			.update(codeVerifier)
			.digest()
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
		const state = crypto.randomBytes(16).toString("hex");

		const authUrl =
			`${BASE_URL}/auth/oauth2/authorize?` +
			`client_id=${encodeURIComponent(this.config.clientId)}` +
			`&response_type=code` +
			`&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
			`&scope=${encodeURIComponent(SCOPES)}` +
			`&state=${encodeURIComponent(state)}` +
			`&code_challenge=${encodeURIComponent(codeChallenge)}` +
			`&code_challenge_method=S256` +
			`&response_mode=query` +
			`&action=sign_in`;

		// Follow redirects to login form
		const { html, formAction } = await this.followRedirects(
			fetchWithCookie,
			authUrl,
		);

		// Submit login form
		const redirectUrl = await this.submitLogin(
			fetchWithCookie,
			html,
			formAction,
		);

		// Validate state and extract code
		const parsedUrl = new URL(redirectUrl, "http://localhost");
		const returnedState = parsedUrl.searchParams.get("state");
		if (returnedState !== state) {
			throw new Error("OAuth state mismatch");
		}

		const code = parsedUrl.searchParams.get("code");
		if (!code) {
			throw new Error("Authorization code not found in redirect");
		}

		// Exchange code for token
		const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
		if (!tokenResponse.access_token) {
			throw new Error("No access_token in response");
		}

		this.accessToken = tokenResponse.access_token;
		this.cacheToken(tokenResponse);

		return this.accessToken as string;
	}

	getAccessToken(): string {
		if (!this.accessToken) {
			throw new Error("Not authenticated. Call authenticate() first.");
		}
		return this.accessToken;
	}

	// === API Helper ===

	private endpoint(version: "v1" | "v2", path: string): string {
		return `https://api.tripit.com/${version}/${path}/format/json`;
	}

	private identifierEndpoint(
		action: string,
		resource: string,
		id: string,
	): string {
		const isUuid = id.includes("-");
		return isUuid
			? this.endpoint("v2", `${action}/${resource}/uuid/${id}`)
			: this.endpoint("v1", `${action}/${resource}/id/${id}`);
	}

	private async apiGet(path: string): Promise<any> {
		const token = this.getAccessToken();
		const res = await fetch(path, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const text = await res.text();
		if (!res.ok) throw new Error(`API error (${res.status}): ${text}`);
		return JSON.parse(text);
	}

	private async apiPost(
		path: string,
		payload: Record<string, any>,
	): Promise<any> {
		const token = this.getAccessToken();
		const res = await fetch(path, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({ json: JSON.stringify(payload) }).toString(),
		});
		const text = await res.text();
		if (!res.ok) throw new Error(`API error (${res.status}): ${text}`);
		return JSON.parse(text);
	}

	// === Trips ===

	async listTrips(pageSize = 100, pageNum = 1, past = false): Promise<any> {
		const past_ = past ? "&past=true" : "";
		const url = `https://api.tripit.com/v2/list/trip?format=json&page_size=${pageSize}&page_num=${pageNum}${past_}`;
		return this.apiGet(url);
	}

	async getTrip(id: string): Promise<any> {
		const url = this.identifierEndpoint("get", "trip", id).replace(
			"/format/json",
			"/include_objects/true/format/json",
		);
		const data = await this.apiGet(url);
		if (data.Profile) delete data.Profile;
		return data;
	}

	async createTrip(params: {
		displayName: string;
		startDate: string;
		endDate: string;
		primaryLocation?: string;
	}): Promise<any> {
		return this.apiPost(this.endpoint("v2", "create/trip"), {
			Trip: clean({
				display_name: params.displayName,
				start_date: params.startDate,
				end_date: params.endDate,
				primary_location: params.primaryLocation,
			}),
		});
	}

	async updateTrip(params: {
		id?: string;
		uuid?: string;
		displayName?: string;
		startDate?: string;
		endDate?: string;
		primaryLocation?: string;
		description?: string;
		isPrivate?: boolean;
		isExpensible?: boolean;
		tripPurpose?: string;
	}): Promise<any> {
		const identifier = params.uuid || params.id;
		if (!identifier) {
			throw new Error("Either uuid or id parameter is required");
		}

		const existingTripResponse = await this.apiGet(
			this.identifierEndpoint("get", "trip", identifier),
		);
		const existingTrip = existingTripResponse.Trip;
		if (!existingTrip?.uuid) {
			throw new Error(`Trip with identifier ${identifier} not found`);
		}

		const tripData: any = {
			primary_location: params.primaryLocation ?? existingTrip.primary_location,
			is_private:
				params.isPrivate !== undefined
					? params.isPrivate
					: toBoolean(existingTrip.is_private),
			start_date: params.startDate ?? existingTrip.start_date,
			display_name: params.displayName ?? existingTrip.display_name,
			is_expensible:
				params.isExpensible !== undefined
					? params.isExpensible
					: toBoolean(existingTrip.is_expensible),
			end_date: params.endDate ?? existingTrip.end_date,
		};

		const purposeTypeCode =
			params.tripPurpose ?? existingTrip.TripPurposes?.purpose_type_code;
		if (purposeTypeCode) {
			tripData.TripPurposes = { purpose_type_code: purposeTypeCode };
		}

		const description = params.description ?? existingTrip.description;
		if (description) {
			tripData.description = description;
		}

		const orderedTripData = orderObjectByKeys(
			clean(tripData),
			TRIP_UPDATE_FIELD_ORDER,
		);

		return this.apiPost(
			this.endpoint("v2", `replace/trip/uuid/${existingTrip.uuid}`),
			{
				Trip: orderedTripData,
			},
		);
	}

	async deleteTrip(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("delete", "trip", id));
	}

	// === Hotels (Lodging) ===

	async getHotel(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("get", "lodging", id));
	}

	async deleteHotel(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("delete", "lodging", id));
	}

	async createHotel(params: {
		tripId: string;
		hotelName: string;
		checkInDate: string;
		checkInTime: string;
		checkOutDate: string;
		checkOutTime: string;
		timezone: string;
		street: string;
		city: string;
		country: string;
		state?: string;
		zip?: string;
		supplierConfNum?: string;
		bookingRate?: string;
		notes?: string;
		totalCost?: string;
	}): Promise<any> {
		const tripKey = params.tripId.includes("-") ? "trip_uuid" : "trip_id";
		return this.apiPost(this.endpoint("v2", "create/lodging"), {
			LodgingObject: clean({
				[tripKey]: params.tripId,
				supplier_name: params.hotelName,
				supplier_conf_num: params.supplierConfNum,
				booking_rate: params.bookingRate,
				notes: params.notes,
				total_cost: params.totalCost,
				StartDateTime: {
					date: params.checkInDate,
					time: normalizeTime(params.checkInTime),
					timezone: params.timezone,
				},
				EndDateTime: {
					date: params.checkOutDate,
					time: normalizeTime(params.checkOutTime),
					timezone: params.timezone,
				},
				Address: clean({
					address: params.street,
					city: params.city,
					state: params.state,
					zip: params.zip,
					country: params.country,
				}),
			}),
		});
	}

	async updateHotel(params: {
		id?: string;
		uuid?: string;
		tripId?: string;
		hotelName?: string;
		checkInDate?: string;
		checkInTime?: string;
		checkOutDate?: string;
		checkOutTime?: string;
		timezone?: string;
		street?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
		supplierConfNum?: string;
		bookingRate?: string;
		notes?: string;
		totalCost?: string;
	}): Promise<any> {
		const identifier = params.uuid || params.id;
		if (!identifier) {
			throw new Error("Either uuid or id parameter is required");
		}

		const existingHotelResponse = await this.getHotel(identifier);
		const existingHotel = existingHotelResponse.LodgingObject;
		if (!existingHotel?.uuid) {
			throw new Error(`Hotel with identifier ${identifier} not found`);
		}

		const tripId =
			params.tripId || existingHotel.trip_uuid || existingHotel.trip_id;
		const tripKey = tripId
			? tripId.includes("-")
				? "trip_uuid"
				: "trip_id"
			: undefined;

		const startTimezone =
			params.timezone ||
			existingHotel.StartDateTime?.timezone ||
			existingHotel.EndDateTime?.timezone;
		const endTimezone =
			params.timezone ||
			existingHotel.EndDateTime?.timezone ||
			existingHotel.StartDateTime?.timezone;

		const lodgingObject: any = {
			uuid: existingHotel.uuid,
			is_client_traveler: toBoolean(existingHotel.is_client_traveler),
			display_name: existingHotel.display_name,
			supplier_name:
				params.hotelName ??
				existingHotel.supplier_name ??
				existingHotel.display_name,
			supplier_conf_num:
				params.supplierConfNum ?? existingHotel.supplier_conf_num,
			booking_rate: params.bookingRate ?? existingHotel.booking_rate,
			is_purchased: toBoolean(existingHotel.is_purchased),
			notes: params.notes ?? existingHotel.notes,
			total_cost: params.totalCost ?? existingHotel.total_cost,
			StartDateTime: {
				date: params.checkInDate ?? existingHotel.StartDateTime?.date,
				time:
					normalizeTime(params.checkInTime || "") ??
					existingHotel.StartDateTime?.time,
				timezone: startTimezone,
			},
			EndDateTime: {
				date: params.checkOutDate ?? existingHotel.EndDateTime?.date,
				time:
					normalizeTime(params.checkOutTime || "") ??
					existingHotel.EndDateTime?.time,
				timezone: endTimezone,
			},
			Address: orderObjectByKeys(
				clean({
					address: params.street ?? existingHotel.Address?.address,
					city: params.city ?? existingHotel.Address?.city,
					state: params.state ?? existingHotel.Address?.state,
					zip: params.zip ?? existingHotel.Address?.zip,
					country: params.country ?? existingHotel.Address?.country,
				}),
				ADDRESS_FIELD_ORDER,
			),
		};

		if (tripKey) {
			lodgingObject[tripKey] = tripId;
		}

		return this.apiPost(
			this.endpoint("v2", `replace/lodging/uuid/${existingHotel.uuid}`),
			{
				LodgingObject: orderObjectByKeys(
					clean(lodgingObject),
					LODGING_FIELD_ORDER,
				),
			},
		);
	}

	// === Flights (Air) ===

	async getFlight(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("get", "air", id));
	}

	async deleteFlight(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("delete", "air", id));
	}

	async createFlight(params: {
		tripId: string;
		displayName: string;
		supplierName: string;
		segments: Array<{
			startDate: string;
			startTime: string;
			startTimezone: string;
			endDate: string;
			endTime: string;
			endTimezone: string;
			startCityName: string;
			startCountryCode: string;
			endCityName: string;
			endCountryCode: string;
			marketingAirline: string;
			marketingFlightNumber: string;
			aircraft?: string;
			serviceClass?: string;
		}>;
		supplierConfNum?: string;
		notes?: string;
		totalCost?: string;
	}): Promise<any> {
		const segments = params.segments.map((s) =>
			clean({
				StartDateTime: {
					date: s.startDate,
					time: normalizeTime(s.startTime),
					timezone: s.startTimezone,
				},
				EndDateTime: {
					date: s.endDate,
					time: normalizeTime(s.endTime),
					timezone: s.endTimezone,
				},
				start_city_name: s.startCityName,
				start_country_code: s.startCountryCode,
				end_city_name: s.endCityName,
				end_country_code: s.endCountryCode,
				marketing_airline: s.marketingAirline,
				marketing_flight_number: s.marketingFlightNumber,
				aircraft: s.aircraft,
				service_class: s.serviceClass,
			}),
		);
		return this.apiPost(this.endpoint("v2", "create/air"), {
			AirObject: clean({
				trip_uuid: params.tripId,
				display_name: params.displayName,
				supplier_name: params.supplierName,
				supplier_conf_num: params.supplierConfNum,
				notes: params.notes,
				total_cost: params.totalCost,
				Segment: segments,
			}),
		});
	}

	async updateFlight(params: {
		id?: string;
		uuid?: string;
		tripId?: string;
		displayName?: string;
		supplierName?: string;
		supplierConfNum?: string;
		notes?: string;
		totalCost?: string;
		segment?: {
			startDate?: string;
			startTime?: string;
			startTimezone?: string;
			endDate?: string;
			endTime?: string;
			endTimezone?: string;
			startCityName?: string;
			startCountryCode?: string;
			endCityName?: string;
			endCountryCode?: string;
			marketingAirline?: string;
			marketingFlightNumber?: string;
			aircraft?: string;
			serviceClass?: string;
		};
	}): Promise<any> {
		const identifier = params.uuid || params.id;
		if (!identifier) {
			throw new Error("Either uuid or id parameter is required");
		}

		const existingFlightResponse = await this.getFlight(identifier);
		const existingFlight = existingFlightResponse.AirObject;
		if (!existingFlight?.uuid) {
			throw new Error(`Flight with identifier ${identifier} not found`);
		}

		const existingSegment = normalizeArray(existingFlight.Segment)[0];
		if (!existingSegment) {
			throw new Error(`Flight with identifier ${identifier} has no segment`);
		}

		const tripId =
			params.tripId || existingFlight.trip_uuid || existingFlight.trip_id;
		const tripKey = tripId
			? tripId.includes("-")
				? "trip_uuid"
				: "trip_id"
			: undefined;

		const segment = {
			uuid: existingSegment.uuid,
			StartDateTime: {
				date: params.segment?.startDate ?? existingSegment.StartDateTime?.date,
				time:
					normalizeTime(params.segment?.startTime || "") ??
					existingSegment.StartDateTime?.time,
				timezone:
					params.segment?.startTimezone ??
					existingSegment.StartDateTime?.timezone,
			},
			EndDateTime: {
				date: params.segment?.endDate ?? existingSegment.EndDateTime?.date,
				time:
					normalizeTime(params.segment?.endTime || "") ??
					existingSegment.EndDateTime?.time,
				timezone:
					params.segment?.endTimezone ?? existingSegment.EndDateTime?.timezone,
			},
			start_city_name:
				params.segment?.startCityName ?? existingSegment.start_city_name,
			start_country_code:
				params.segment?.startCountryCode ?? existingSegment.start_country_code,
			end_city_name:
				params.segment?.endCityName ?? existingSegment.end_city_name,
			end_country_code:
				params.segment?.endCountryCode ?? existingSegment.end_country_code,
			marketing_airline:
				params.segment?.marketingAirline ??
				existingSegment.marketing_airline_code ??
				existingSegment.marketing_airline,
			marketing_flight_number:
				params.segment?.marketingFlightNumber ??
				existingSegment.marketing_flight_number,
			aircraft: params.segment?.aircraft ?? existingSegment.aircraft,
			service_class:
				params.segment?.serviceClass ?? existingSegment.service_class,
		};

		const airObject: any = {
			uuid: existingFlight.uuid,
			is_client_traveler: toBoolean(existingFlight.is_client_traveler),
			display_name: params.displayName ?? existingFlight.display_name,
			supplier_name: params.supplierName ?? existingFlight.supplier_name,
			supplier_conf_num:
				params.supplierConfNum ?? existingFlight.supplier_conf_num,
			is_purchased: toBoolean(existingFlight.is_purchased),
			notes: params.notes ?? existingFlight.notes,
			total_cost: params.totalCost ?? existingFlight.total_cost,
			Segment: [orderObjectByKeys(clean(segment), AIR_SEGMENT_FIELD_ORDER)],
		};

		if (tripKey) {
			airObject[tripKey] = tripId;
		}

		return this.apiPost(
			this.endpoint("v2", `replace/air/uuid/${existingFlight.uuid}`),
			{
				AirObject: orderObjectByKeys(clean(airObject), AIR_FIELD_ORDER),
			},
		);
	}

	// === Transport ===

	async getTransport(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("get", "transport", id));
	}

	async deleteTransport(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("delete", "transport", id));
	}

	async createTransport(params: {
		tripId: string;
		startDate: string;
		startTime: string;
		endDate: string;
		endTime: string;
		timezone: string;
		startAddress: string;
		endAddress: string;
		startLocationName?: string;
		endLocationName?: string;
		vehicleDescription?: string;
		carrierName?: string;
		confirmationNum?: string;
		displayName?: string;
	}): Promise<any> {
		const tripKey = params.tripId.includes("-") ? "trip_uuid" : "trip_id";
		const name =
			params.displayName ||
			[
				params.startLocationName || params.startAddress,
				params.endLocationName || params.endAddress,
			]
				.filter(Boolean)
				.join(" → ") ||
			"Transport";
		return this.apiPost(this.endpoint("v2", "create/transport"), {
			TransportObject: clean({
				[tripKey]: params.tripId,
				display_name: name,
				Segment: [
					clean({
						StartLocationAddress: { address: params.startAddress },
						StartDateTime: {
							date: params.startDate,
							time: normalizeTime(params.startTime),
							timezone: params.timezone,
						},
						EndLocationAddress: { address: params.endAddress },
						EndDateTime: {
							date: params.endDate,
							time: normalizeTime(params.endTime),
							timezone: params.timezone,
						},
						vehicle_description: params.vehicleDescription,
						start_location_name: params.startLocationName,
						end_location_name: params.endLocationName,
						confirmation_num: params.confirmationNum,
						carrier_name: params.carrierName,
					}),
				],
			}),
		});
	}

	async updateTransport(params: {
		id?: string;
		uuid?: string;
		tripId?: string;
		startDate?: string;
		startTime?: string;
		endDate?: string;
		endTime?: string;
		timezone?: string;
		startAddress?: string;
		endAddress?: string;
		startLocationName?: string;
		endLocationName?: string;
		vehicleDescription?: string;
		carrierName?: string;
		confirmationNum?: string;
		displayName?: string;
	}): Promise<any> {
		const identifier = params.uuid || params.id;
		if (!identifier) {
			throw new Error("Either uuid or id parameter is required");
		}

		const existingTransportResponse = await this.getTransport(identifier);
		const existingTransport = existingTransportResponse.TransportObject;
		if (!existingTransport?.uuid) {
			throw new Error(`Transport with identifier ${identifier} not found`);
		}

		const existingSegment = normalizeArray(existingTransport.Segment)[0];
		if (!existingSegment) {
			throw new Error(`Transport with identifier ${identifier} has no segment`);
		}

		const tripId =
			params.tripId || existingTransport.trip_uuid || existingTransport.trip_id;
		const tripKey = tripId
			? tripId.includes("-")
				? "trip_uuid"
				: "trip_id"
			: undefined;

		const segment = {
			uuid: existingSegment.uuid,
			StartLocationAddress: {
				address:
					params.startAddress ?? existingSegment.StartLocationAddress?.address,
			},
			StartDateTime: {
				date: params.startDate ?? existingSegment.StartDateTime?.date,
				time:
					normalizeTime(params.startTime || "") ??
					existingSegment.StartDateTime?.time,
				timezone: params.timezone ?? existingSegment.StartDateTime?.timezone,
			},
			EndLocationAddress: {
				address:
					params.endAddress ?? existingSegment.EndLocationAddress?.address,
			},
			EndDateTime: {
				date: params.endDate ?? existingSegment.EndDateTime?.date,
				time:
					normalizeTime(params.endTime || "") ??
					existingSegment.EndDateTime?.time,
				timezone: params.timezone ?? existingSegment.EndDateTime?.timezone,
			},
			vehicle_description:
				params.vehicleDescription ?? existingSegment.vehicle_description,
			start_location_name:
				params.startLocationName ?? existingSegment.start_location_name,
			end_location_name:
				params.endLocationName ?? existingSegment.end_location_name,
			confirmation_num:
				params.confirmationNum ?? existingSegment.confirmation_num,
			carrier_name: params.carrierName ?? existingSegment.carrier_name,
		};

		const transportObject: any = {
			uuid: existingTransport.uuid,
			is_client_traveler: toBoolean(existingTransport.is_client_traveler),
			display_name: params.displayName ?? existingTransport.display_name,
			is_purchased: toBoolean(existingTransport.is_purchased),
			is_tripit_booking: toBoolean(existingTransport.is_tripit_booking),
			has_possible_cancellation: toBoolean(
				existingTransport.has_possible_cancellation,
			),
			Segment: [
				orderObjectByKeys(clean(segment), TRANSPORT_SEGMENT_FIELD_ORDER),
			],
		};

		if (tripKey) {
			transportObject[tripKey] = tripId;
		}

		return this.apiPost(
			this.endpoint("v2", `replace/transport/uuid/${existingTransport.uuid}`),
			{
				TransportObject: orderObjectByKeys(
					clean(transportObject),
					TRANSPORT_FIELD_ORDER,
				),
			},
		);
	}

	// === Activities ===

	async getActivity(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("get", "activity", id));
	}

	async deleteActivity(id: string): Promise<any> {
		return this.apiGet(this.identifierEndpoint("delete", "activity", id));
	}

	async createActivity(params: {
		tripId: string;
		displayName: string;
		startDate: string;
		startTime: string;
		endDate: string;
		endTime: string;
		timezone: string;
		address: string;
		locationName: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
	}): Promise<any> {
		const tripKey = params.tripId.includes("-") ? "trip_uuid" : "trip_id";
		return this.apiPost(this.endpoint("v2", "create/activity"), {
			ActivityObject: clean({
				[tripKey]: params.tripId,
				display_name: params.displayName,
				StartDateTime: {
					date: params.startDate,
					time: normalizeTime(params.startTime),
					timezone: params.timezone,
				},
				EndDateTime: {
					date: params.endDate,
					time: normalizeTime(params.endTime),
					timezone: params.timezone,
				},
				Address: clean({
					address: params.address,
					city: params.city,
					state: params.state,
					zip: params.zip,
					country: params.country,
				}),
				location_name: params.locationName,
			}),
		});
	}

	async updateActivity(params: {
		id?: string;
		uuid?: string;
		tripId?: string;
		displayName?: string;
		startDate?: string;
		startTime?: string;
		endDate?: string;
		endTime?: string;
		timezone?: string;
		address?: string;
		locationName?: string;
		city?: string;
		state?: string;
		zip?: string;
		country?: string;
		notes?: string;
	}): Promise<any> {
		const identifier = params.uuid || params.id;
		if (!identifier) {
			throw new Error("Either uuid or id parameter is required");
		}

		const existingActivityResponse = await this.getActivity(identifier);
		const existingActivity = existingActivityResponse.ActivityObject;
		if (!existingActivity?.uuid) {
			throw new Error(`Activity with identifier ${identifier} not found`);
		}

		const tripId =
			params.tripId || existingActivity.trip_uuid || existingActivity.trip_id;
		const tripKey = tripId
			? tripId.includes("-")
				? "trip_uuid"
				: "trip_id"
			: undefined;

		const activityObject: any = {
			uuid: existingActivity.uuid,
			is_client_traveler: toBoolean(existingActivity.is_client_traveler),
			display_name: params.displayName ?? existingActivity.display_name,
			is_purchased: toBoolean(existingActivity.is_purchased),
			notes: params.notes ?? existingActivity.notes,
			StartDateTime: {
				date: params.startDate ?? existingActivity.StartDateTime?.date,
				time:
					normalizeTime(params.startTime || "") ??
					existingActivity.StartDateTime?.time,
				timezone: params.timezone ?? existingActivity.StartDateTime?.timezone,
			},
			EndDateTime: {
				date: params.endDate ?? existingActivity.EndDateTime?.date,
				time:
					normalizeTime(params.endTime || "") ??
					existingActivity.EndDateTime?.time,
				timezone: params.timezone ?? existingActivity.EndDateTime?.timezone,
			},
			Address: orderObjectByKeys(
				clean({
					address: params.address ?? existingActivity.Address?.address,
					city: params.city ?? existingActivity.Address?.city,
					state: params.state ?? existingActivity.Address?.state,
					zip: params.zip ?? existingActivity.Address?.zip,
					country: params.country ?? existingActivity.Address?.country,
				}),
				ADDRESS_FIELD_ORDER,
			),
			location_name: params.locationName ?? existingActivity.location_name,
		};

		if (tripKey) {
			activityObject[tripKey] = tripId;
		}

		return this.apiPost(
			this.endpoint("v2", `replace/activity/uuid/${existingActivity.uuid}`),
			{
				ActivityObject: orderObjectByKeys(
					clean(activityObject),
					ACTIVITY_FIELD_ORDER,
				),
			},
		);
	}

	private async followRedirects(
		fetchFn: typeof fetch,
		url: string,
	): Promise<{ html: string; formAction: string }> {
		let currentUrl = url;
		for (let i = 0; i < 5; i++) {
			const res = await (fetchFn as any)(currentUrl, {
				headers: BROWSER_HEADERS,
				redirect: "manual",
			});
			const body = await res.text();

			if (res.status === 302 || res.status === 303) {
				const location = res.headers.get("location");
				if (!location) throw new Error("Redirect without location header");
				currentUrl = new URL(location, currentUrl).href;
				continue;
			}

			const $ = cheerio.load(body);
			if (
				$('form input[name="username"]').length === 0 ||
				$('form input[name="password"]').length === 0
			) {
				throw new Error("Login form not found");
			}

			return { html: body, formAction: currentUrl };
		}
		throw new Error("Too many redirects while getting login form");
	}

	private async submitLogin(
		fetchFn: typeof fetch,
		formHtml: string,
		formAction: string,
	): Promise<string> {
		const $ = cheerio.load(formHtml);

		const submitData: Record<string, string> = {};
		$("form input").each((_, el) => {
			const name = $(el).attr("name");
			const value = $(el).attr("value") || "";
			if (name) submitData[name] = value;
		});
		submitData.username = this.config.username;
		submitData.password = this.config.password;

		const formActionUrl = $("form").attr("action");
		if (!formActionUrl) throw new Error("No form action URL found");

		const finalUrl = new URL(formActionUrl, formAction).href;

		const res = await (fetchFn as any)(finalUrl, {
			method: "POST",
			headers: {
				...BROWSER_HEADERS,
				"Content-Type": "application/x-www-form-urlencoded",
				"Sec-Fetch-Site": "same-origin",
				"Sec-Fetch-User": "?1",
				Origin: BASE_URL,
				Referer: formAction,
			},
			body: new URLSearchParams(submitData).toString(),
			redirect: "manual",
		});

		const responseText = await res.text();

		if (res.status === 403) {
			throw new Error("Login failed (403)");
		}

		if (res.status === 302 || res.status === 303) {
			const location = res.headers.get("location");
			if (!location) throw new Error("No redirect location after login");
			return location;
		}

		if (res.status === 200) {
			const $r = cheerio.load(responseText);

			const errorMsg = $r(".error-message").text() || $r(".alert-error").text();
			if (errorMsg) throw new Error(`Login failed: ${errorMsg}`);

			// Check meta refresh
			const meta = $r('meta[http-equiv="refresh"]').attr("content");
			if (meta) {
				const match = meta.match(/URL=(.+)$/);
				if (match?.[1]) return match[1];
			}

			// Check JS redirect
			const scripts = $r("script").text();
			const redirectMatch = scripts.match(
				/(?:window\.location|window\.location\.href)\s*=\s*["']([^"']+)["']/,
			);
			if (redirectMatch?.[1]) return redirectMatch[1];

			throw new Error("Could not find redirect URL in login response");
		}

		throw new Error(`Unexpected login response status: ${res.status}`);
	}

	private async exchangeCodeForToken(
		code: string,
		codeVerifier: string,
	): Promise<any> {
		const params = new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: REDIRECT_URI,
			client_id: this.config.clientId,
			code_verifier: codeVerifier,
		});

		const res = await fetch(`${API_BASE_URL}/oauth2/token`, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params.toString(),
		});

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`Token exchange failed (${res.status}): ${body}`);
		}

		return res.json();
	}

	private loadCachedToken(): CachedToken | null {
		try {
			if (fs.existsSync(TOKEN_CACHE_FILE)) {
				return JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, "utf-8"));
			}
		} catch {
			// Ignore corrupt cache
		}
		return null;
	}

	private cacheToken(tokenResponse: any): void {
		const cached: CachedToken = {
			access_token: tokenResponse.access_token,
			expires_in: tokenResponse.expires_in,
			token_type: tokenResponse.token_type,
			scope: tokenResponse.scope,
			expiresAt: Date.now() + (tokenResponse.expires_in - 30) * 1000,
		};

		fs.mkdirSync(CACHE_DIR, { recursive: true });
		fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cached, null, 2));
	}
}
