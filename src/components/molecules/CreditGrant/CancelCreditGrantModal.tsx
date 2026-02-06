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
	const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(undefined);
	const [error, setError] = useState<string>('');

	// Reset to undefined when modal opens (will delete immediately if not set)
	useEffect(() => {
		if (isOpen) {
			setEffectiveDate(undefined);
			setError('');
		}
	}, [isOpen]);

	const handleConfirm = useCallback(() => {
		setError('');
		// Pass the effective date, or current time for immediate deletion
		onConfirm(effectiveDate ? effectiveDate.toISOString() : new Date().toISOString());
		onOpenChange(false);
		setEffectiveDate(undefined);
	}, [effectiveDate, onConfirm, onOpenChange]);

	const handleCancel = useCallback(() => {
		setError('');
		setEffectiveDate(undefined);
		onCancel();
	}, [onCancel]);

	return (
		<Dialog isOpen={isOpen} showCloseButton={false} onOpenChange={onOpenChange} title='Delete Credit Grant' className='sm:max-w-[500px]'>
			<div className='space-y-4 mt-3'>
				<p className='text-sm text-gray-600'>
					You are about to delete the credit grant <strong>&quot;{creditGrant?.name}&quot;</strong>. This action will stop future
					applications of this credit grant.
				</p>

				<div className='space-y-2'>
					<Label label='Effective Date (Optional)' />
					<DatePicker
						date={effectiveDate}
						setDate={(date) => {
							setEffectiveDate(date);
							if (error) setError('');
						}}
						placeholder='Delete immediately'
					/>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<p className='text-xs text-gray-500'>Leave empty to delete immediately, or select a future date to schedule the deletion.</p>
				</div>

				<div className='bg-amber-50 border border-amber-200 rounded-md p-3 mt-4'>
					<p className='text-sm text-amber-800'>
						<strong>Note:</strong> This action cannot be undone. All future applications will be stopped.
					</p>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel}>
					Cancel
				</Button>
				<Button variant='destructive' onClick={handleConfirm}>
					Delete Credit Grant
				</Button>
			</div>
		</Dialog>
	);
};

export default CancelCreditGrantModal;
