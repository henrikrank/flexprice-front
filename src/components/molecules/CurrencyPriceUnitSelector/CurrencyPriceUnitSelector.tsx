import { FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger } from '@/components/ui/select';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import { currencyOptions } from '@/constants/constants';
import {
	CurrencyPriceUnitOption,
	CurrencyPriceUnitSelection,
	currencyToOption,
	priceUnitToOption,
	isCurrencyOption,
	isPriceUnitOption,
} from '@/types/common/PriceUnitSelector';
import { ENTITY_STATUS } from '@/models';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/atoms';
import { Coins, Layers } from 'lucide-react';

interface Props {
	value?: string; // Currency code or price unit code
	onChange?: (selection: CurrencyPriceUnitSelection) => void;
	label?: string;
	description?: string;
	error?: string;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

const CurrencyPriceUnitSelector: FC<Props> = ({
	value,
	onChange,
	label = 'Currency',
	description,
	error,
	placeholder = 'Select currency or price unit',
	disabled = false,
	className,
}) => {
	// Fetch price units (only published/active ones)
	const {
		data: priceUnitsData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPriceUnitsForSelector'],
		queryFn: async () => {
			return await PriceUnitApi.ListPriceUnits({
				limit: 100,
				offset: 0,
				status: ENTITY_STATUS.PUBLISHED,
			});
		},
	});

	// Combine currencies and price units into unified options (price units first)
	const allOptions: CurrencyPriceUnitOption[] = useMemo(() => {
		const currencyOpts = currencyOptions.map(currencyToOption);
		const priceUnitOpts = (priceUnitsData?.items || []).map(priceUnitToOption);
		return [...priceUnitOpts, ...currencyOpts];
	}, [priceUnitsData]);

	// Separate into currencies and price units for grouped display
	const currencyOptionsList = useMemo(() => {
		return allOptions.filter(isCurrencyOption);
	}, [allOptions]);

	const priceUnitOptionsList = useMemo(() => {
		return allOptions.filter(isPriceUnitOption);
	}, [allOptions]);

	// Find the selected option
	const selectedOption = useMemo(() => {
		if (!value) return null;
		return allOptions.find((opt) => opt.value === value) || null;
	}, [value, allOptions]);

	const handleValueChange = (newValue: string) => {
		if (!onChange) return;

		const option = allOptions.find((opt) => opt.value === newValue);
		if (!option) return;

		const selection: CurrencyPriceUnitSelection = {
			type: option.type,
			data: option,
		};

		onChange(selection);
	};

	return (
		<div className={cn('space-y-1', className)}>
			{/* Label */}
			{label && (
				<label className={cn('block text-sm font-medium text-zinc break-words', disabled ? 'text-zinc-500' : 'text-zinc-950')}>
					{label}
				</label>
			)}

			<Select value={value || ''} onValueChange={handleValueChange} disabled={disabled || isLoading}>
				<SelectTrigger className={cn(disabled && 'cursor-not-allowed')}>
					<span className={cn('truncate', value ? '' : 'text-muted-foreground')}>
						{isLoading ? 'Loading...' : selectedOption ? selectedOption.label : placeholder}
					</span>
				</SelectTrigger>
				<SelectContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-4'>
							<Loader />
						</div>
					) : isError ? (
						<SelectItem value='error' disabled>
							Error loading price units
						</SelectItem>
					) : (
						<>
							{/* Price Units Group */}
							{priceUnitOptionsList.length > 0 && (
								<SelectGroup>
									<SelectLabel>Price Units</SelectLabel>
									{priceUnitOptionsList.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div className='flex items-center gap-2'>
												<Layers className='h-4 w-4 text-blue-600' />
												<span>{option.label}</span>
											</div>
										</SelectItem>
									))}
								</SelectGroup>
							)}

							{/* Currencies Group */}
							{currencyOptionsList.length > 0 && (
								<SelectGroup>
									<SelectLabel>Currencies</SelectLabel>
									{currencyOptionsList.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											<div className='flex items-center gap-2'>
												<Coins className='h-4 w-4 text-green-600' />
												<span>{option.label}</span>
											</div>
										</SelectItem>
									))}
								</SelectGroup>
							)}

							{/* No options */}
							{currencyOptionsList.length === 0 && priceUnitOptionsList.length === 0 && (
								<SelectItem value='no-options' disabled>
									No options available
								</SelectItem>
							)}
						</>
					)}
				</SelectContent>
			</Select>

			{/* Description */}
			{description && <p className='text-sm text-muted-foreground break-words'>{description}</p>}

			{/* Error Message */}
			{error && <p className='text-sm text-destructive break-words'>{error}</p>}
		</div>
	);
};

export default CurrencyPriceUnitSelector;
