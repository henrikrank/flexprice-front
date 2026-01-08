import { FC } from 'react';
import { cn } from '@/lib/utils';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Input, DecimalUsageInput } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { PriceTier } from './UsagePricingForm';
import { AddChargesButton } from './SetupChargesSection';
import { TIER_MODE } from '@/models/Price';

interface Props {
	tieredPrices: PriceTier[];
	setTieredPrices: React.Dispatch<React.SetStateAction<PriceTier[]>>;
	currency?: string;
	tierMode?: TIER_MODE;
}

const formatNumber = (value: string): number | null => {
	if (value.trim() === '') {
		return null;
	}
	// Support decimal values for tier boundaries
	const numericString = value.replace(/[^0-9.]/g, '');
	const numValue = parseFloat(numericString);
	return isNaN(numValue) ? null : numValue;
};

const validateDecimal = (value: string): boolean => {
	if (value.trim() === '') {
		return true; // Allow empty values for validation to be handled elsewhere
	}
	const decimalRegex = /^\d*\.?\d*$/;
	return decimalRegex.test(value);
};

// Helper function to get display symbol for currency or price unit
const getDisplaySymbol = (value?: string): string => {
	if (!value) return '';
	// Check if it's a currency code (3 uppercase letters)
	const isCurrencyCode = /^[A-Z]{3}$/.test(value);

	if (isCurrencyCode) {
		// Try to get currency symbol
		const symbol = getCurrencySymbol(value);
		// If getCurrencySymbol returns a symbol (different from input), use it
		// Otherwise, it might be a custom price unit that looks like a currency code
		// In that case, we'll still try to use getCurrencySymbol which will return the code if not found
		return symbol;
	}
	// Otherwise, it's a custom price unit code - display as-is
	return value;
};

const VolumeTieredPricingForm: FC<Props> = ({ setTieredPrices, tieredPrices, currency }) => {
	const addTieredPrice = () => {
		setTieredPrices((prev) => {
			const lastTier = prev[prev.length - 1];

			if (lastTier.up_to === null) {
				prev[prev.length - 1] = { ...lastTier, up_to: lastTier.from + 1 };
			}
			const newFrom = lastTier.up_to ?? lastTier.from + 1;

			const newTier = {
				from: newFrom,
				up_to: null,
				unit_amount: '',
				flat_amount: '0',
			};
			return [...prev, newTier];
		});
	};

	// Remove a tier
	const removeTier = (index: number) => {
		if (index === 0 && tieredPrices.length === 1) {
			return;
		}
		setTieredPrices((prev) => {
			const updatedTiers = prev.filter((_, i) => i !== index);
			if (updatedTiers.length > 0 && index === prev.length - 1) {
				updatedTiers[updatedTiers.length - 1].up_to = null;
			}
			return updatedTiers;
		});
	};

	// Update a tier value
	const updateTier = (index: number, key: string, value: string) => {
		const newValue = formatNumber(value);
		setTieredPrices((prev) => {
			const updatedTiers = [...prev];
			if (newValue !== null) {
				updatedTiers[index] = { ...updatedTiers[index], [key]: newValue };

				// Adjust the 'from' and 'up_to' values based on the tier being updated
				if (key === 'up_to' && index < prev.length - 1) {
					// If 'up_to' is updated, adjust the 'from' value of the next tier
					const nextTier = updatedTiers[index + 1];
					nextTier.from = newValue;
				}

				if (key === 'from' && index > 0) {
					// If 'from' is updated, adjust the 'up_to' value of the previous tier
					const previousTier = updatedTiers[index - 1];
					previousTier.up_to = newValue;
				}
			} else {
				updatedTiers[index] = { ...updatedTiers[index], [key]: '' };
			}
			return updatedTiers;
		});
	};

	const updatePrice = (index: number, key: string, value: string) => {
		// Allow only valid decimal numbers for price fields
		const numericString = value.replace(/[^0-9.]/g, '');

		// Prevent multiple decimal points
		const decimalCount = (numericString.match(/\./g) || []).length;
		if (decimalCount > 1) {
			return;
		}

		setTieredPrices((prev) => {
			const updatedTiers = [...prev];
			updatedTiers[index] = { ...updatedTiers[index], [key]: numericString };
			return updatedTiers;
		});
	};

	return (
		<div className='space-y-4'>
			<div className={cn('w-full', tieredPrices.length > 0 ? '' : 'hidden')}>
				<table className='table-auto w-full border-collapse border border-gray-200 overflow-x-auto'>
					<thead>
						<tr className='bg-gray-100 text-left border-b'>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>From {'(>)'}</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>Up to {'(<=)'}</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>{`Per unit price `}</th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'>Flat fee </th>
							<th className='px-4 py-2 font-normal bg-white text-nowrap text-[#71717A]'></th>
						</tr>
					</thead>
					<tbody>
						{tieredPrices.map((tier, index) => (
							<tr key={index}>
								<td className='px-4 py-2'>
									<Input
										disabled
										className='h-9'
										// onChange={(e) => updateTier(index, 'from', e)}
										value={tier.from.toString()}
									/>
								</td>
								<td className='px-4 py-2'>
									<DecimalUsageInput
										label=''
										value={tier.up_to === null ? '∞' : tier.up_to.toString()}
										onChange={(e) => updateTier(index, 'up_to', e)}
										disabled={tier.up_to === null}
										precision={3}
										min={0}
										placeholder='∞'
									/>
								</td>
								<td className='px-4 py-2'>
									<Input
										className='h-9'
										onChange={(e) => {
											if (validateDecimal(e)) {
												updatePrice(index, 'unit_amount', e);
											}
										}}
										value={tier.unit_amount?.toString() || ''}
										inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
										placeholder={'0.00'}
									/>
								</td>
								<td className='px-4 py-2'>
									<Input
										className='h-9'
										onChange={(e) => {
											if (validateDecimal(e)) {
												updatePrice(index, 'flat_amount', e);
											}
										}}
										value={tier.flat_amount?.toString() ?? '0'}
										inputPrefix={currency ? getDisplaySymbol(currency) : undefined}
										placeholder={'0.00'}
									/>
								</td>
								<td className='px-4 py-2 text-center'>
									<button className='flex justify-center items-center size-9 rounded-md border text-zinc' onClick={() => removeTier(index)}>
										<RiDeleteBin6Line className='text-zinc' />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className='flex justify-between items-center mt-4'>
				<AddChargesButton onClick={addTieredPrice} label='Add Tier' />
			</div>
		</div>
	);
};

export default VolumeTieredPricingForm;
