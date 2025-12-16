import { useState, useEffect } from 'react';
import { formatBillingPeriodForPrice, getCurrencySymbol } from '@/utils/common/helper_functions';
import { billlingPeriodOptions, currencyOptions } from '@/constants/constants';
import { InternalPrice } from './SetupChargesSection';
import { PriceInternalState } from './UsagePricingForm';
import { CheckboxRadioGroup, FormHeader, Input, Spacer, Button, Select, DatePicker } from '@/components/atoms';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import RecurringChargePreview from './RecurringChargePreview';
import { BILLING_CADENCE, INVOICE_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD, PRICE_ENTITY_TYPE, PRICE_TYPE } from '@/models/Price';
import SelectGroup from './SelectGroup';
import { Group } from '@/models/Group';

interface Props {
	price: Partial<InternalPrice>;
	onAdd: (price: Partial<InternalPrice>) => void;
	onUpdate: (price: Partial<InternalPrice>) => void;
	onEditClicked: () => void;
	onDeleteClicked: () => void;
	entityType?: PRICE_ENTITY_TYPE;
	entityId?: string;
	entityName?: string;
}

const RecurringChargesForm = ({
	price,
	onAdd,
	onUpdate,
	onEditClicked,
	onDeleteClicked,
	entityType = PRICE_ENTITY_TYPE.PLAN,
	entityId,
	entityName,
}: Props) => {
	// Helper function to compute default values for price state
	const computePriceDefaults = (priceProp: Partial<InternalPrice>, entityNameProp?: string) => {
		return {
			display_name: priceProp.display_name || entityNameProp || '',
			min_quantity: priceProp.min_quantity ?? (priceProp.type === PRICE_TYPE.FIXED ? 1 : undefined),
		};
	};

	const [localPrice, setLocalPrice] = useState<Partial<InternalPrice>>(() => ({
		...price,
		...computePriceDefaults(price, entityName),
	}));
	const [startDate, setStartDate] = useState<Date | undefined>(() => (price.start_date ? new Date(price.start_date) : undefined));
	const [errors, setErrors] = useState<Partial<Record<keyof InternalPrice, string>>>({});

	// Sync localPrice and startDate when price prop or entityName changes
	useEffect(() => {
		setStartDate(price.start_date ? new Date(price.start_date) : undefined);

		setLocalPrice((prev) => {
			// Merge price changes, preserving user edits where appropriate
			const updated = { ...prev, ...price };

			// Apply display_name: always prefer price prop value if it exists (including empty string for explicit clearing)
			// Only fallback to entityName if price.display_name is undefined/null and we don't have a previous value
			if (price.display_name !== undefined && price.display_name !== null) {
				updated.display_name = price.display_name;
			} else if (entityName && (!prev.display_name || prev.display_name === '')) {
				updated.display_name = entityName;
			}
			// If price.display_name is undefined/null and we have a prev value, keep it (preserves user edits)

			// Apply min_quantity: for fixed charges, prefer price prop value, default to 1 if not set
			if (price.type === PRICE_TYPE.FIXED) {
				updated.min_quantity = price.min_quantity !== undefined ? price.min_quantity : (prev.min_quantity ?? 1);
			} else if (price.min_quantity !== undefined) {
				updated.min_quantity = price.min_quantity;
			}

			return updated;
		});
	}, [price, entityName]);

	const validate = () => {
		const newErrors: Partial<Record<keyof InternalPrice, string>> = {};

		if (!localPrice.amount) {
			newErrors.amount = 'Price is required';
		}
		if (!localPrice.billing_period) {
			newErrors.billing_period = 'Billing Period is required';
		}
		if (!localPrice.currency) {
			newErrors.currency = 'Currency is required';
		}

		if (!localPrice.invoice_cadence) {
			newErrors.invoice_cadence = 'Invoice Cadence is required';
		}

		if (localPrice.isTrialPeriod && !localPrice.trial_period) {
			newErrors.trial_period = 'Trial Period is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = () => {
		if (!validate()) return;

		const priceWithEntity = {
			...localPrice,
			entity_type: entityType,
			entity_id: entityId || '',
			start_date: startDate ? startDate.toISOString() : undefined,
		};

		if (price.internal_state === PriceInternalState.EDIT) {
			onUpdate({
				...priceWithEntity,
				isEdit: false,
			});
		} else {
			onAdd({
				...priceWithEntity,
				isEdit: false,
			});
		}
	};

	const handleGroupChange = (group: Group | null) => {
		setLocalPrice({ ...localPrice, group_id: group?.id || undefined });
	};

	if (price.internal_state === PriceInternalState.SAVED) {
		return <RecurringChargePreview charge={price} onEditClicked={onEditClicked} onDeleteClicked={onDeleteClicked} />;
	}

	return (
		<div className='card'>
			<Input
				onChange={(value) => setLocalPrice({ ...localPrice, display_name: value })}
				value={localPrice.display_name || ''}
				variant='text'
				label='Display Name'
				placeholder={entityName || 'Enter display name'}
				error={errors.display_name}
			/>
			<Spacer height={'8px'} />
			<Select
				value={localPrice.currency}
				options={currencyOptions}
				label='Currency'
				onChange={(value) => setLocalPrice({ ...localPrice, currency: value })}
				error={errors.currency}
			/>
			<Spacer height={'8px'} />
			<Select
				value={localPrice.billing_period}
				options={billlingPeriodOptions}
				onChange={(value) => setLocalPrice({ ...localPrice, billing_period: value as BILLING_PERIOD })}
				label='Billing Period'
				error={errors.billing_period}
			/>
			<Spacer height={'8px'} />
			<Input
				onChange={(value) => setLocalPrice({ ...localPrice, amount: value })}
				value={localPrice.amount}
				variant='formatted-number'
				label='Price'
				placeholder='0'
				error={errors.amount}
				inputPrefix={getCurrencySymbol(localPrice.currency || '')}
				suffix={<span className='text-[#64748B]'> {`per ${formatBillingPeriodForPrice(localPrice.billing_period || '')}`}</span>}
			/>
			<Spacer height={'8px'} />
			<SelectGroup
				value={localPrice.group_id}
				onChange={handleGroupChange}
				label='Group'
				placeholder='Select a group (optional)'
				description='Assign this price to a group for better organization'
				hiddenIfEmpty
			/>
			<Spacer height={'16px'} />
			<DatePicker
				popoverTriggerClassName='w-full'
				className='w-full'
				popoverClassName='w-full'
				popoverContentClassName='w-full'
				date={startDate}
				setDate={setStartDate}
				label='Start Date (Optional)'
				placeholder='Select start date'
				minDate={new Date()}
			/>
			<Spacer height={'16px'} />
			<FormHeader title='Billing Timing' variant='form-component-title' />
			{/* starting billing preffercences */}

			<CheckboxRadioGroup
				title='	'
				value={localPrice.invoice_cadence}
				checkboxItems={[
					{
						label: 'Advance',
						value: INVOICE_CADENCE.ADVANCE,
						description: 'Charge at the start of each billing cycle.',
					},
					{
						label: 'Arrear',
						value: INVOICE_CADENCE.ARREAR,
						description: 'Charge at the end of the billing cycle.',
					},
				]}
				onChange={(value) => {
					setLocalPrice({ ...localPrice, invoice_cadence: value as INVOICE_CADENCE });
					if (value === BILLING_CADENCE.ONETIME) {
						setLocalPrice({ ...localPrice, isTrialPeriod: false, trial_period: 0 });
					}
				}}
				error={errors.invoice_cadence}
			/>
			<Spacer height={'16px'} />
			{localPrice.type === PRICE_TYPE.FIXED && (
				<>
					<Input
						variant='number'
						error={errors.min_quantity}
						value={localPrice.min_quantity?.toString() || ''}
						onChange={(value) => {
							const numValue = value === '' ? undefined : Math.floor(Number(value));
							setLocalPrice({ ...localPrice, min_quantity: numValue });
						}}
						label='Minimum Quantity'
						placeholder='1'
					/>
					<Spacer height={'16px'} />
				</>
			)}
			<div>
				<FormHeader title='Trial Period' variant='form-component-title' />
				<div className='flex items-center space-x-4 s'>
					<Switch
						id='airplane-mode'
						checked={localPrice.isTrialPeriod}
						onCheckedChange={(value) => {
							setLocalPrice({ ...localPrice, isTrialPeriod: value });
						}}
					/>
					<Label htmlFor='airplane-mode'>
						<p className='font-medium text-sm text-[#18181B] peer-checked:text-black'>Start with a free trial</p>
						<Spacer height={'4px'} />
						<p className='text-sm font-normal text-[#71717A] peer-checked:text-gray-700'>
							Enable this option to add a free trial period for the subscription.
						</p>
					</Label>
				</div>
			</div>
			{localPrice.isTrialPeriod && (
				<div>
					<Spacer height={'8px'} />
					<Input
						variant='number'
						error={errors.trial_period}
						value={localPrice.trial_period}
						onChange={(value) => {
							setLocalPrice({ ...localPrice, trial_period: Number(value) });
						}}
						suffix='days'
						placeholder='Number of trial days'
					/>
				</div>
			)}
			<Spacer height={'16px'} />
			<div className='flex justify-end'>
				<Button onClick={onDeleteClicked} variant='secondary' className='mr-4 text-zinc-900'>
					{price.internal_state === PriceInternalState.EDIT ? 'Delete' : 'Cancel'}
				</Button>
				<Button onClick={handleSubmit} variant='default' className='mr-4 font-normal'>
					{price.internal_state === PriceInternalState.EDIT ? 'Update' : 'Add'}
				</Button>
			</div>
		</div>
	);
};

export default RecurringChargesForm;
