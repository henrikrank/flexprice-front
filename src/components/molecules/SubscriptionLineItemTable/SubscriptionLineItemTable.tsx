import { ActionButton, Card, CardHeader, NoDataCard } from '@/components/atoms';
import { ChargeValueCell, ColumnData, FlexpriceTable } from '@/components/molecules';
import { formatDateShort } from '@/utils/common/helper_functions';
import { LineItem } from '@/models/Subscription';
import { FC } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { ENTITY_STATUS } from '@/models/base';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';

interface Props {
	data: LineItem[];
	onEdit?: (lineItem: LineItem) => void;
	onTerminate?: (lineItemId: string) => void;
	isLoading?: boolean;
}

const SubscriptionLineItemTable: FC<Props> = ({ data, onEdit, onTerminate, isLoading }) => {
	const columns: ColumnData<LineItem>[] = [
		{
			title: 'Display Name',
			fieldName: 'display_name',
		},
		{
			title: 'Billing Period',
			render: (row) => formatBillingPeriodForDisplay(row.billing_period),
		},
		{
			title: 'Charge',
			render: (row) => <div className='flex items-center gap-2'>{row.price ? <ChargeValueCell data={row.price} /> : '--'}</div>,
		},
		{
			title: 'Start Date',
			render: (row) => formatDateShort(row.start_date),
		},
		{
			title: 'End Date',
			render: (row) => formatDateShort(row.end_date),
		},
		{
			fieldVariant: 'interactive',
			width: '120px',
			hideOnEmpty: true,
			render: (row) => (
				<ActionButton
					isEditDisabled={false}
					isArchiveDisabled={row.status === ENTITY_STATUS.ARCHIVED}
					entityName={row.display_name}
					editIcon={<Pencil />}
					archiveIcon={<Trash2 />}
					archiveText='Terminate'
					onEdit={() => onEdit?.(row)}
					deleteMutationFn={async () => {
						onTerminate?.(row.id);
					}}
					refetchQueryKey='subscriptionLineItems'
					id={row.id}
					disableToast={true}
				/>
			),
		},
	];

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title='Subscription Line Items' />
				<div className='p-4'>
					<div className='animate-pulse space-y-4'>
						<div className='h-4 bg-gray-200 rounded w-3/4'></div>
						<div className='h-4 bg-gray-200 rounded w-1/2'></div>
						<div className='h-4 bg-gray-200 rounded w-5/6'></div>
					</div>
				</div>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return <NoDataCard title='Subscription Line Items' subtitle='No line items found for this subscription' />;
	}

	return (
		<Card variant='notched'>
			<CardHeader title='Subscription Line Items' />
			<FlexpriceTable showEmptyRow={false} data={data} columns={columns} />
		</Card>
	);
};

export default SubscriptionLineItemTable;
