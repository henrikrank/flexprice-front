import { Button, Input, Label, Select, SelectOption, DatePicker } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { CREDIT_GRANT_CADENCE, CREDIT_GRANT_EXPIRATION_TYPE, CREDIT_GRANT_PERIOD, CREDIT_GRANT_SCOPE } from '@/models';
import { CreateCreditGrantRequest } from '@/types/dto/CreditGrant';
import { useCallback, useEffect, useState } from 'react';
import RectangleRadiogroup, { RectangleRadiogroupOption } from '../RectangleRadiogroup';
import { creditGrantPeriodOptions } from '@/constants/constants';
import { cn } from '@/lib/utils';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onSave: (data: CreateCreditGrantRequest) => void;
	onCancel: () => void;
	subscriptionId: string;
	subscriptionStartDate?: string;
}

interface FormErrors {
	name?: string;
	credits?: string;
	expiration_duration?: string;
	priority?: string;
	expiration_type?: string;
	period?: string;
	conversion_rate?: string;
	topup_conversion_rate?: string;
	start_date?: string;
}

const expirationTypeOptions: SelectOption[] = [
	{
		label: 'Expires with subscription period',
		value: CREDIT_GRANT_EXPIRATION_TYPE.BILLING_CYCLE,
		description: 'Unused credits reset at the end of each subscription period (matches the billing schedule).',
	},
	{
		label: 'No Expiry',
		value: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
		description: 'Credits stay available until they are completely used - no time limit.',
	},
];

const billingCadenceOptions: RectangleRadiogroupOption[] = [
	{
		label: 'One-time',
		value: CREDIT_GRANT_CADENCE.ONETIME,
		description: 'This credit will be applied to the subscription once.',
	},
	{
		label: 'Recurring',
		value: CREDIT_GRANT_CADENCE.RECURRING,
		description: 'This credit will be applied to the subscription every billing period.',
	},
];

