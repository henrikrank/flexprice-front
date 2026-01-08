import { Button, DatePicker, Input, Select } from '@/components/atoms';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { cn } from '@/lib/utils';
import { Wallet, WALLET_CONFIG_PRICE_TYPE } from '@/models';
import WalletApi from '@/api/WalletApi';
import { getCurrencySymbol } from '@/utils';
import { useMutation } from '@tanstack/react-query';
import { FC, useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreateWalletPayload } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui';
import CurrencyPriceUnitSelector from '@/components/molecules/CurrencyPriceUnitSelector/CurrencyPriceUnitSelector';
import { CurrencyPriceUnitSelection, isPriceUnitOption } from '@/types/common/PriceUnitSelector';

interface Props {
	customerId: string;
	onSuccess?: (walletId: string) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const CreateCustomerWalletModal: FC<Props> = ({ customerId, onSuccess = () => {}, open, onOpenChange }) => {
	const [errors, setErrors] = useState({
		currency: '',
		name: '',
		initial_credits_to_load: '',
		conversion_rate: '',
		topup_conversion_rate: '',
	});

	const [selectedPriceUnitOrCurrency, setSelectedPriceUnitOrCurrency] = useState<CurrencyPriceUnitSelection | null>(null);

	const [walletPayload, setwalletPayload] = useState<CreateWalletPayload>({
		currency: '',
		initial_credits_to_load: 0,
		conversion_rate: 1,
		topup_conversion_rate: undefined,
		price_unit: undefined,
		name: 'Prepaid Wallet',
		config: {
			allowed_price_types: [WALLET_CONFIG_PRICE_TYPE.ALL],
		},
		customer_id: customerId,
	});

	// Helper to get display symbol based on selection
	const getDisplaySymbol = (): string => {
		if (!selectedPriceUnitOrCurrency) {
			return getCurrencySymbol(walletPayload.currency || '');
		}
		return selectedPriceUnitOrCurrency.data.symbol;
	};

	// Check if price unit is selected
	const isPriceUnitSelected = useMemo(() => {
		return !!(selectedPriceUnitOrCurrency && isPriceUnitOption(selectedPriceUnitOrCurrency.data));
	}, [selectedPriceUnitOrCurrency]);

	// Reset form when modal closes
	useEffect(() => {
		if (!open) {
			setwalletPayload({
				currency: '',
				initial_credits_to_load: 0,
				conversion_rate: 1,
				topup_conversion_rate: undefined,
				price_unit: undefined,
				name: 'Prepaid Wallet',
				config: {
					allowed_price_types: [WALLET_CONFIG_PRICE_TYPE.ALL],
				},
				customer_id: customerId,
			});
			setSelectedPriceUnitOrCurrency(null);
			setErrors({
				currency: '',
				name: '',
				initial_credits_to_load: '',
				conversion_rate: '',
				topup_conversion_rate: '',
			});
		}
	}, [open, customerId]);

	// Handle price unit/currency selection change
	const handlePriceUnitOrCurrencyChange = (selection: CurrencyPriceUnitSelection) => {
		setSelectedPriceUnitOrCurrency(selection);
		setErrors((prev) => ({ ...prev, currency: '' }));

		if (isPriceUnitOption(selection.data)) {
			// Price unit selected: auto-populate currency and conversion_rate
			const priceUnit = selection.data;
			setwalletPayload((prev) => ({
				...prev,
				currency: priceUnit.base_currency.toLowerCase(),
				conversion_rate: parseFloat(priceUnit.conversion_rate),
				topup_conversion_rate: prev.topup_conversion_rate || parseFloat(priceUnit.conversion_rate),
				price_unit: priceUnit.code,
			}));
		} else {
			// Currency selected: set conversion_rate to 1, clear price_unit
			const currency = selection.data;
			setwalletPayload((prev) => ({
				...prev,
				currency: currency.code.toLowerCase(),
				conversion_rate: 1,
				topup_conversion_rate: prev.topup_conversion_rate || 1,
				price_unit: undefined,
			}));
		}
	};

	const { mutateAsync: createWallet, isPending } = useMutation({
		mutationKey: ['createWallet', customerId],
		mutationFn: async () => {
			const payload: CreateWalletPayload = {
				customer_id: customerId,
				currency: walletPayload.currency,
				name: walletPayload.name,
				initial_credits_to_load: walletPayload.initial_credits_to_load,
				conversion_rate: walletPayload.conversion_rate,
				topup_conversion_rate: walletPayload.topup_conversion_rate || walletPayload.conversion_rate,
				initial_credits_expiry_date_utc: walletPayload.initial_credits_expiry_date_utc,
				config: walletPayload.config,
			};

			// Only include price_unit if it was selected
			if (walletPayload.price_unit) {
				payload.price_unit = walletPayload.price_unit;
			}

			return await WalletApi.createWallet(payload);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'An error occurred while creating wallet');
		},
		onSuccess: async (data: Wallet) => {
			toast.success('Wallet created successfully');
			onSuccess(data.id);
			await refetchQueries(['fetchWallets']);
			await refetchQueries(['fetchWalletBalances']);
			await refetchQueries(['fetchWalletsTransactions']);
		},
	});

