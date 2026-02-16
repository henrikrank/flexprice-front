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
	/** When true (e.g. price.entity_type === SUBSCRIPTION), show orange icon and "Overridden price" content */
	isSubscriptionOverride?: boolean;
}

// ===== SUB-COMPONENTS =====

/**
 * Display tier breakdown in tooltip (Volume/Slab header + per unit, flat fee like ChargeValueCell)
 */
const TierBreakdown: FC<{
	normalized: NormalizedPriceDisplay;
	hasOverrides?: boolean;
}> = ({ normalized, hasOverrides }) => {
	const { tiers, tierMode, symbol } = normalized;

	if (!tiers || tiers.length === 0) return null;

	const formatRange = (tier: CreatePriceTier, index: number, allTiers: CreatePriceTier[]) => {
		const from = index === 0 ? 0 : allTiers[index - 1]?.up_to || 0;
		if (tier.up_to === null || tier.up_to === undefined || index === allTiers.length - 1) {
			return `${from} - ∞`;
		}
		return `${from} - ${tier.up_to}`;
	};

	return (
		<div className='space-y-3'>
			<div className='font-medium border-b border-gray-200 pb-2 text-base text-gray-900'>
				{tierMode === TIER_MODE.VOLUME ? 'Volume' : 'Slab'} Tier Pricing
				{hasOverrides && <span className='text-xs text-orange-600 ml-2'>(Overridden)</span>}
			</div>
			<div className='space-y-2'>
				{tiers.map((tier, index) => (
					<div key={index} className='flex flex-col gap-1'>
						<div className='flex items-center justify-between gap-6'>
							<div className='text-sm text-muted-foreground'>{formatRange(tier, index, tiers)} units</div>
							<div className='text-right'>
								<div className='text-sm text-muted-foreground'>
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
	);
};

/**
 * Display override changes (billing model, tier mode, amount, quantity, package size, tier diff - same as ChargeValueCell)
 */
const OverrideChanges: FC<{
	original: NormalizedPriceDisplay;
	overridden: NormalizedPriceDisplay;
	originalPrice: Price;
}> = ({ original, overridden, originalPrice }) => {
	const changes: string[] = [];

	// Billing model changes
	if (overridden.billingModel !== original.billingModel) {
		changes.push(`Billing Model: ${getBillingModelLabel(original.billingModel)} → ${getBillingModelLabel(overridden.billingModel)}`);
	}

	// Tier mode changes
	if (overridden.tierMode !== original.tierMode) {
		changes.push(`Tier Mode: ${getTierModeLabel(original.tierMode)} → ${getTierModeLabel(overridden.tierMode)}`);
	}

	// Amount changes
	if (overridden.amount !== original.amount) {
		changes.push(`Amount: ${original.symbol}${formatAmount(original.amount)} → ${overridden.symbol}${formatAmount(overridden.amount)}`);
	}

	// Quantity changes - only show if original price was usage-based
	const quantityOverride = (overridden as any).quantity;
	if (quantityOverride && quantityOverride !== 1 && originalPrice.type === PRICE_TYPE.USAGE) {
		changes.push(`Quantity: 1 → ${quantityOverride}`);
	}

	// Transform quantity (package size) changes
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

	// Tier changes (full diff: From, Up to, Per unit, Flat fee)
	if (overridden.tiers && overridden.tiers.length > 0) {
		const originalTiers = original.tiers || [];
		const newTiers = overridden.tiers;

		if (originalTiers.length !== newTiers.length) {
			changes.push(`Tiers: ${originalTiers.length} tiers → ${newTiers.length} tiers`);
		} else {
			const tierChanges: string[] = [];
			newTiers.forEach((newTier: CreatePriceTier, index: number) => {
				const originalTier = originalTiers[index];
				if (originalTier) {
					const tierChangesForThisTier: string[] = [];

					// From value changes
					const originalFrom = index === 0 ? 0 : originalTiers[index - 1]?.up_to || 0;
					const newFrom = index === 0 ? 0 : newTiers[index - 1]?.up_to || 0;
					if (originalFrom !== newFrom) {
						tierChangesForThisTier.push(`From (>): ${originalFrom} → ${newFrom}`);
					}

					// Up to value changes
					const originalUpTo = originalTier.up_to;
					const newUpTo = newTier.up_to;
					if (originalUpTo !== newUpTo) {
						const originalUpToDisplay = originalUpTo === null || originalUpTo === undefined ? '∞' : originalUpTo.toString();
						const newUpToDisplay = newUpTo === null || newUpTo === undefined ? '∞' : newUpTo.toString();
						tierChangesForThisTier.push(`Up to (<=): ${originalUpToDisplay} → ${newUpToDisplay}`);
					}

					// Per unit price changes
					if (originalTier.unit_amount !== newTier.unit_amount) {
						tierChangesForThisTier.push(
							`Per unit price: ${overridden.symbol}${formatAmount(originalTier.unit_amount)} → ${overridden.symbol}${formatAmount(newTier.unit_amount)}`,
						);
					}

					// Flat amount changes
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

	if (changes.length === 0) {
		changes.push('Price configuration modified');
	}

	return (
		<div className='space-y-2'>
			{changes.map((change, index) => {
				// Check if this is a tier change that should be formatted
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
	);
};

/**
 * Main tooltip content component
 */
const PriceTooltipContent: FC<{
	normalized: NormalizedPriceDisplay;
	hasOverrides: boolean;
	hasDiscount: boolean;
	discountInfo: ReturnType<typeof calculateDiscountedPrice> | null;
	couponName?: string;
	originalNormalized?: NormalizedPriceDisplay;
	originalPrice?: Price;
	isSubscriptionOverride?: boolean;
}> = ({ normalized, hasOverrides, hasDiscount, discountInfo, couponName, originalNormalized, originalPrice, isSubscriptionOverride }) => {
	const isTiered =
		(normalized.billingModel === BILLING_MODEL.TIERED || normalized.billingModel === 'SLAB_TIERED') &&
		Array.isArray(normalized.tiers) &&
		normalized.tiers.length > 0;

	return (
		<TooltipContent
			sideOffset={5}
			className='bg-white border border-gray-200 shadow-lg text-sm text-gray-900 px-4 py-3 rounded-lg max-w-[320px]'>
			<div className='space-y-3'>
				{/* Subscription override: Overridden price + same amount/data as standard display */}
				{isSubscriptionOverride && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>Overridden price</div>
						{isTiered ? (
							<TierBreakdown normalized={normalized} hasOverrides={false} />
						) : (
							<div className='text-sm text-gray-900'>
								{normalized.billingModel === BILLING_MODEL.FLAT_FEE
									? `${normalized.symbol}${formatAmount(normalized.amount)} / unit`
									: formatPriceDisplay(normalized)}
							</div>
						)}
					</div>
				)}

				{/* Discount Information */}
				{!isSubscriptionOverride && hasDiscount && discountInfo && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>Price</div>
						<div className='space-y-1'>
							<div className='line-through text-gray-400 text-sm'>
								{normalized.symbol}
								{formatAmount(discountInfo.originalAmount.toString())}
							</div>
							<div className='text-gray-900 font-medium'>
								{normalized.symbol}
								{formatAmount(discountInfo.discountedAmount.toString())}
							</div>
							{couponName && <div className='text-xs text-gray-500 mt-1'>{couponName}</div>}
						</div>
					</div>
				)}

				{/* Override Changes */}
				{!isSubscriptionOverride && hasOverrides && !isTiered && originalNormalized && originalPrice && (
					<div className='space-y-2'>
						<div className='font-medium text-gray-900'>Price Override Applied</div>
						<OverrideChanges original={originalNormalized} overridden={normalized} originalPrice={originalPrice} />
					</div>
				)}

				{/* Tier Breakdown (Volume/Slab header + per unit, flat fee) */}
				{!isSubscriptionOverride && isTiered && (
					<div className='space-y-2'>
						<TierBreakdown normalized={normalized} hasOverrides={hasOverrides} />
					</div>
				)}

				{/* Simple Price Display: Flat Fee = X / unit, Package = X / N units, else formatPriceDisplay */}
				{!isSubscriptionOverride && !hasDiscount && !hasOverrides && !isTiered && (
					<div className='space-y-1'>
						<div className='font-medium text-gray-900'>Price</div>
						<div className='text-sm text-gray-900'>
							{normalized.billingModel === BILLING_MODEL.FLAT_FEE
								? `${normalized.symbol}${formatAmount(normalized.amount)} / unit`
								: formatPriceDisplay(normalized)}
						</div>
					</div>
				)}
			</div>
		</TooltipContent>
	);
};

// ===== MAIN COMPONENT =====

const PriceTooltip: FC<Props> = ({ data, appliedCoupon, priceOverride, isSubscriptionOverride }) => {
	// Step 1: Normalize the data
	const originalNormalized = normalizePriceDisplay(data);
	const overriddenNormalized = priceOverride ? normalizePriceDisplay(data, priceOverride) : null;

	// Step 2: Determine what to display
	const displayData = overriddenNormalized || originalNormalized;
	const hasOverrides = !!overriddenNormalized;

	// Step 3: Handle coupon discount
	// Coupons and overrides are mutually exclusive - only apply coupon if no override exists
	const discountInfo = appliedCoupon && !priceOverride ? calculateDiscountedPrice(data, appliedCoupon) : null;
	const hasDiscount = !!discountInfo;
	const couponName = appliedCoupon ? formatCouponName(appliedCoupon) : undefined;

	// Step 4: Determine icon color (orange for override or subscription override, blue for discount, gray default)
	const iconColor = hasOverrides || isSubscriptionOverride ? 'text-orange-600' : hasDiscount ? 'text-blue-500' : 'text-gray-500';

	// Step 5: Render
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger>
					<Info className={cn(iconColor, 'h-4 w-4 hover:opacity-80 transition-colors duration-150')} />
				</TooltipTrigger>
				<PriceTooltipContent
					normalized={displayData}
					hasOverrides={hasOverrides}
					hasDiscount={hasDiscount}
					discountInfo={discountInfo}
					couponName={couponName}
					originalNormalized={hasOverrides ? originalNormalized : undefined}
					originalPrice={hasOverrides ? data : undefined}
					isSubscriptionOverride={isSubscriptionOverride}
				/>
			</Tooltip>
		</TooltipProvider>
	);
};

export default PriceTooltip;
