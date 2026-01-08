import { FC } from 'react';
import { BILLING_MODEL, Price, PRICE_TYPE, TIER_MODE, CreatePriceTier } from '@/models';
import { PriceUnit } from '@/models/PriceUnit';
import {
	normalizePriceDisplay,
	calculateDiscountedPrice,
	formatPriceDisplay,
	getBillingModelLabel,
	getTierModeLabel,
	NormalizedPriceDisplay,
} from '@/utils';
import { Info } from 'lucide-react';
import { formatAmount } from '@/components/atoms/Input/Input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { Coupon } from '@/models';
import { formatCouponName } from '@/utils';
import { ExtendedPriceOverride } from '@/utils';
import { cn } from '@/lib/utils';

interface Props {
	data: Price & { pricing_unit?: PriceUnit };
	appliedCoupon?: Coupon | null;
	priceOverride?: ExtendedPriceOverride;
}

// ===== SUB-COMPONENTS =====

/**
 * Display discounted price with strikethrough original
 */
const DiscountedPriceDisplay: FC<{
	originalAmount: number;
	discountedAmount: number;
	symbol: string;
	couponName: string;
}> = ({ originalAmount, discountedAmount, symbol, couponName }) => (
	<div className='flex items-center gap-2'>
		<div className='flex flex-col'>
			<div className='line-through text-gray-400 text-sm'>
				{symbol}
				{formatAmount(originalAmount.toString())}
			</div>
			<div className='text-gray-900 font-medium'>
				{symbol}
				{formatAmount(discountedAmount.toString())}
			</div>
		</div>
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className='h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors duration-150' />
				</TooltipTrigger>
				<TooltipContent sideOffset={5} className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-3 py-2 rounded-lg'>
					<div className='font-medium'>{couponName}</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</div>
);

/**
 * Display override changes in a tooltip
 */
