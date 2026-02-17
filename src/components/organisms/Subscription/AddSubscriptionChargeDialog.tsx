import { useState, useEffect } from 'react';
import { uniqueId } from 'lodash';
import Dialog from '@/components/atoms/Dialog';
import { RecurringChargesForm } from '@/components/organisms/PlanForm';
import { PriceInternalState } from '@/components/organisms/PlanForm/UsagePricingForm';
import type { InternalPrice } from '@/components/organisms/PlanForm/SetupChargesSection';
import type { CreateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_MODEL, BILLING_PERIOD, PRICE_TYPE } from '@/models/Price';
import {
	internalPriceToSubscriptionLineItemRequest,
	subscriptionLineItemToInternalPrice,
} from '@/utils/subscription/internalPriceToSubscriptionLineItemRequest';

export type AddedSubscriptionLineItem = CreateSubscriptionLineItemRequest & { tempId: string };

interface AddSubscriptionChargeDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (item: AddedSubscriptionLineItem) => void;
	defaultCurrency?: string;
	defaultBillingPeriod?: string;
	/** When set, dialog is in edit mode: form pre-filled and save updates this item (same tempId). */
	initialItem?: AddedSubscriptionLineItem | null;
}

const getEmptyPrice = (defaultCurrency?: string, defaultBillingPeriod?: string): Partial<InternalPrice> => ({
	amount: '',
	currency: defaultCurrency ?? 'USD',
	billing_period: (defaultBillingPeriod as BILLING_PERIOD) ?? BILLING_PERIOD.MONTHLY,
	billing_period_count: 1,
	invoice_cadence: INVOICE_CADENCE.ARREAR,
	billing_model: BILLING_MODEL.FLAT_FEE,
	billing_cadence: BILLING_CADENCE.RECURRING,
	type: PRICE_TYPE.FIXED,
	display_name: '',
	min_quantity: 1,
	internal_state: PriceInternalState.NEW,
});

const AddSubscriptionChargeDialog: React.FC<AddSubscriptionChargeDialogProps> = ({
	isOpen,
	onOpenChange,
	onSave,
	defaultCurrency,
	defaultBillingPeriod,
	initialItem = null,
}) => {
	const [price, setPrice] = useState<Partial<InternalPrice>>(() => getEmptyPrice(defaultCurrency, defaultBillingPeriod));

	useEffect(() => {
		if (isOpen) {
			if (initialItem) {
				setPrice(
					subscriptionLineItemToInternalPrice(initialItem, {
						currency: defaultCurrency,
						billingPeriod: defaultBillingPeriod,
					}),
				);
			} else {
				setPrice(getEmptyPrice(defaultCurrency, defaultBillingPeriod));
			}
		}
	}, [isOpen, defaultCurrency, defaultBillingPeriod, initialItem]);

	const handleAdd = (partial: Partial<InternalPrice>) => {
		const quantity = partial.min_quantity != null ? Number(partial.min_quantity) : 1;
		const request = internalPriceToSubscriptionLineItemRequest(partial, quantity);
		const item: AddedSubscriptionLineItem = {
			...request,
			tempId: uniqueId('sub_'),
		};
		onSave(item);
		onOpenChange(false);
	};

	const handleUpdate = (partial: Partial<InternalPrice>) => {
		if (!initialItem) return;
		const quantity = partial.min_quantity != null ? Number(partial.min_quantity) : 1;
		const request = internalPriceToSubscriptionLineItemRequest(partial, quantity);
		const item: AddedSubscriptionLineItem = {
			...request,
			tempId: initialItem.tempId,
		};
		onSave(item);
		onOpenChange(false);
	};

	const isEditMode = !!initialItem;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={isEditMode ? 'Edit recurring charge' : 'Add recurring charge'}
			description='Add a subscription-level recurring charge. It will appear in the charges table and be included when the subscription is created.'
			className='max-w-3xl w-full'>
			<RecurringChargesForm
				price={price}
				onAdd={handleAdd}
				onUpdate={handleUpdate}
				onEditClicked={() => {}}
				onDeleteClicked={() => onOpenChange(false)}
				entityName=''
			/>
		</Dialog>
	);
};

export default AddSubscriptionChargeDialog;
