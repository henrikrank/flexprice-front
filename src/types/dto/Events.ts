import { Event, WindowSize, UsageAnalyticItem } from '@/models';

export interface GetEventsPayload {
	external_customer_id?: string;
	event_name?: string;
	start_time?: string;
	end_time?: string;
	iter_first_key?: string;
	iter_last_key?: string;
	page_size?: number;
	event_id?: string;
	source?: string;
}

// Request for POST /events/query
export interface GetEventsRequest {
	external_customer_id?: string;
	event_name?: string;
	event_id?: string;
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	iter_first_key?: string;
	iter_last_key?: string;
	property_filters?: Record<string, string[]>;
	page_size?: number;
	offset?: number;
	source?: string;
	sort?: string; // "timestamp" | "event_name"
	order?: string; // "asc" | "desc"
}

export interface GetEventsResponse {
	events: Event[];
	has_more: boolean;
	iter_first_key?: string;
	iter_last_key?: string;
	total_count?: number;
	offset?: number;
}

export interface GetUsageByMeterPayload {
	meter_id: string;
	end_time?: string;
	start_time?: string;
	external_customer_id?: string;
	filters?: Record<string, string[]>;
	window_size?: string;
}

export interface GetUsageByMeterResponse {
	type: string;
	event_name: string;
	results: {
		window_size: string;
		value: number;
	}[];
}

export interface FireEventsPayload {
	customer_id?: string;
	subscription_id?: string;
	feature_id?: string;
	duration?: number;
	amount?: number;
}

// Analytics DTOs
export interface GetUsageAnalyticsRequest {
	external_customer_id: string;
	feature_ids?: string[];
	sources?: string[];
	start_time?: string;
	end_time?: string;
	group_by?: string[]; // allowed values: "source", "feature_id", "properties.<field_name>"
	window_size?: WindowSize;
	expand?: string[]; // allowed values: "price", "meter", "feature", "subscription_line_item","plan","addon"
	property_filters?: Record<string, string[]>;
}

export interface GetUsageAnalyticsResponse {
	total_cost: number;
	currency: string;
	items: UsageAnalyticItem[];
}

// Monitoring DTOs
export interface GetMonitoringDataRequest {
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	window_size?: WindowSize;
}

export interface EventCountPoint {
	timestamp: string; // ISO 8601 format
	event_count: number;
}

export interface GetMonitoringDataResponse {
	total_count: number;
	consumption_lag: number;
	post_processing_lag: number;
	points?: EventCountPoint[];
}

// Usage DTOs for POST /events/usage
export interface GetUsageRequest {
	external_customer_id?: string;
	customer_id?: string;
	event_name: string;
	property_name?: string; // will be empty/ignored in case of COUNT
	aggregation_type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
	start_time?: string; // ISO 8601 format
	end_time?: string; // ISO 8601 format
	window_size?: WindowSize;
	bucket_size?: WindowSize; // Optional, only used for MAX aggregation with windowing
	filters?: Record<string, string[]>;
	multiplier?: string; // Decimal as string
	billing_anchor?: string; // ISO 8601 format - for custom monthly billing periods
}

export interface UsageResult {
	window_size: string; // ISO 8601 format
	value: number;
}

export interface GetUsageResponse {
	results?: UsageResult[];
	value?: number;
	event_name: string;
	type: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

// HuggingFace Billing DTOs
export interface GetHuggingFaceBillingDataRequest {
	requestIds: string[]; // Array of event IDs
}

export interface EventCostInfo {
	requestId: string;
	costNanoUsd: string; // Decimal as string
}

export interface GetHuggingFaceBillingDataResponse {
	requests: EventCostInfo[];
}