const EditSubscriptionCreditGrantModal: React.FC<Props> = ({
	isOpen,
	onOpenChange,
	onSave,
	onCancel,
	subscriptionId,
	subscriptionStartDate,
}) => {
	const [errors, setErrors] = useState<FormErrors>({});
	const [formData, setFormData] = useState<Partial<CreateCreditGrantRequest>>({
		scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
		subscription_id: subscriptionId,
		cadence: CREDIT_GRANT_CADENCE.ONETIME,
		credits: 0,
		expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
		priority: 0,
		conversion_rate: 1,
		topup_conversion_rate: 1,
		start_date: subscriptionStartDate || new Date().toISOString(),
		period: CREDIT_GRANT_PERIOD.MONTHLY, // Default to monthly
	});

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			setFormData({
				scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
				subscription_id: subscriptionId,
				cadence: CREDIT_GRANT_CADENCE.ONETIME,
				credits: 0,
				expiration_type: CREDIT_GRANT_EXPIRATION_TYPE.NEVER,
				priority: 0,
				conversion_rate: 1,
				topup_conversion_rate: 1,
				start_date: subscriptionStartDate || new Date().toISOString(),
				period: CREDIT_GRANT_PERIOD.MONTHLY, // Default to monthly
			});
			setErrors({});
		}
	}, [isOpen, subscriptionId, subscriptionStartDate]);

	// Sanitize and validate data before saving
	const sanitizeData = useCallback(
		(data: Partial<CreateCreditGrantRequest>): CreateCreditGrantRequest => {
			// Build sanitized object with required fields explicitly set
			const sanitized: CreateCreditGrantRequest = {
				name: data.name?.trim() || '',
				scope: CREDIT_GRANT_SCOPE.SUBSCRIPTION,
				subscription_id: subscriptionId,
				cadence: data.cadence || CREDIT_GRANT_CADENCE.ONETIME,
				credits: Math.max(0, Number(data.credits) || 0),
				period: data.period,
				period_count: data.period_count || 1, // Default to 1 for recurring grants
				expiration_type: data.expiration_type,
				expiration_duration: data.expiration_duration ? Math.max(1, Math.floor(Number(data.expiration_duration))) : undefined,
				expiration_duration_unit: data.expiration_duration_unit,
				priority: Math.max(0, Math.floor(Number(data.priority) || 0)),
				metadata: data.metadata || {},
				conversion_rate: data.conversion_rate,
				topup_conversion_rate: data.topup_conversion_rate,
				start_date: data.start_date, // Include start_date in the payload
			};

			// Remove expiration_duration if not needed
			if (sanitized.expiration_type !== CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
				delete sanitized.expiration_duration;
			}

			// Remove period and period_count if not recurring
			if (sanitized.cadence !== CREDIT_GRANT_CADENCE.RECURRING) {
				delete sanitized.period;
				delete sanitized.period_count;
			}

			return sanitized;
		},
		[subscriptionId],
	);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		// Validate name
		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		// Validate start date
		if (!formData.start_date) {
			newErrors.start_date = 'Start date is required';
		}

		// Validate credits
		const credits = Number(formData.credits);
		if (!formData.credits || isNaN(credits) || credits <= 0) {
			newErrors.credits = 'Credits must be a positive number';
		}

		// Validate expiration type
		if (!formData.expiration_type) {
			newErrors.expiration_type = 'Expiration type is required';
		}

		// Validate expiration duration (only when expiration type is DURATION)
		if (formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION) {
			const duration = Number(formData.expiration_duration);
			if (!formData.expiration_duration || isNaN(duration) || duration <= 0) {
				newErrors.expiration_duration = 'Expiration duration must be a positive number';
			}
		}

		// Validate period (only for recurring credits)
		if (formData.cadence === CREDIT_GRANT_CADENCE.RECURRING && !formData.period) {
			newErrors.period = 'Grant period is required for recurring credits';
		}

		// Validate priority
		const priority = Number(formData.priority);
		if (formData.priority !== undefined && formData.priority !== null && (isNaN(priority) || priority < 0)) {
			newErrors.priority = 'Priority must be a non-negative number';
		}

		// Validate conversion_rate if provided
		if (formData.conversion_rate !== undefined && formData.conversion_rate !== null) {
			const conversionRate = Number(formData.conversion_rate);
			if (isNaN(conversionRate) || conversionRate <= 0) {
				newErrors.conversion_rate = 'Conversion rate must be greater than 0';
			}
		}

		// Validate topup_conversion_rate if provided
		if (formData.topup_conversion_rate !== undefined && formData.topup_conversion_rate !== null) {
			const topupConversionRate = Number(formData.topup_conversion_rate);
			if (isNaN(topupConversionRate) || topupConversionRate <= 0) {
				newErrors.topup_conversion_rate = 'Top-up conversion rate must be greater than 0';
			}
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData]);

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		const sanitizedData = sanitizeData(formData);

		onSave(sanitizedData);
		onOpenChange(false);
	}, [formData, validateForm, sanitizeData, onSave, onOpenChange]);

	const handleFieldChange = useCallback(
		(
			field: keyof CreateCreditGrantRequest,
			value: string | number | Date | CREDIT_GRANT_CADENCE | CREDIT_GRANT_EXPIRATION_TYPE | CREDIT_GRANT_PERIOD | undefined,
		) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			setErrors((prev) => (prev[field as keyof FormErrors] === undefined ? prev : { ...prev, [field]: undefined }));
		},
		[],
	);

	const selectedCadenceDescription = billingCadenceOptions.find((o) => o.value === formData.cadence)?.description;

	return (
		<Dialog isOpen={isOpen} showCloseButton={false} onOpenChange={onOpenChange} title='Add Credit Grant' className='sm:max-w-[600px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2 !mb-6'>
					<Label label='Credit Type' />
					<RectangleRadiogroup
						options={billingCadenceOptions.map((option) => ({
							...option,
							description: undefined,
						}))}
						value={formData.cadence}
						onChange={(value) => handleFieldChange('cadence', value as CREDIT_GRANT_CADENCE)}
					/>
					{selectedCadenceDescription && <p className='text-sm text-gray-500'>{selectedCadenceDescription}</p>}
				</div>

				<div className='space-y-2'>
					<Input
						label='Credit Name'
						placeholder='e.g. Welcome Credits'
						value={formData.name || ''}
						onChange={(value) => handleFieldChange('name', value)}
						error={errors.name}
					/>
				</div>

				<div className='space-y-2'>
					<DatePicker
						label='Start Date *'
						date={formData.start_date ? new Date(formData.start_date) : undefined}
						setDate={(date) => {
							if (date) {
								handleFieldChange('start_date', date.toISOString());
							}
						}}
						placeholder='Select start date'
					/>
					{errors.start_date && <p className='text-sm text-destructive'>{errors.start_date}</p>}
				</div>

				<div className='space-y-2'>
					<Input
						label='Credits'
						error={errors.credits}
						placeholder='e.g. 1000'
						variant='formatted-number'
						formatOptions={{
							allowDecimals: true,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.credits?.toString() || ''}
						onChange={(value) => handleFieldChange('credits', value)}
					/>
				</div>

				{/* Conversion Rate */}
				<div className='flex flex-col items-start gap-2 w-full'>
					<label className={cn('block text-sm font-medium', 'text-zinc-950')}>Conversion Rate</label>
					<div className='flex items-center gap-2 w-full'>
						<Input className='w-full' value={'1'} disabled suffix='credit' />
						<span>=</span>
						<Input
							className='w-full'
							variant='number'
							value={formData.conversion_rate || 1}
							onChange={(value) => {
								handleFieldChange('conversion_rate', parseFloat(value) || 1);
							}}
						/>
					</div>
					<p className='text-sm text-muted-foreground'>
						Amount in currency equivalent to 1 credit. For example, if conversion rate is 2, then 1 credit = 2 units of currency.
					</p>
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
							value={formData.topup_conversion_rate || formData.conversion_rate || 1}
							onChange={(value) => {
								handleFieldChange('topup_conversion_rate', parseFloat(value) || formData.conversion_rate || 1);
							}}
						/>
					</div>
					<p className='text-sm text-muted-foreground'>
						Conversion rate for top-ups. Defaults to the main conversion rate if not specified.
					</p>
					{errors.topup_conversion_rate && <p className='text-sm text-destructive'>{errors.topup_conversion_rate}</p>}
				</div>

				{formData.cadence === CREDIT_GRANT_CADENCE.RECURRING && (
					<div className='space-y-2'>
						<Select
							label='Grant Period'
							error={errors.period}
							options={creditGrantPeriodOptions}
							value={formData.period}
							onChange={(value) => handleFieldChange('period', value as CREDIT_GRANT_PERIOD)}
						/>
					</div>
				)}

				<div className='space-y-2'>
					<Select
						label='Expiry Type'
						error={errors.expiration_type}
						options={expirationTypeOptions}
						value={formData.expiration_type}
						onChange={(value) => handleFieldChange('expiration_type', value as CREDIT_GRANT_EXPIRATION_TYPE)}
					/>
				</div>

				{formData.expiration_type === CREDIT_GRANT_EXPIRATION_TYPE.DURATION && (
					<div className='space-y-2'>
						<Input
							label='Expiry (days)'
							error={errors.expiration_duration}
							placeholder='e.g. 30'
							variant='formatted-number'
							formatOptions={{
								allowDecimals: false,
								allowNegative: false,
								decimalSeparator: '.',
								thousandSeparator: ',',
							}}
							suffix='days'
							value={formData.expiration_duration?.toString() || ''}
							onChange={(value) => handleFieldChange('expiration_duration', parseInt(value) || undefined)}
						/>
					</div>
				)}

				<div className='space-y-2'>
					<Input
						label='Priority'
						error={errors.priority}
						placeholder='e.g. 0'
						variant='formatted-number'
						formatOptions={{
							allowDecimals: false,
							allowNegative: false,
							decimalSeparator: '.',
							thousandSeparator: ',',
						}}
						value={formData.priority?.toString() || ''}
						onChange={(value) => handleFieldChange('priority', parseInt(value) || 0)}
					/>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={onCancel}>
					Cancel
				</Button>
				<Button onClick={handleSave}>Add Credit</Button>
			</div>
		</Dialog>
	);
};

export default EditSubscriptionCreditGrantModal;
