import React, { useEffect, useMemo, useState } from 'react';
import { Card, Input, Select, Button } from '@/components/atoms';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

/** Period options for contract terms (target display period) */
export const CONTRACT_TERM_OPTIONS = [
	{ label: 'Annual', value: 'ANNUAL', months: 12 },
	{ label: 'Monthly', value: 'MONTHLY', months: 1 },
	{ label: 'Quarterly', value: 'QUARTERLY', months: 3 },
] as const;

export type ContractTermValue = (typeof CONTRACT_TERM_OPTIONS)[number]['value'];

/** Period in months for plan period (billing period) */
export const PLAN_PERIOD_MONTHS: Record<string, number> = {
	ANNUAL: 12,
	MONTHLY: 1,
	QUARTERLY: 3,
};

interface SubscriptionCalculatorProps {
	currency?: string;
	initialAnnualAmount?: string;
	className?: string;
}

export interface SubscriptionCalculatorContentProps {
	/** Currency code for display (e.g. USD). */
	currency?: string;
	/** Initial contract amount (e.g. from Price field). */
	initialAmount?: string;
	/** Initial contract terms (target period, e.g. Monthly). */
	initialContractTerms?: ContractTermValue;
	/** Plan period (billing period) – the period the amount is currently in (e.g. Annual = amount is per year). */
	planPeriod?: ContractTermValue;
	className?: string;
	/** When provided, shows OK button; called with display amount string and selected contract terms when OK is pressed. */
	onApply?: (displayAmount: string, contractTerms: ContractTermValue) => void;
}

/**
 * Calculator: Contract amount (in plan period) → display value in contract term.
 * e.g. Billing period = Annual, Contract term = Monthly → price = amount / 12.
 */
export const SubscriptionCalculatorContent: React.FC<SubscriptionCalculatorContentProps> = ({
	currency = 'USD',
	initialAmount = '',
	initialContractTerms = 'MONTHLY',
	className,
	planPeriod = 'ANNUAL',
	onApply,
}) => {
	const [amountStr, setAmountStr] = useState(initialAmount);
	const [contractTerms, setContractTerms] = useState<ContractTermValue>(initialContractTerms);

	useEffect(() => {
		if (initialAmount?.trim() !== '') setAmountStr(initialAmount);
	}, [initialAmount]);
	useEffect(() => {
		if (initialContractTerms) setContractTerms(initialContractTerms);
	}, [initialContractTerms]);

	const amountNum = useMemo(() => {
		const cleaned = amountStr.replace(/,/g, '').trim();
		const n = parseFloat(cleaned);
		return Number.isFinite(n) && n >= 0 ? n : null;
	}, [amountStr]);

	const planMonths = PLAN_PERIOD_MONTHS[planPeriod] ?? 12;
	const termOption = useMemo(
		() => CONTRACT_TERM_OPTIONS.find((o) => o.value === contractTerms) ?? CONTRACT_TERM_OPTIONS[0],
		[contractTerms],
	);
	const termMonths = termOption.months;

	/**
	 * Convert amount from plan period to contract term.
	 * - Same or shorter target (e.g. Annual → Monthly): amount * (termMonths / planMonths).
	 * - Quarterly → Annual (yearly): amount / 4 (per requirement).
	 */
	const displayValue = useMemo(() => {
		if (amountNum == null || planMonths <= 0) return null;
		if (planPeriod === 'QUARTERLY' && contractTerms === 'ANNUAL') {
			return amountNum / 4;
		}
		return amountNum * (termMonths / planMonths);
	}, [amountNum, planMonths, termMonths, planPeriod, contractTerms]);

	const currencySymbol = getCurrencySymbol(currency);
	const selectOptions = CONTRACT_TERM_OPTIONS.map((o) => ({ label: o.label, value: o.value }));

	return (
		<div className={className}>
			<div className='space-y-4'>
				<Input
					label='Contract Amount'
					placeholder='0'
					value={amountStr}
					onChange={setAmountStr}
					variant='formatted-number'
					inputPrefix={<span className='text-muted-foreground'>{currencySymbol}</span>}
				/>
				<Select
					label='Contract Term'
					value={contractTerms}
					options={selectOptions}
					onChange={(value) => setContractTerms(value as ContractTermValue)}
					contentClassName='z-[200]'
				/>
				{amountNum != null && amountNum > 0 && (
					<div className='rounded-md border border-gray-200 bg-gray-50/80 p-4 space-y-2'>
						{displayValue != null && (
							<p className='text-sm'>
								<span className='font-medium text-gray-900'>Display amount:</span>{' '}
								<span className='font-semibold text-gray-900'>
									{currencySymbol}
									{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
								</span>
								<span className='text-gray-600'>
									{contractTerms === 'ANNUAL' && ' (per year)'}
									{contractTerms === 'QUARTERLY' && ' (per quarter)'}
									{contractTerms === 'MONTHLY' && ' (per month)'}
								</span>
							</p>
						)}
					</div>
				)}
				{amountNum == null && amountStr.trim() !== '' && (
					<p className='text-sm text-amber-600'>Enter a valid contract amount to see the calculation.</p>
				)}
				{onApply && displayValue != null && (
					<div className='mt-4 flex justify-end'>
						<Button type='button' onClick={() => onApply(displayValue.toFixed(2), contractTerms)}>
							OK
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

/**
 * Calculator: Contract amount (in plan period) → display value in selected contract term.
 */
const SubscriptionCalculator: React.FC<SubscriptionCalculatorProps> = ({ currency = 'USD', initialAnnualAmount = '', className }) => (
	<Card variant='bordered' className={className}>
		<div className='pt-1'>
			<SubscriptionCalculatorContent
				currency={currency}
				initialAmount={initialAnnualAmount}
				initialContractTerms='MONTHLY'
				planPeriod='ANNUAL'
			/>
		</div>
	</Card>
);

export default SubscriptionCalculator;