	const handleCreateWallet = async () => {
		const newErrors: typeof errors = {
			currency: '',
			name: '',
			initial_credits_to_load: '',
			conversion_rate: '',
			topup_conversion_rate: '',
		};

		if (!walletPayload.name) {
			newErrors.name = 'Wallet name is required';
		}

		if (!walletPayload.currency) {
			newErrors.currency = 'Currency is required';
		}

		if (walletPayload.conversion_rate !== undefined && walletPayload.conversion_rate <= 0) {
			newErrors.conversion_rate = 'Conversion rate must be greater than 0';
		}

		if (walletPayload.topup_conversion_rate !== undefined && walletPayload.topup_conversion_rate <= 0) {
			newErrors.topup_conversion_rate = 'Top-up conversion rate must be greater than 0';
		}

		if (Object.values(newErrors).some((error) => error !== '')) {
			setErrors(newErrors);
			return;
		}

		const wallet = await createWallet();
		return wallet.id;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='bg-white sm:max-w-[600px] max-h-[80vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Create Wallet</DialogTitle>
					<DialogDescription>Define the wallet details and the currency it will operate in.</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4 py-4'>
					<Input
						error={errors.name}
						value={walletPayload.name}
						onChange={(e) => setwalletPayload({ ...walletPayload, name: e })}
						label='Wallet Name'
						placeholder='Enter wallet name'
					/>

					<CurrencyPriceUnitSelector
						value={selectedPriceUnitOrCurrency?.data.value || walletPayload.currency || walletPayload.price_unit}
						onChange={handlePriceUnitOrCurrencyChange}
						label='Select Currency or Price Unit'
						placeholder='Select currency or price unit'
						error={errors.currency}
						description={
							isPriceUnitSelected
								? 'Price unit selected. Currency and conversion rate are automatically set.'
								: 'Select a currency or price unit for this wallet.'
						}
					/>

					{/* Currency Display (read-only when price unit selected) */}
					{walletPayload.currency && (
						<Input
							label='Currency'
							value={walletPayload.currency.toUpperCase()}
							disabled={isPriceUnitSelected}
							description={isPriceUnitSelected ? 'Currency is set automatically from the selected price unit' : undefined}
						/>
					)}

					{/* Conversion Rate Display */}
					<div className='flex flex-col items-start gap-2 w-full'>
						<label className={cn('block text-sm font-medium', 'text-zinc-950')}>Conversion Rate</label>
						<div className='flex items-center gap-2 w-full'>
							<Input className='w-full' value={'1'} disabled suffix='credit' />
							<span>=</span>
							<Input
								className='w-full'
								variant='number'
								suffix={getDisplaySymbol()}
								value={walletPayload.conversion_rate}
								disabled={isPriceUnitSelected}
								onChange={(e) => {
									if (!isPriceUnitSelected) {
										setwalletPayload({ ...walletPayload, conversion_rate: e as unknown as number });
									}
								}}
							/>
						</div>
						{isPriceUnitSelected && (
							<p className='text-sm text-muted-foreground'>Conversion rate is automatically set from the selected price unit.</p>
						)}
						{errors.conversion_rate && <p className='text-sm text-destructive'>{errors.conversion_rate}</p>}
					</div>

					{/* Top-up Conversion Rate */}
					<div className='flex flex-col items-start gap-2 w-full'>
						<label className={cn('block text-sm font-medium', 'text-zinc-950')}>Top-up Conversion Rate</label>
						<div className='flex items-center gap-2 w-full'>
							<Input className='w-full' value={'1'} disabled suffix='credit' />
							<span>=</span>
							<Input
								className='w-full'
								variant='number'
								suffix={getDisplaySymbol()}
								value={walletPayload.topup_conversion_rate || walletPayload.conversion_rate}
								onChange={(e) => {
									setwalletPayload({
										...walletPayload,
										topup_conversion_rate: e as unknown as number,
									});
								}}
							/>
						</div>
						<p className='text-sm text-muted-foreground'>
							Conversion rate for top-ups. Defaults to the main conversion rate if not specified.
						</p>
						{errors.topup_conversion_rate && <p className='text-sm text-destructive'>{errors.topup_conversion_rate}</p>}
					</div>
					<Input
						label='Free Credits'
						suffix='credits'
						variant='formatted-number'
						placeholder='Enter Free Credits to be added to the wallet'
						value={walletPayload.initial_credits_to_load}
						onChange={(e) => {
							setwalletPayload({ ...walletPayload, initial_credits_to_load: e as unknown as number });
						}}
					/>

					<Select
						value={walletPayload.config?.allowed_price_types?.[0] || WALLET_CONFIG_PRICE_TYPE.ALL}
						options={[
							{ label: 'All Price Types', value: WALLET_CONFIG_PRICE_TYPE.ALL },
							{ label: 'Usage Only', value: WALLET_CONFIG_PRICE_TYPE.USAGE },
							{ label: 'Fixed Only', value: WALLET_CONFIG_PRICE_TYPE.FIXED },
						]}
						label='Allowed Price Types'
						onChange={(e) =>
							setwalletPayload({
								...walletPayload,
								config: {
									allowed_price_types: [e as WALLET_CONFIG_PRICE_TYPE],
								},
							})
						}
						placeholder='Select Allowed Price Types'
					/>

					<div>
						<DatePicker
							labelClassName='text-foreground'
							label='Free Credits Expiry Date'
							minDate={new Date()}
							placeholder='Select Expiry Date'
							date={walletPayload.initial_credits_expiry_date_utc}
							setDate={(e) => {
								setwalletPayload({ ...walletPayload, initial_credits_expiry_date_utc: e as unknown as Date });
							}}
						/>
					</div>

					<div className='w-full justify-end flex'>
						<Button isLoading={isPending} disabled={isPending} onClick={handleCreateWallet}>
							Save Wallet
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default CreateCustomerWalletModal;
