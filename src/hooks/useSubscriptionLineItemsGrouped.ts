import { useMemo } from 'react';
import type { LineItem } from '@/models/Subscription';

export interface PhaseDetail {
	index: number;
	startDate: string;
	endDate?: string;
}

export interface GroupedLineItems {
	withoutPhase: LineItem[];
	byPhase: Record<string, LineItem[]>;
}

export interface SubscriptionWithLineItemsAndPhases {
	line_items?: LineItem[];
	phases?: { id: string; start_date: string; end_date?: string | null }[];
}

/**
 * Groups subscription line items by phase and builds phase metadata.
 */
export function useSubscriptionLineItemsGrouped(subscription: SubscriptionWithLineItemsAndPhases | null | undefined): {
	groupedLineItems: GroupedLineItems;
	phaseDetails: Record<string, PhaseDetail>;
} {
	const groupedLineItems = useMemo((): GroupedLineItems => {
		if (!subscription?.line_items) return { withoutPhase: [], byPhase: {} };

		const lineItems = subscription.line_items;
		const withoutPhase: LineItem[] = [];
		const byPhase: Record<string, LineItem[]> = {};

		lineItems.forEach((lineItem) => {
			if (lineItem.subscription_phase_id) {
				if (!byPhase[lineItem.subscription_phase_id]) {
					byPhase[lineItem.subscription_phase_id] = [];
				}
				byPhase[lineItem.subscription_phase_id].push(lineItem);
			} else {
				withoutPhase.push(lineItem);
			}
		});

		return { withoutPhase, byPhase };
	}, [subscription?.line_items]);

	const phaseDetails = useMemo((): Record<string, PhaseDetail> => {
		if (!subscription?.phases) return {};

		const details: Record<string, PhaseDetail> = {};
		subscription.phases.forEach((phase, index) => {
			details[phase.id] = {
				index: index + 1,
				startDate: phase.start_date,
				endDate: phase.end_date ?? undefined,
			};
		});

		return details;
	}, [subscription?.phases]);

	return { groupedLineItems, phaseDetails };
}
