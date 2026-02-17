import { FC, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ColumnData, FlexpriceTable, LineItemCoupon } from '@/components/molecules';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import CommitmentConfigDialog from '@/components/molecules/CommitmentConfigDialog';
import { Price, PRICE_TYPE } from '@/models';
import { ChevronDownIcon, ChevronUpIcon, Pencil, RotateCcw, Tag, Target } from 'lucide-react';
import { FormHeader, DecimalUsageInput } from '@/components/atoms';
import { ChargeValueCell } from '@/components/molecules';
import { capitalize } from 'es-toolkit';
import { Coupon } from '@/models';
import { BsThreeDots } from 'react-icons/bs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui';
import { ExtendedPriceOverride } from '@/utils';
import { LineItemCommitmentConfig } from '@/types/dto/LineItemCommitmentConfig';

const DEFAULT_ROW_LIMIT = 5;

const CHARGES_TABLE_COLUMNS: ColumnData<ChargeTableData>[] = [
	{ fieldName: 'charge', title: 'Charge' },
	{ title: 'Billing Period', render: (data) => capitalize(data.invoice_cadence) || '--' },
	{ fieldName: 'quantity', title: 'Quantity' },
	{ fieldName: 'price', title: 'Price' },
	{
		fieldName: 'actions',
		title: '',
		width: 50,
		align: 'center',
		fieldVariant: 'interactive',
	},
];

type ChargeTableData = {
	priceId: string;
	charge: ReactNode;
	quantity: ReactNode;
	price: ReactNode;
	invoice_cadence: string;
	actions?: ReactNode;
};

interface PriceActionMenuProps {
	price: Price;
	isOverridden: boolean;
	hasCommitment: boolean;
	onOverride: (price: Price) => void;
	onReset: (priceId: string) => void;
	onCommitment: (price: Price) => void;
	onOpenCoupon: (priceId: string) => void;
}

