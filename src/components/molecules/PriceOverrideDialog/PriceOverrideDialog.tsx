import { FC, useState, useEffect } from 'react';
import { Dialog } from '@/components/atoms';
import { Input, Button, Select, SelectOption, DatePicker } from '@/components/atoms';
import { Price, BILLING_MODEL, TIER_MODE, CreatePriceTier, TransformQuantity, PRICE_TYPE, PRICE_UNIT_TYPE } from '@/models/Price';
import { formatAmount, removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import VolumeTieredPricingForm from '@/components/organisms/PlanForm/VolumeTieredPricingForm';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onResetOverride: (priceId: string) => void;
	overriddenPrices: Record<string, ExtendedPriceOverride>;
	showEffectiveFrom?: boolean; // Optional prop to conditionally show effective_from date
}

const billingModelOptions: SelectOption[] = [
	{ label: 'Flat Fee', value: BILLING_MODEL.FLAT_FEE },
	{ label: 'Package', value: BILLING_MODEL.PACKAGE },
	{ label: 'Volume Tiered', value: BILLING_MODEL.TIERED },
	{ label: 'Slab Tiered', value: 'SLAB_TIERED' },
];

const PriceOverrideDialog: FC<Props> = ({
	isOpen,
	onOpenChange,
	price,
	onPriceOverride,
	onResetOverride,
	overriddenPrices,
	showEffectiveFrom = false,
}) => {
	const [overrideAmount, setOverrideAmount] = useState('');
	const [overrideQuantity, setOverrideQuantity] = useState<number | undefined>(undefined);
	const [overrideBillingModel, setOverrideBillingModel] = useState<BILLING_MODEL | 'SLAB_TIERED'>(price.billing_model);
	const [overrideTierMode, setOverrideTierMode] = useState<TIER_MODE>(price.tier_mode || TIER_MODE.VOLUME);
	const [overrideTiers, setOverrideTiers] = useState<CreatePriceTier[]>([]);
	const [overrideTransformQuantity, setOverrideTransformQuantity] = useState<TransformQuantity>({
		divide_by: 1,
	});
	const [effectiveFrom, setEffectiveFrom] = useState<Date | undefined>(undefined);
	const [isOverridden, setIsOverridden] = useState(false);

	// Detect price unit type
	const isCustomPriceUnit = price.price_unit_type === PRICE_UNIT_TYPE.CUSTOM;

	// Check if this price is currently overridden
	useEffect(() => {
		const currentOverride = overriddenPrices[price.id];
		const isCurrentlyOverridden = currentOverride !== undefined;
		setIsOverridden(isCurrentlyOverridden);

		if (isCurrentlyOverridden) {
			// Initialize from override or original price based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(currentOverride.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || '');
				setOverrideTiers(currentOverride.price_unit_tiers || price.price_unit_tiers || []);
			} else {
				setOverrideAmount(currentOverride.amount || price.amount);
				setOverrideTiers(currentOverride.tiers || price.tiers || []);
			}
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTierMode(currentOverride.tier_mode || price.tier_mode || TIER_MODE.VOLUME);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom && currentOverride.effective_from) {
				setEffectiveFrom(new Date(currentOverride.effective_from));
			}
		} else {
			// Prefill with original price values
			setOverrideQuantity(1); // Default quantity for usage-based prices
			setOverrideBillingModel(price.billing_model);
			setOverrideTierMode(price.tier_mode || TIER_MODE.VOLUME);

			// Initialize amount and tiers based on price unit type
			if (isCustomPriceUnit) {
				const initialAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				setOverrideAmount(initialAmount);

				// Initialize with original price_unit_tiers if they exist, otherwise start with one default tier
				if (price.price_unit_tiers && price.price_unit_tiers.length > 0) {
					setOverrideTiers(
						price.price_unit_tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					// Start with one default tier
					setOverrideTiers([
						{
							unit_amount: initialAmount, // Prefill with original amount
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			} else {
				setOverrideAmount(price.amount);

				// Initialize with original tiers if they exist, otherwise start with one default tier
				if (price.tiers && price.tiers.length > 0) {
					setOverrideTiers(
						price.tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					// Start with one default tier
					setOverrideTiers([
						{
							unit_amount: price.amount, // Prefill with original amount
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			}

			// Prefill transform quantity with original value if it exists
			setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom) {
				setEffectiveFrom(undefined);
			}
		}
	}, [
		price.id,
		overriddenPrices,
		price.billing_model,
		price.tier_mode,
		price.tiers,
		price.amount,
		price.transform_quantity,
		price.price_unit_type,
		price.price_unit_amount,
		price.price_unit_tiers,
		price.price_unit_config,
		showEffectiveFrom,
		isCustomPriceUnit,
	]);

	const handleOverride = () => {
		const override: Partial<ExtendedPriceOverride> = {};

		// Handle amount/price_unit_amount based on price unit type and billing model
		if (overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED') {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_amount
				const originalAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
				if (overrideAmount && removeFormatting(overrideAmount) !== originalAmount) {
					override.price_unit_amount = removeFormatting(overrideAmount);
				}
			} else {
				// For FIAT prices, use amount
				if (overrideAmount && removeFormatting(overrideAmount) !== price.amount) {
					override.amount = removeFormatting(overrideAmount);
				}
			}
		}

		// Quantity can be overridden for any billing model
		if (overrideQuantity !== undefined) {
			override.quantity = overrideQuantity;
		}

		// Billing model override
		if (overrideBillingModel !== price.billing_model) {
			override.billing_model = overrideBillingModel;
		}

		// Tier mode override
		if (overrideTierMode !== (price.tier_mode || TIER_MODE.VOLUME)) {
			override.tier_mode = overrideTierMode;
		}

		// Handle tiers/price_unit_tiers based on price unit type and billing model
		if ((overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && overrideTiers.length > 0) {
			if (isCustomPriceUnit) {
				// For CUSTOM prices, use price_unit_tiers
				override.price_unit_tiers = overrideTiers;
			} else {
				// For FIAT prices, use tiers
				override.tiers = overrideTiers;
			}
		}

		// Only include transform_quantity if billing model is package (same for both types)
		if (overrideBillingModel === BILLING_MODEL.PACKAGE && overrideTransformQuantity !== undefined) {
			override.transform_quantity = overrideTransformQuantity;
		}

		// Include effective_from if showEffectiveFrom is enabled
		if (showEffectiveFrom && effectiveFrom) {
			override.effective_from = effectiveFrom.toISOString();
		}

		if (Object.keys(override).length > 0) {
			onPriceOverride(price.id, override);
		} else {
			onResetOverride(price.id);
		}
		onOpenChange(false);
	};

	const handleReset = () => {
		onResetOverride(price.id);
		setOverrideQuantity(undefined);
		setOverrideBillingModel(price.billing_model);

		// Reset amount and tiers based on price unit type
		if (isCustomPriceUnit) {
			setOverrideAmount(price.price_unit_amount || price.price_unit_config?.amount || '');
			if (price.price_unit_tiers && price.price_unit_tiers.length > 0) {
				setOverrideTiers(
					price.price_unit_tiers.map((tier) => ({
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount || '0',
						up_to: tier.up_to,
					})),
				);
			} else {
				setOverrideTiers([
					{
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
		} else {
			setOverrideAmount(price.amount);
			if (price.tiers && price.tiers.length > 0) {
				setOverrideTiers(
					price.tiers.map((tier) => ({
						unit_amount: tier.unit_amount,
						flat_amount: tier.flat_amount || '0',
						up_to: tier.up_to,
					})),
				);
			} else {
				setOverrideTiers([
					{
						unit_amount: '',
						flat_amount: '0',
						up_to: null,
					},
				]);
			}
		}

		// Reset transform_quantity to original value or default
		setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
		if (showEffectiveFrom) {
			setEffectiveFrom(undefined);
		}
		setIsOverridden(false);
	};

	const handleCancel = () => {
		const currentOverride = overriddenPrices[price.id];
		if (currentOverride) {
			// Restore from override based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(currentOverride.price_unit_amount || price.price_unit_amount || price.price_unit_config?.amount || '');
				setOverrideTiers(currentOverride.price_unit_tiers || price.price_unit_tiers || []);
			} else {
				setOverrideAmount(currentOverride.amount || price.amount);
				setOverrideTiers(currentOverride.tiers || price.tiers || []);
			}
			setOverrideQuantity(currentOverride.quantity);
			setOverrideBillingModel(currentOverride.billing_model || price.billing_model);
			setOverrideTransformQuantity(currentOverride.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom && currentOverride.effective_from) {
				setEffectiveFrom(new Date(currentOverride.effective_from));
			}
		} else {
			// Reset to original values based on price unit type
			if (isCustomPriceUnit) {
				setOverrideAmount(price.price_unit_amount || price.price_unit_config?.amount || '');
				if (price.price_unit_tiers && price.price_unit_tiers.length > 0) {
					setOverrideTiers(
						price.price_unit_tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					setOverrideTiers([
						{
							unit_amount: '',
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			} else {
				setOverrideAmount(price.amount);
				if (price.tiers && price.tiers.length > 0) {
					setOverrideTiers(
						price.tiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
				} else {
					setOverrideTiers([
						{
							unit_amount: '',
							flat_amount: '0',
							up_to: null,
						},
					]);
				}
			}
			setOverrideQuantity(undefined);
			setOverrideBillingModel(price.billing_model);
			// Reset to original transform_quantity or default
			setOverrideTransformQuantity(price.transform_quantity || { divide_by: 1, round: 'up' });
			if (showEffectiveFrom) {
				setEffectiveFrom(undefined);
			}
		}
		onOpenChange(false);
	};

	const hasChanges = () => {
		// Check if billing model has changed (including SLAB_TIERED conversion)
		const originalBillingModel = price.billing_model;
		const originalTierMode = price.tier_mode || TIER_MODE.VOLUME;

		let billingModelChanged = false;
		if (overrideBillingModel === 'SLAB_TIERED' && originalBillingModel === BILLING_MODEL.TIERED && originalTierMode === TIER_MODE.SLAB) {
			billingModelChanged = false; // Same as original
		} else if (
			overrideBillingModel === BILLING_MODEL.TIERED &&
			originalBillingModel === BILLING_MODEL.TIERED &&
			originalTierMode === TIER_MODE.VOLUME
		) {
			billingModelChanged = false; // Same as original
		} else {
			billingModelChanged = overrideBillingModel !== originalBillingModel;
		}

		// Compare amount/price_unit_amount based on price unit type
		let amountChanged = false;
		if (isCustomPriceUnit) {
			const originalAmount = price.price_unit_amount || price.price_unit_config?.amount || '';
			amountChanged = !!(overrideAmount && removeFormatting(overrideAmount) !== originalAmount);
		} else {
			amountChanged = !!(overrideAmount && removeFormatting(overrideAmount) !== price.amount);
		}

		// Compare tiers/price_unit_tiers based on price unit type
		let tiersChanged = false;
		if (isCustomPriceUnit) {
			const originalTiers = price.price_unit_tiers || [];
			if (originalTiers.length === 0 && overrideTiers.length > 0) {
				tiersChanged = true;
			} else if (originalTiers.length > 0) {
				tiersChanged =
					JSON.stringify(overrideTiers) !==
					JSON.stringify(
						originalTiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
			}
		} else {
			const originalTiers = price.tiers || [];
			if (originalTiers.length === 0 && overrideTiers.length > 0) {
				tiersChanged = true;
			} else if (originalTiers.length > 0) {
				tiersChanged =
					JSON.stringify(overrideTiers) !==
					JSON.stringify(
						originalTiers.map((tier) => ({
							unit_amount: tier.unit_amount,
							flat_amount: tier.flat_amount || '0',
							up_to: tier.up_to,
						})),
					);
			}
		}

		return (
			amountChanged ||
			overrideQuantity !== undefined ||
			billingModelChanged ||
			tiersChanged ||
			overrideTransformQuantity !== undefined ||
			(showEffectiveFrom && effectiveFrom !== undefined)
		);
	};

	// Get display amount and symbol based on price unit type
	const getDisplayAmount = () => {
		if (isCustomPriceUnit) {
			return price.price_unit_amount || price.price_unit_config?.amount || price.amount || '0';
		}
		return price.amount || '0';
	};

	const getDisplaySymbol = () => {
		if (isCustomPriceUnit) {
			// Try to get price unit symbol from pricing_unit if available (from PriceResponse)
			// Otherwise fall back to price_unit_config.price_unit or price_unit
			return price.price_unit_config?.price_unit || price.price_unit || price.currency;
		}
		return getCurrencySymbol(price.currency);
	};

	const originalFormatted = formatAmount(getDisplayAmount());
	const displaySymbol = getDisplaySymbol();

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Override Price Configuration'
			description={`Modify the pricing configuration for ${price.meter?.name || price.description || 'this charge'}`}
			className='w-auto min-w-[32rem] max-w-[90vw]'>
			<div className='space-y-6 max-h-[80vh] overflow-y-auto'>
				<div className='space-y-4'>
					{/* Original Price Display */}
					<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
						<div className='text-sm text-gray-600'>Original Price</div>
						<div className='font-medium'>
							{displaySymbol}
							{originalFormatted}
						</div>
					</div>

					{/* Billing Model Override - Only show for USAGE price types */}
					{price.type === PRICE_TYPE.USAGE && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Billing Model</label>
							<Select
								value={overrideBillingModel}
								onChange={(value) => setOverrideBillingModel(value as BILLING_MODEL)}
								options={billingModelOptions}
								placeholder='Select billing model'
							/>
						</div>
					)}

					{/* Amount Override - only show if billing model is not TIERED or SLAB_TIERED */}
					{overrideBillingModel !== BILLING_MODEL.TIERED && overrideBillingModel !== 'SLAB_TIERED' && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>
								Override Amount ({isCustomPriceUnit ? displaySymbol : price.currency})
							</label>
							<Input
								type='formatted-number'
								value={overrideAmount}
								onChange={setOverrideAmount}
								placeholder='Enter new amount (optional)'
								suffix={displaySymbol}
								className='w-full'
							/>
						</div>
					)}

					{/* Tiers Override - only show if billing model is TIERED or SLAB_TIERED */}
					{(overrideBillingModel === BILLING_MODEL.TIERED || overrideBillingModel === 'SLAB_TIERED') && (
						<div className='space-y-2'>
							<label className='text-sm font-medium text-gray-700'>Tiers</label>
							<VolumeTieredPricingForm
								tieredPrices={
									overrideTiers.length > 0
										? overrideTiers.map((tier, index) => {
												// Calculate proper from and up_to values
												let from = 0;
												let up_to = null;

												if (index === 0) {
													from = 0;
													up_to = overrideTiers[0]?.up_to || null;
												} else {
													from = overrideTiers[index - 1]?.up_to || 0;
													up_to = overrideTiers[index]?.up_to || null;
												}

												return {
													from,
													up_to,
													unit_amount: tier.unit_amount || '',
													flat_amount: tier.flat_amount || '0',
												};
											})
										: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }]
								}
								setTieredPrices={(setter) => {
									// Handle both function and direct value cases
									const newTiers =
										typeof setter === 'function'
											? setter(
													overrideTiers.length > 0
														? overrideTiers.map((tier, index) => ({
																from: index === 0 ? 0 : overrideTiers[index - 1]?.up_to || 0,
																up_to: tier.up_to || null,
																unit_amount: tier.unit_amount || '',
																flat_amount: tier.flat_amount || '0',
															}))
														: [{ from: 0, up_to: null, unit_amount: '', flat_amount: '0' }],
												)
											: setter;

									// Convert the PriceTier format to CreatePriceTier format
									// and properly handle the from/up_to values
									const convertedTiers = newTiers.map((tier) => {
										// Use the tier's own up_to value directly
										return {
											unit_amount: tier.unit_amount || '',
											flat_amount: tier.flat_amount || '0',
											up_to: tier.up_to,
										};
									});
									setOverrideTiers(convertedTiers);
								}}
								currency={isCustomPriceUnit ? displaySymbol : price.currency}
								tierMode={overrideBillingModel === BILLING_MODEL.TIERED ? TIER_MODE.VOLUME : TIER_MODE.SLAB}
							/>
						</div>
					)}

					{/* Transform Quantity Override - only show if billing model is PACKAGE */}
					{overrideBillingModel === BILLING_MODEL.PACKAGE && (
						<div className='space-y-4'>
							<label className='text-sm font-medium text-gray-700'>Package Configuration</label>
							<div className='space-y-2'>
								<label className='text-sm text-gray-600'>Units per package</label>
								<Input
									type='number'
									value={overrideTransformQuantity?.divide_by || ''}
									onChange={(value) =>
										setOverrideTransformQuantity({
											...overrideTransformQuantity,
											divide_by: Number(value) || 1,
										})
									}
									placeholder='Enter units per package'
									className='w-full'
								/>
								{/* Show original transform quantity if it exists and is different */}
								{price.transform_quantity && (
									<div className='text-xs text-gray-500'>Original: {price.transform_quantity.divide_by} units per package</div>
								)}
							</div>
						</div>
					)}

					{/* Effective From Date - Only show if showEffectiveFrom is true */}
					{showEffectiveFrom && (
						<div className='space-y-2'>
							<DatePicker
								label='Effective From (Optional)'
								placeholder='Select date for scheduled update'
								date={effectiveFrom}
								setDate={setEffectiveFrom}
								minDate={new Date()}
								className='w-full'
							/>
							<p className='text-xs text-gray-500'>Schedule this price change to take effect on a future date</p>
						</div>
					)}

					{/* Override Summary */}
					{isOverridden && (
						<div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<div className='text-sm text-blue-700'>This price has been overridden. Review the changes above.</div>
						</div>
					)}
				</div>

				<div className='flex gap-3 pt-4'>
					<Button variant='outline' onClick={handleCancel} className='flex-1'>
						Cancel
					</Button>
					{isOverridden && (
						<Button variant='outline' onClick={handleReset} className='flex-1'>
							Reset
						</Button>
					)}
					<Button onClick={handleOverride} className='flex-1' disabled={!hasChanges()}>
						{isOverridden ? 'Update Override' : 'Override Price'}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default PriceOverrideDialog;
