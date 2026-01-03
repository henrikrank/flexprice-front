import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import EventsApi from '@/api/EventsApi';
import { CustomerUsageChart, FlexpriceTable, type ColumnData } from '@/components/molecules';
import { UsageAnalyticItem, WindowSize } from '@/models';
import { GetUsageAnalyticsRequest } from '@/types';
import { formatNumber, getCurrencySymbol } from '@/utils';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from './EmptyState';
import TimePeriodSelector from './TimePeriodSelector';
import { CustomerPortalTimePeriod, DEFAULT_TIME_PERIOD, calculateTimeRange } from './constants';

interface UsageAnalyticsTabProps {
	customerId: string;
}

const UsageAnalyticsTab = ({ customerId }: UsageAnalyticsTabProps) => {
	const [selectedPeriod, setSelectedPeriod] = useState<CustomerPortalTimePeriod>(DEFAULT_TIME_PERIOD);

	// Fetch customer to get external_id
	const { data: customer, isLoading: customerLoading } = useQuery({
		queryKey: ['portal-customer-analytics', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId),
		enabled: !!customerId,
	});

	// Prepare analytics params based on selected period
	const analyticsParams: GetUsageAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) return null;

		const timeRange = calculateTimeRange(selectedPeriod);

		return {
			external_customer_id: customer.external_id,
			window_size: WindowSize.DAY,
			start_time: timeRange.start_time,
			end_time: timeRange.end_time,
		};
	}, [customer?.external_id, selectedPeriod]);

	// Debounced API parameters with 300ms delay
	const [debouncedParams, setDebouncedParams] = useState<GetUsageAnalyticsRequest | null>(null);

	useEffect(() => {
		if (analyticsParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedParams(analyticsParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedParams(null);
		}
	}, [analyticsParams]);

	// Fetch usage analytics
	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['portal-usage-analytics', customerId, debouncedParams],
		queryFn: async () => {
			if (!debouncedParams) {
				throw new Error('API parameters not available');
			}
			return await EventsApi.getUsageAnalytics(debouncedParams);
		},
		enabled: !!debouncedParams,
	});

	useEffect(() => {
		if (usageError) {
			toast.error('Failed to load usage analytics');
		}
	}, [usageError]);

	if (customerLoading) {
		return (
			<div className='space-y-6'>
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='animate-pulse space-y-4'>
						<div className='h-10 bg-zinc-100 rounded'></div>
						<div className='h-64 bg-zinc-100 rounded'></div>
					</div>
				</Card>
			</div>
		);
	}

	if (!customer?.external_id) {
		return (
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<EmptyState title='Unable to load analytics' description='Customer information is missing' />
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Usage Chart */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<div className='flex items-center justify-between mb-4'>
					<h3 className='text-base font-medium text-zinc-950'>Usage</h3>
					<TimePeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
				</div>
				{usageLoading ? (
					<div className='space-y-4'>
						<Skeleton className='h-64 w-full' />
					</div>
				) : usageData ? (
					<CustomerUsageChart data={usageData} />
				) : (
					<div className='py-8'>
						<EmptyState title='No usage data found' description={`Your usage from the last ${selectedPeriod} will appear here`} />
					</div>
				)}
			</Card>

			{/* Usage Breakdown Table */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl overflow-hidden'>
				<div className='p-6 border-b border-[#E9E9E9]'>
					<h3 className='text-base font-medium text-zinc-950'>Usage Breakdown</h3>
				</div>
				{usageLoading ? (
					<div className='space-y-4 p-6'>
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
				) : usageData && usageData.items && usageData.items.length > 0 ? (
					<UsageBreakdownTable items={usageData.items} />
				) : (
					<div className='py-8'>
						<EmptyState title='No usage data found' description={`Your usage from the last ${selectedPeriod} will appear here`} />
					</div>
				)}
			</Card>
		</div>
	);
};

const UsageBreakdownTable: React.FC<{ items: UsageAnalyticItem[] }> = ({ items }) => {
	// Define table columns
	const columns: ColumnData<UsageAnalyticItem>[] = [
		{
			title: 'Feature',
			render: (row: UsageAnalyticItem) => {
				return <span>{row.name || row.feature?.name || row.event_name || 'Unknown'}</span>;
			},
		},
		{
			title: 'Total Usage',
			render: (row: UsageAnalyticItem) => {
				let unit = '';
				if (row.unit) {
					if (row.total_usage !== 1 && row.unit_plural) {
						// Use the provided plural form when total_usage !== 1 and unit_plural exists
						unit = ` ${row.unit_plural}`;
					} else if (row.total_usage !== 1 && !row.unit_plural) {
						// Fall back to appending 's' only when unit_plural is absent and total_usage !== 1
						unit = ` ${row.unit}s`;
					} else {
						// Use singular form (total_usage === 1)
						unit = ` ${row.unit}`;
					}
				}
				return (
					<span>
						{formatNumber(row.total_usage)}
						{unit}
					</span>
				);
			},
		},
		{
			title: 'Events',
			render: (row: UsageAnalyticItem) => {
				return <span>{formatNumber(row.event_count)}</span>;
			},
		},
		{
			title: 'Total Cost',
			render: (row: UsageAnalyticItem) => {
				if (row.total_cost === 0 || !row.currency) return '-';
				const currency = getCurrencySymbol(row.currency);
				return (
					<span>
						{currency}
						{formatNumber(row.total_cost, 2)}
					</span>
				);
			},
		},
	];

	// Prepare data for the table
	const tableData = items.map((item) => ({
		...item,
		// Ensure we have all required fields for the table
		id: item.feature_id || item.source || 'unknown',
	}));

	return <FlexpriceTable columns={columns} data={tableData} showEmptyRow />;
};

export default UsageAnalyticsTab;
