import { GetCombinedAnalyticsResponse } from '@/types/dto/CostAnalytics';

/**
 * Type guard to check if data is GetCombinedAnalyticsResponse
 */
export const isCombinedAnalytics = (data: unknown): data is GetCombinedAnalyticsResponse => {
	return typeof data === 'object' && data !== null && 'total_revenue' in data && 'margin' in data;
};

/**
 * Creates a stable deterministic ID for a CostAnalyticItem
 * Uses a combination of stable fields to ensure consistency across reorders
 */
export const createStableId = (item: {
	meter_id?: string;
	meter_name?: string;
	source?: string;
	customer_id?: string;
	external_customer_id?: string;
	price_id?: string;
}): string => {
	// Primary: meter_id should always be present
	if (item.meter_id) {
		return item.meter_id;
	}

	// Fallback: create a deterministic key from stable fields
	const parts = [item.meter_name, item.source, item.customer_id || item.external_customer_id, item.price_id].filter(Boolean);

	if (parts.length > 0) {
		return `item-${parts.join('-')}`;
	}

	// Last resort: should not happen in production
	return 'unknown-item';
};