const OverrideTooltip: FC<{
	original: NormalizedPriceDisplay;
	overridden: NormalizedPriceDisplay;
	originalPrice: Price;
}> = ({ original, overridden, originalPrice }) => {
	const changes: string[] = [];

	// Check for billing model changes
	if (overridden.billingModel !== original.billingModel) {
		changes.push(`Billing Model: ${getBillingModelLabel(original.billingModel)} → ${getBillingModelLabel(overridden.billingModel)}`);
	}

	// Check for tier mode changes
	if (overridden.tierMode !== original.tierMode) {
		changes.push(`Tier Mode: ${getTierModeLabel(original.tierMode)} → ${getTierModeLabel(overridden.tierMode)}`);
	}

	// Check for amount changes
	if (overridden.amount !== original.amount) {
		changes.push(`Amount: ${original.symbol}${formatAmount(original.amount)} → ${overridden.symbol}${formatAmount(overridden.amount)}`);
	}

	// Check for quantity changes - only show if original price was usage-based
	const quantityOverride = (overridden as any).quantity;
	if (quantityOverride && quantityOverride !== 1 && originalPrice.type === PRICE_TYPE.USAGE) {
		changes.push(`Quantity: 1 → ${quantityOverride}`);
	}

	// Check for transform quantity changes
	if (
		overridden.transformQuantity &&
		(original.billingModel === BILLING_MODEL.PACKAGE || overridden.billingModel === BILLING_MODEL.PACKAGE)
	) {
		const originalDivideBy = original.transformQuantity?.divide_by || 1;
		const newDivideBy = overridden.transformQuantity.divide_by;
		if (originalDivideBy !== newDivideBy) {
			changes.push(`Package Size: ${originalDivideBy} units → ${newDivideBy} units`);
		}
	}

	// Check for tier changes
	if (overridden.tiers && overridden.tiers.length > 0) {
		const originalTiers = original.tiers || [];
		const newTiers = overridden.tiers;

		// If tier count changed, show the change
		if (originalTiers.length !== newTiers.length) {
			changes.push(`Tiers: ${originalTiers.length} tiers → ${newTiers.length} tiers`);
		} else {
			// Show detailed tier changes
			const tierChanges: string[] = [];
			newTiers.forEach((newTier: CreatePriceTier, index: number) => {
				const originalTier = originalTiers[index];
				if (originalTier) {
					const tierChangesForThisTier: string[] = [];

					// Check From value changes
					const originalFrom = index === 0 ? 0 : originalTiers[index - 1]?.up_to || 0;
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					if (originalFrom !== newFrom) {
						tierChangesForThisTier.push(`From (>): ${originalFrom} → ${newFrom}`);
					}

					// Check Up to value changes
					const originalUpTo = originalTier.up_to;
					const newUpTo = newTier.up_to;
					if (originalUpTo !== newUpTo) {
						const originalUpToDisplay = originalUpTo === null || originalUpTo === undefined ? '∞' : originalUpTo.toString();
						const newUpToDisplay = newUpTo === null || newUpTo === undefined ? '∞' : newUpTo.toString();
						tierChangesForThisTier.push(`Up to (<=): ${originalUpToDisplay} → ${newUpToDisplay}`);
					}

					// Check unit amount changes
					if (originalTier.unit_amount !== newTier.unit_amount) {
						tierChangesForThisTier.push(
							`Per unit price: ${overridden.symbol}${formatAmount(originalTier.unit_amount)} → ${overridden.symbol}${formatAmount(newTier.unit_amount)}`,
						);
					}

					// Check flat amount changes
					if ((originalTier.flat_amount || '0') !== (newTier.flat_amount || '0')) {
						tierChangesForThisTier.push(
							`Flat fee: ${overridden.symbol}${formatAmount(originalTier.flat_amount || '0')} → ${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`,
						);
					}

					if (tierChangesForThisTier.length > 0) {
						tierChanges.push(`Tier ${index + 1}: ${tierChangesForThisTier.join(', ')}`);
					}
				} else {
					// New tier added
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					const newUpToDisplay = newTier.up_to === null || newTier.up_to === undefined ? '∞' : newTier.up_to.toString();
					tierChanges.push(
						`Tier ${index + 1} added: From (>): ${newFrom}, Up to (<=): ${newUpToDisplay}, Per unit price: ${overridden.symbol}${formatAmount(newTier.unit_amount)}, Flat fee: ${overridden.symbol}${formatAmount(newTier.flat_amount || '0')}`,
					);
				}
			});

			if (tierChanges.length > 0) {
				changes.push(...tierChanges);
			} else {
				changes.push('Tier structure modified');
			}
		}
	}

	// If no specific changes detected, show generic message
	if (changes.length === 0) {
		changes.push('Price configuration modified');
	}

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className='h-4 w-4 text-orange-600 hover:text-orange-600 transition-colors duration-150' />
				</TooltipTrigger>
				<TooltipContent
					sideOffset={5}
					className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[300px]'>
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>Price Override Applied</div>
						{changes.map((change, index) => {
							// Check if this is a tier change that should be formatted as a table
							if (change.startsWith('Tier ') && change.includes(':')) {
								const tierInfo = change.split(': ');
								const tierHeader = tierInfo[0];
								const tierDetails = tierInfo[1];

								return (
									<div key={index} className='text-sm text-gray-600 space-y-1'>
										<div className='font-medium'>{tierHeader}:</div>
										<div className='ml-2 space-y-1'>
											{tierDetails.split(', ').map((detail, detailIndex) => (
												<div key={detailIndex} className='text-xs'>
													• {detail}
												</div>
											))}
										</div>
									</div>
								);
							}

							// Regular change format
							return (
								<div key={index} className='text-sm text-gray-600'>
									• {change}
								</div>
							);
						})}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

/**
 * Display tiered pricing breakdown in a tooltip
 */
const TieredPricingTooltip: FC<{
	normalized: NormalizedPriceDisplay;
	hasOverrides: boolean;
}> = ({ normalized, hasOverrides }) => {
	const { tiers, tierMode, symbol } = normalized;

	if (!tiers || tiers.length === 0) return null;

	const formatRange = (tier: CreatePriceTier, index: number, allTiers: CreatePriceTier[]) => {
		// For the first tier, start from 0
		const from = index === 0 ? 0 : allTiers[index - 1]?.up_to || 0;

		// If up_to is null or this is the last tier, show infinity
		if (tier.up_to === null || tier.up_to === undefined || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}

		// Otherwise show the actual range
		return `${from} - ${tier.up_to}`;
	};

	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className={cn(hasOverrides && 'text-orange-600', 'h-4 w-4  transition-colors duration-150')} />
				</TooltipTrigger>
				<TooltipContent
					sideOffset={5}
					className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
					<div className='space-y-3'>
						<div className='font-medium border-b border-spacing-1 border-gray-200 pb-2 text-base text-gray-900'>
							{tierMode === TIER_MODE.VOLUME ? 'Volume' : 'Slab'} Tier Pricing
							{hasOverrides && <span className='text-xs text-orange-600 ml-2'>(Overridden)</span>}
						</div>
						<div className='space-y-2'>
							{tiers.map((tier, index) => (
								<div key={index} className='flex flex-col gap-1'>
									<div className='flex items-center justify-between gap-6'>
										<div className='!font-normal text-muted-foreground'>{formatRange(tier, index, tiers)} units</div>
										<div className='text-right'>
											<div className='!font-normal text-muted-foreground'>
												{symbol}
												{formatAmount(tier.unit_amount)} per unit
											</div>
											{Number(tier.flat_amount) > 0 && (
												<div className='text-xs text-gray-500'>
													+ {symbol}
													{formatAmount(tier.flat_amount || '0')} flat fee
												</div>
											)}
										</div>
									</div>
									{index < tiers.length - 1 && <div className='h-px bg-gray-100' />}
								</div>
							))}
						</div>
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

// ===== MAIN COMPONENT =====

const ChargeValueCell: FC<Props> = ({ data, appliedCoupon, priceOverride }) => {
	// Step 1: Normalize the data
	const originalNormalized = normalizePriceDisplay(data);
	const overriddenNormalized = priceOverride ? normalizePriceDisplay(data, priceOverride) : null;

	// Step 2: Determine what to display
	const displayData = overriddenNormalized || originalNormalized;
	const hasOverrides = !!overriddenNormalized;

	// Step 3: Check if this is a tiered price
	const isTiered =
		(displayData.billingModel === BILLING_MODEL.TIERED || displayData.billingModel === 'SLAB_TIERED') &&
		Array.isArray(displayData.tiers) &&
		displayData.tiers.length > 0;

	// Step 4: Handle coupon discount (separate concern)
	// Coupons and overrides are mutually exclusive - only apply coupon if no override exists
	const discountInfo = appliedCoupon && !priceOverride ? calculateDiscountedPrice(data, appliedCoupon) : null;

	// Step 5: Render
	return (
		<div className='flex items-center gap-2'>
			{/* Discounted Price Display */}
			{discountInfo ? (
				<DiscountedPriceDisplay
					originalAmount={discountInfo.originalAmount}
					discountedAmount={discountInfo.discountedAmount}
					symbol={displayData.symbol}
					couponName={appliedCoupon ? formatCouponName(appliedCoupon) : 'No coupon applied'}
				/>
			) : (
				/* Main Price Display */
				<div>{formatPriceDisplay(displayData)}</div>
			)}

			{/* Override Indicator Tooltip - only for non-tiered prices */}
			{hasOverrides && !isTiered && overriddenNormalized && (
				<OverrideTooltip original={originalNormalized} overridden={overriddenNormalized} originalPrice={data} />
			)}

			{/* Tiered Pricing Tooltip - combines override indicator if applicable */}
			{isTiered && <TieredPricingTooltip normalized={displayData} hasOverrides={hasOverrides} />}
		</div>
	);
};

export default ChargeValueCell;
