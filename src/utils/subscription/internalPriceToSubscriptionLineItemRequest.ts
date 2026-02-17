import { BILLING_CADENCE, BILLING_MODEL, BILLING_PERIOD, INVOICE_CADENCE, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models';
import type { CreateSubscriptionLineItemRequest, SubscriptionPriceCreateRequest } from '@/types/dto/Subscription';
import type { InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';

/** Item shape for subscription-added line (request + tempId). */
export type AddedSubscriptionLineItemLike = CreateSubscriptionLineItemRequest & { tempId: string };

/**
 * Converts form state from RecurringChargesForm (InternalPrice) into
 * CreateSubscriptionLineItemRequest for subscription-level line items.
 * Used when adding a recurring charge via Add Subscription Charge dialog.
 */
export function internalPriceToSubscriptionLineItemRequest(
	partial: Partial<InternalPrice>,
	quantity?: number,
): CreateSubscriptionLineItemRequest {
	const price: SubscriptionPriceCreateRequest = {
		type: partial.type ?? PRICE_TYPE.FIXED,
		price_unit_type: partial.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		billing_period: (partial.billing_period as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
		billing_period_count: partial.billing_period_count ?? 1,
		billing_model: (partial.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE,
		billing_cadence: partial.billing_cadence ?? BILLING_CADENCE.RECURRING,
		invoice_cadence: (partial.invoice_cadence as INVOICE_CADENCE) ?? INVOICE_CADENCE.ARREAR,
		amount: partial.amount,
		display_name: partial.display_name,
		min_quantity: partial.min_quantity,
		start_date: partial.start_date,
	};

	if (partial.price_unit_type === PRICE_UNIT_TYPE.CUSTOM && partial.price_unit_config) {
		price.price_unit_config = partial.price_unit_config;
		// For CUSTOM FLAT_FEE, amount lives in price_unit_config
		if (partial.amount && price.price_unit_config) {
			price.price_unit_config = { ...price.price_unit_config, amount: partial.amount };
		}
	} else {
		price.amount = partial.amount;
	}

	const req: CreateSubscriptionLineItemRequest = {
		price,
		quantity: quantity ?? partial.min_quantity ?? 1,
		display_name: partial.display_name,
		start_date: partial.start_date,
	};
	return req;
}

export interface SubscriptionLineItemToInternalPriceDefaults {
	currency?: string;
	billingPeriod?: string;
}

/**
 * Converts an added subscription line item back to RecurringChargesForm state (InternalPrice).
 * Used when editing an existing subscription-level charge so the form can be pre-filled.
 */
export function subscriptionLineItemToInternalPrice(
	item: AddedSubscriptionLineItemLike,
	defaults?: SubscriptionLineItemToInternalPriceDefaults,
): Partial<InternalPrice> {
	const p = item.price;
	if (!p) {
		return {
			display_name: item.display_name ?? '',
			min_quantity: item.quantity ?? 1,
			start_date: item.start_date,
			internal_state: PriceInternalState.EDIT,
		};
	}
	const isCustom = p.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;
	const base: Partial<InternalPrice> = {
		display_name: item.display_name ?? p.display_name ?? '',
		billing_period: (p.billing_period as BILLING_PERIOD) ?? (defaults?.billingPeriod as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
		billing_period_count: p.billing_period_count ?? 1,
		invoice_cadence: (p.invoice_cadence as INVOICE_CADENCE) ?? INVOICE_CADENCE.ARREAR,
		billing_model: (p.billing_model as BILLING_MODEL) ?? BILLING_MODEL.FLAT_FEE,
		billing_cadence: (p.billing_cadence as BILLING_CADENCE) ?? BILLING_CADENCE.RECURRING,
		type: (p.type as PRICE_TYPE) ?? PRICE_TYPE.FIXED,
		min_quantity: item.quantity ?? p.min_quantity ?? 1,
		start_date: item.start_date ?? p.start_date,
		price_unit_type: p.price_unit_type ?? PRICE_UNIT_TYPE.FIAT,
		internal_state: PriceInternalState.EDIT,
	};
	if (isCustom && p.price_unit_config) {
		return {
			...base,
			price_unit_config: p.price_unit_config,
			amount: p.price_unit_config.amount ?? p.amount,
		};
	}
	return {
		...base,
		amount: p.amount,
		currency: (p as { currency?: string }).currency ?? defaults?.currency ?? 'USD',
	};
}
