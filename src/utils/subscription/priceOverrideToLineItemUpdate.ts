import type { UpdateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import type { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';

/**
 * Converts price override form data into subscription line item update payload.
 */
export function convertPriceOverrideToLineItemUpdate(
	_priceId: string,
	override: Partial<ExtendedPriceOverride>,
): UpdateSubscriptionLineItemRequest {
	const updateData: UpdateSubscriptionLineItemRequest = {};

	if (override.amount) {
		updateData.amount = parseFloat(override.amount);
	}

	if (override.billing_model && override.billing_model !== 'SLAB_TIERED') {
		updateData.billing_model = override.billing_model;
	}

	if (override.tier_mode) {
		updateData.tier_mode = override.tier_mode;
	}

	if (override.tiers) {
		updateData.tiers = override.tiers;
	}

	if (override.transform_quantity) {
		updateData.transform_quantity = override.transform_quantity;
	}

	if (override.effective_from) {
		updateData.effective_from = override.effective_from;
	}

	return updateData;
}