const PriceActionMenu: FC<PriceActionMenuProps> = ({
	price,
	isOverridden,
	hasCommitment,
	onOverride,
	onReset,
	onCommitment,
	onOpenCoupon,
}) => {
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	return (
		<div
			data-interactive='true'
			onClick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				setIsDropdownOpen(!isDropdownOpen);
			}}>
			<DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<button>
						<BsThreeDots className='text-base size-4' />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='end' className='w-48'>
					<DropdownMenuItem onClick={() => onOverride(price)}>
						<Pencil className='mr-2 h-4 w-4' />
						{isOverridden ? 'Edit Override' : 'Override Price'}
					</DropdownMenuItem>
					{isOverridden && (
						<DropdownMenuItem onClick={() => onReset(price.id)}>
							<RotateCcw className='mr-2 h-4 w-4' />
							Reset Override
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => onCommitment(price)}>
						<Target className='mr-2 h-4 w-4' />
						{hasCommitment ? 'Edit Commitment' : 'Configure Commitment'}
					</DropdownMenuItem>
					{!isOverridden && (
						<DropdownMenuItem onClick={() => onOpenCoupon(price.id)}>
							<Tag className='mr-2 h-4 w-4' />
							Apply Coupon
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

interface PriceQuantityCellProps {
	price: Price;
	override?: ExtendedPriceOverride;
	lineItemCoupon: Coupon | null | undefined;
	quantityInput: string | undefined;
	disabled: boolean;
	/** Pass string to set transient input (including '' for empty); pass null to clear transient after commit. */
	onQuantityChange: (value: string | null) => void;
	onResetOverride: (priceId: string) => void;
	onPriceOverride: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onClearCoupon: (priceId: string) => void;
}

const PriceQuantityCell: FC<PriceQuantityCellProps> = ({
	price,
	override,
	lineItemCoupon,
	quantityInput,
	disabled,
	onQuantityChange,
	onResetOverride,
	onPriceOverride,
	onClearCoupon,
}) => {
	if (price.type !== PRICE_TYPE.FIXED) {
		return <>pay as you go</>;
	}

	const minQuantity = price.min_quantity ?? 1;
	const currentQuantity = override?.quantity ?? minQuantity;
	const displayQuantity = quantityInput ?? currentQuantity.toString();

	return (
		<div className='w-20' data-interactive='true'>
			<DecimalUsageInput
				value={displayQuantity}
				onChange={(value) => {
					if (value === '') {
						onQuantityChange('');
						return;
					}
					const quantity = parseInt(value, 10) || minQuantity;

					if (quantity === minQuantity) {
						if (override && Object.keys(override).length === 2 && override.price_id && override.quantity) {
							onResetOverride(price.id);
						} else if (override) {
							const { quantity: _q, ...rest } = override;
							onPriceOverride(price.id, rest);
						}
					} else {
						if (lineItemCoupon) onClearCoupon(price.id);
						onPriceOverride(price.id, { quantity });
					}
					onQuantityChange(value === quantity.toString() ? null : value);
				}}
				placeholder={minQuantity.toString()}
				disabled={disabled}
				precision={0}
			/>
		</div>
	);
};

export interface Props {
	data: Price[];
	/** Used for filtering and dialog context (e.g. commitment). */
	billingPeriod?: string;
	/** Used for filtering and LineItemCoupon. */
	currency?: string;
	onPriceOverride?: (priceId: string, override: Partial<ExtendedPriceOverride>) => void;
	onResetOverride?: (priceId: string) => void;
	overriddenPrices?: Record<string, ExtendedPriceOverride>;
	lineItemCoupons?: Record<string, Coupon>;
	onLineItemCouponsChange?: (priceId: string, coupon: Coupon | null) => void;
	onCommitmentChange?: (priceId: string, config: LineItemCommitmentConfig | null) => void;
	disabled?: boolean;
	subscriptionLevelCoupon?: Coupon | null;
}

const SubscriptionPriceTable: FC<Props> = ({
	data,
	billingPeriod,
	currency,
	onPriceOverride,
	onResetOverride,
	overriddenPrices = {},
	lineItemCoupons = {},
	onLineItemCouponsChange,
	onCommitmentChange,
	disabled = false,
	subscriptionLevelCoupon = null,
}) => {
	const [showAllRows, setShowAllRows] = useState(false);
	const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedCommitmentPrice, setSelectedCommitmentPrice] = useState<Price | null>(null);
	const [isCommitmentDialogOpen, setIsCommitmentDialogOpen] = useState(false);
	const [couponModalState, setCouponModalState] = useState<{ isOpen: boolean; priceId: string | null }>({
		isOpen: false,
		priceId: null,
	});
	const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

	const filteredPrices = useMemo(() => {
		let filtered = data;
		if (billingPeriod) {
			filtered = filtered.filter((p) => p.billing_period.toLowerCase() === billingPeriod.toLowerCase());
		}
		if (currency) {
			filtered = filtered.filter((p) => p.currency.toLowerCase() === currency.toLowerCase());
		}
		return filtered;
	}, [data, billingPeriod, currency]);

	const handleOverride = (price: Price) => {
		if (lineItemCoupons[price.id]) {
			onLineItemCouponsChange?.(price.id, null);
		}
		setSelectedPrice(price);
		setIsDialogOpen(true);
	};

	const handleConfigureCommitment = (price: Price) => {
		setSelectedCommitmentPrice(price);
		setIsCommitmentDialogOpen(true);
	};

	const setQuantityInput = (priceId: string, value: string | null) => {
		setQuantityInputs((prev) => {
			const next = { ...prev };
			if (value === null) delete next[priceId];
			else next[priceId] = value;
			return next;
		});
	};

	const mappedData = useMemo<ChargeTableData[]>(() => {
		return (filteredPrices ?? []).map((price) => {
			const isOverridden = overriddenPrices[price.id] !== undefined;
			const appliedCoupon = lineItemCoupons[price.id];
			const override = overriddenPrices[price.id];

			return {
				priceId: price.id,
				charge: (
					<div>
						<div>{price.display_name || price.meter?.name || 'Charge'}</div>
					</div>
				),
				quantity: (
					<PriceQuantityCell
						price={price}
						override={override}
						lineItemCoupon={appliedCoupon}
						quantityInput={quantityInputs[price.id]}
						disabled={disabled}
						onQuantityChange={(value) => setQuantityInput(price.id, value ?? '')}
						onResetOverride={(id) => onResetOverride?.(id)}
						onPriceOverride={(id, o) => onPriceOverride?.(id, o)}
						onClearCoupon={(id) => onLineItemCouponsChange?.(id, null)}
					/>
				),
				price: <ChargeValueCell data={price} appliedCoupon={appliedCoupon} priceOverride={isOverridden ? override : undefined} />,
				invoice_cadence: price.invoice_cadence,
				actions: (
					<PriceActionMenu
						price={price}
						isOverridden={isOverridden}
						hasCommitment={override?.commitment !== undefined}
						onOverride={handleOverride}
						onReset={(id) => onResetOverride?.(id)}
						onCommitment={handleConfigureCommitment}
						onOpenCoupon={(id) => setCouponModalState({ isOpen: true, priceId: id })}
					/>
				),
			};
		});
	}, [
		filteredPrices,
		overriddenPrices,
		lineItemCoupons,
		quantityInputs,
		disabled,
		onPriceOverride,
		onResetOverride,
		onLineItemCouponsChange,
	]);

	const displayedData = showAllRows ? mappedData : mappedData.slice(0, DEFAULT_ROW_LIMIT);
	const hasMore = mappedData.length > DEFAULT_ROW_LIMIT;

	return (
		<div className='space-y-4'>
			<div>
				<FormHeader title='Charges' variant='sub-header' />
			</div>
			<div className='rounded-[6px] border border-gray-300'>
				<div style={{ overflow: 'hidden' }}>
					<FlexpriceTable columns={CHARGES_TABLE_COLUMNS} data={displayedData} />
				</div>
			</div>
			{hasMore && (
				<div className='flex justify-center mt-3'>
					<button
						onClick={() => setShowAllRows((prev) => !prev)}
						className='flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors py-2 px-3 rounded-[6px] hover:bg-gray-50'>
						{showAllRows ? (
							<>
								<span>Show less</span>
								<ChevronUpIcon className='w-4 h-4' />
							</>
						) : (
							<>
								<span>Show {mappedData.length - DEFAULT_ROW_LIMIT} more</span>
								<ChevronDownIcon className='w-4 h-4' />
							</>
						)}
					</button>
				</div>
			)}

			{selectedPrice && onPriceOverride && onResetOverride && (
				<PriceOverrideDialog
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					price={selectedPrice}
					onPriceOverride={onPriceOverride}
					onResetOverride={onResetOverride}
					overriddenPrices={overriddenPrices}
				/>
			)}

			{selectedCommitmentPrice && (
				<CommitmentConfigDialog
					isOpen={isCommitmentDialogOpen}
					onOpenChange={setIsCommitmentDialogOpen}
					price={selectedCommitmentPrice}
					onSave={(priceId, config) => onCommitmentChange?.(priceId, config)}
					currentConfig={overriddenPrices[selectedCommitmentPrice.id]?.commitment}
					billingPeriod={billingPeriod}
				/>
			)}

			{couponModalState.priceId && !overriddenPrices[couponModalState.priceId] && (
				<LineItemCoupon
					priceId={couponModalState.priceId}
					currency={currency}
					selectedCoupon={lineItemCoupons[couponModalState.priceId]}
					onChange={(priceId, coupon) => {
						onLineItemCouponsChange?.(priceId, coupon);
						setCouponModalState({ isOpen: false, priceId: null });
					}}
					disabled={disabled}
					showAddButton={true}
					isModalOpen={couponModalState.isOpen}
					onModalClose={() => setCouponModalState({ isOpen: false, priceId: null })}
					allLineItemCoupons={lineItemCoupons}
					subscriptionLevelCoupons={subscriptionLevelCoupon ? [subscriptionLevelCoupon] : []}
				/>
			)}
		</div>
	);
};

export default SubscriptionPriceTable;
