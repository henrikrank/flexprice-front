import { FC } from 'react';
import { Subscription, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { ColumnData, FlexpriceTable } from '@/components/molecules';
import { Chip, Tooltip } from '@/components/atoms';
import { formatBillingPeriodForDisplay } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import SubscriptionActionButton from './SubscriptionActionButton';
import { Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';

export interface SubscriptionTableProps {
	data: Subscription[];
	onRowClick?: (row: Subscription) => void;
	allowRedirect?: boolean;
	subscriptionOverrides?: Map<string, boolean>;
	customerName?: string;
}

export const getSubscriptionStatus = (status: string) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return <Chip variant='success' label='Active' />;
		case SUBSCRIPTION_STATUS.CANCELLED:
			return <Chip variant='failed' label='Cancelled' />;
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return <Chip variant='warning' label='Incomplete' />;
		case SUBSCRIPTION_STATUS.TRIALING:
			return <Chip variant='warning' label='Trialing' />;
		case SUBSCRIPTION_STATUS.DRAFT:
			return <Chip variant='warning' label='Draft' />;
		default:
			return <Chip variant='default' label='Inactive' />;
	}
};

export const formatSubscriptionStatus = (status: string) => {
	switch (status) {
		case SUBSCRIPTION_STATUS.ACTIVE:
			return 'Active';
		case SUBSCRIPTION_STATUS.CANCELLED:
			return 'Cancelled';
		case SUBSCRIPTION_STATUS.INCOMPLETE:
			return 'Incomplete';
		case SUBSCRIPTION_STATUS.TRIALING:
			return 'Trialing';
		case SUBSCRIPTION_STATUS.DRAFT:
			return 'Draft';
		default:
			return 'Inactive';
	}
};

const SubscriptionTable: FC<SubscriptionTableProps> = ({
	data,
	onRowClick,
	allowRedirect = true,
	subscriptionOverrides,
	customerName,
}): JSX.Element => {
	const columns: ColumnData<Subscription>[] = [
		{
			title: 'Plan Name',
			render: (row) => {
				const hasOverride = subscriptionOverrides?.get(row.id);
				const originalPlanName = row.plan?.name;
				const originalPlanId = row.plan?.id;

				if (hasOverride && customerName) {
					const tooltipContent =
						originalPlanName && originalPlanId ? (
							<div className='flex items-center gap-1.5'>
								<span>Overridden plan from</span>
								<Link
									to={`${RouteNames.plan}/${originalPlanId}`}
									className='flex items-center gap-1 underline decoration-dashed decoration-[1px] decoration-gray-500/50 underline-offset-2 hover:decoration-gray-700/70 transition-colors'
									onClick={(e) => e.stopPropagation()}>
									<span>{originalPlanName}</span>
									<ExternalLink className='w-3 h-3' />
								</Link>
							</div>
						) : (
							<span>Overridden plan from {originalPlanName || 'original plan'}</span>
						);

					return (
						<div className='flex items-center gap-1.5'>
							<span>{`${customerName} Custom Plan`}</span>
							<Tooltip content={tooltipContent} delayDuration={0}>
								<Info className='h-4 w-4 text-muted-foreground hover:text-foreground transition-colors' />
							</Tooltip>
						</div>
					);
				}
				return originalPlanName;
			},
		},
		{
			title: 'Billing Period',
			render: (row) => <span>{formatBillingPeriodForDisplay(row.billing_period)}</span>,
		},
		{
			title: 'Status',
			render: (row) => getSubscriptionStatus(row.subscription_status),
		},
		{
			title: 'Start Date',
			render: (row) => <span>{formatDate(row.start_date)}</span>,
		},
		{
			title: 'Renewal Date',
			render: (row) => <span>{formatDate(row.current_period_end)}</span>,
		},
		...(allowRedirect
			? [
					{
						width: '30px',
						fieldVariant: 'interactive' as const,
						hideOnEmpty: true,
						render: (row: Subscription) => <SubscriptionActionButton subscription={row} />,
					},
				]
			: []),
	];

	return (
		<FlexpriceTable
			onRowClick={(row) => {
				onRowClick?.(row);
			}}
			columns={columns}
			data={data}
			variant='no-bordered'
		/>
	);
};

export default SubscriptionTable;
