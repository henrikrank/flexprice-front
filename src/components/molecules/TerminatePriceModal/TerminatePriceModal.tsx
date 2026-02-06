import { FC, useState, useEffect, useMemo } from 'react';
import { Button, DatePicker } from '@/components/atoms';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Price } from '@/models';
import { formatDateTimeWithSecondsAndTimezone } from '@/utils/common/format_date';

interface TerminatePriceModalProps {
	planId: string;
	price?: Price;
	onCancel: () => void;
	onConfirm: (endDate: string | undefined) => void;
	isLoading?: boolean;
}

const TerminatePriceModal: FC<TerminatePriceModalProps> = ({ planId: _planId, price, onCancel, onConfirm, isLoading = false }) => {
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	// Get termination message based on selected date
	const terminationMessage = useMemo(() => {
		if (!price) return '';

		const priceName = price.meter?.name || price.description || 'Price';
		if (endDate) {
			return `${priceName} will be terminated on ${formatDateTimeWithSecondsAndTimezone(endDate)}.`;
		}
		return `${priceName} will be terminated immediately.`;
	}, [price, endDate]);

	useEffect(() => {
		setEndDate(undefined);
	}, [price?.id]);

	const handleConfirm = () => {
		const endDateISO = endDate?.toISOString();
		onConfirm(endDateISO);
	};

	const handleCancel = () => {
		setEndDate(undefined);
		onCancel();
	};

	return (
		<DialogContent className='bg-white sm:max-w-[600px]'>
			<DialogHeader>
				<DialogTitle>Terminate Price</DialogTitle>
			</DialogHeader>

			<div className='space-y-6 py-4'>
				<div className='space-y-2'>
					<DatePicker
						label='Effective Termination Date (Optional)'
						placeholder='Select termination date'
						date={endDate}
						setDate={setEndDate}
						className='w-full'
					/>
					<p className='text-xs text-gray-500'>Leave empty to terminate immediately. Select a future date to schedule termination.</p>
					{terminationMessage && (
						<div className='mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
							<p className='text-sm text-blue-800'>{terminationMessage}</p>
						</div>
					)}
				</div>
			</div>

			<div className='flex justify-end space-x-3 pt-4'>
				<Button variant='outline' onClick={handleCancel} disabled={isLoading}>
					Cancel
				</Button>
				<Button onClick={handleConfirm} isLoading={isLoading}>
					Terminate Price
				</Button>
			</div>
		</DialogContent>
	);
};

export default TerminatePriceModal;
