import { Button, Label, DatePicker } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import { useState, useCallback, useEffect } from 'react';
import { CreditGrant } from '@/models';

interface Props {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onConfirm: (effectiveDate: string) => void;
	onCancel: () => void;
	creditGrant: CreditGrant | null;
}

const CancelCreditGrantModal: React.FC<Props> = ({ isOpen, onOpenChange, onConfirm, onCancel, creditGrant }) => {
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());
	const [error, setError] = useState<string>('');

	// Reset to current date when modal opens
	useEffect(() => {
		if (isOpen) {
			setEffectiveDate(new Date());
			setError('');
		}
	}, [isOpen]);

	const handleConfirm = useCallback(() => {
		if (!effectiveDate) {
			setError('Please select an effective date');
			return;
		}

		setError('');
		onConfirm(effectiveDate.toISOString());
		onOpenChange(false);
		setEffectiveDate(new Date());
	}, [effectiveDate, onConfirm, onOpenChange]);

	const handleCancel = useCallback(() => {
		setError('');
		setEffectiveDate(new Date());
		onCancel();
	}, [onCancel]);

	return (
		<Dialog isOpen={isOpen} showCloseButton={false} onOpenChange={onOpenChange} title='Cancel Credit Grant' className='sm:max-w-[500px]'>
			<div className='space-y-4 mt-3'>
				<p className='text-sm text-gray-600'>
					You are about to cancel the credit grant <strong>&quot;{creditGrant?.name}&quot;</strong>. This action will stop future
					applications of this credit grant starting from the selected effective date.
				</p>

				<div className='space-y-2'>
					<Label label='Effective Date *' />
					<DatePicker
						date={effectiveDate}
						setDate={(date) => {
							setEffectiveDate(date);
							if (error) setError('');
						}}
						placeholder='Select effective date'
					/>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<p className='text-xs text-gray-500'>
						The credit grant will be cancelled starting from this date. All future applications will be stopped.
					</p>
				</div>

				<div className='bg-amber-50 border border-amber-200 rounded-md p-3 mt-4'>
					<p className='text-sm text-amber-800'>
						<strong>Note:</strong> This action cannot be undone. Make sure you select the correct effective date before proceeding.
					</p>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					Cancel
				</Button>
				<Button variant='destructive' onClick={handleConfirm}>
					Cancel Credit Grant
				</Button>
			</div>
		</Dialog>
	);
};

export default CancelCreditGrantModal;
