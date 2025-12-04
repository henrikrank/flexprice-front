import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Page, Loader, Select } from '@/components/atoms';
import EventsApi from '@/api/EventsApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import InvoiceApi from '@/api/InvoiceApi';
import CostSheetApi from '@/api/CostSheetApi';
import toast from 'react-hot-toast';
import { GetMonitoringDataRequest } from '@/types';
import { WindowSize, SUBSCRIPTION_STATUS } from '@/models';
import { PAYMENT_STATUS } from '@/constants/payment';
import { SortDirection } from '@/types/common/QueryBuilder';
import { EventsMonitoringChart } from '@/components/molecules';
import { TrendingUp, FileText, DollarSign, AlertCircle, Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';

enum TimePeriod {
	LAST_HOUR = 'last-hour',
	LAST_DAY = 'last-day',
	LAST_WEEK = 'last-week',
	LAST_30_DAYS = 'last-30-days',
}

const timePeriodOptions = [
	{ value: TimePeriod.LAST_HOUR, label: 'Last hour' },
	{ value: TimePeriod.LAST_DAY, label: 'Last day' },
	{ value: TimePeriod.LAST_WEEK, label: 'Last week' },
	{ value: TimePeriod.LAST_30_DAYS, label: 'Last 30 days' },
];

const windowSizeOptions = [
	{ value: WindowSize.MINUTE, label: 'Minute' },
	{ value: WindowSize.FIFTEEN_MIN, label: '15 Minutes' },
	{ value: WindowSize.THIRTY_MIN, label: '30 Minutes' },
	{ value: WindowSize.HOUR, label: 'Hour' },
	{ value: WindowSize.THREE_HOUR, label: '3 Hours' },
	{ value: WindowSize.SIX_HOUR, label: '6 Hours' },
	{ value: WindowSize.TWELVE_HOUR, label: '12 Hours' },
	{ value: WindowSize.DAY, label: 'Day' },
	{ value: WindowSize.WEEK, label: 'Week' },
	{ value: WindowSize.MONTH, label: 'Month' },
];

const getTimeRangeForPeriod = (period: TimePeriod): { startDate: Date; endDate: Date } => {
	const endDate = new Date();
	let startDate = new Date();

	switch (period) {
		case TimePeriod.LAST_HOUR:
			startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_DAY:
			startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_WEEK:
			startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_30_DAYS:
			startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
	}

	return { startDate, endDate };
};

const DashboardPage = () => {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.LAST_WEEK);
	const [windowSize, setWindowSize] = useState<WindowSize>(WindowSize.HOUR);

	// Calculate date range based on selected time period
	const { startDate, endDate } = useMemo(() => {
		return getTimeRangeForPeriod(timePeriod);
	}, [timePeriod]);

	// Prepare Monitoring API parameters
	const monitoringApiParams: GetMonitoringDataRequest = useMemo(() => {
		const params: GetMonitoringDataRequest = {
			window_size: windowSize,
		};
		if (startDate) params.start_time = startDate.toISOString();
		if (endDate) params.end_time = endDate.toISOString();
		return params;
	}, [startDate, endDate, windowSize]);

	// Debounced API parameters with 300ms delay
	const [debouncedMonitoringParams, setDebouncedMonitoringParams] = useState<GetMonitoringDataRequest | null>(null);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedMonitoringParams(monitoringApiParams);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [monitoringApiParams]);

	const {
		data: monitoringData,
		isLoading: monitoringLoading,
		error: monitoringError,
	} = useQuery({
		queryKey: ['monitoring', 'dashboard', debouncedMonitoringParams],
		queryFn: async () => {
			if (!debouncedMonitoringParams) {
				throw new Error('Monitoring API parameters not available');
			}
			return await EventsApi.getMonitoringData(debouncedMonitoringParams);
		},
		enabled: !!debouncedMonitoringParams,
		refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
	});

	useEffect(() => {
		if (monitoringError) {
			toast.error('Error fetching monitoring data');
		}
	}, [monitoringError]);

	// Format "Updated just now" timestamp
	const getUpdatedTime = () => {
		return 'Updated just now';
	};

	// Fetch subscriptions created in last 24 hours
	const last24Hours = useMemo(() => {
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
		return { start: startDate.toISOString(), end: endDate.toISOString() };
	}, []);

	const {
		data: recentSubscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['subscriptions', 'recent', last24Hours],
		queryFn: async () => {
			return await SubscriptionApi.searchSubscriptions({
				limit: 100,
				offset: 0,
				expand: 'plan',
				filters: [
					{
						field: 'created_at',
						operator: 'gt',
						data_type: 'date',
						value: {
							date: last24Hours.start,
						},
					},
					{
						field: 'created_at',
						operator: 'lt',
						data_type: 'date',
						value: {
							date: last24Hours.end,
						},
					},
				],
				sort: [
					{
						field: 'created_at',
						direction: SortDirection.DESC,
					},
				],
			});
		},
	});

	// Calculate subscription breakdown by plan
	const subscriptionsByPlan = useMemo(() => {
		if (!recentSubscriptions?.items) return [];
		const planMap = new Map<string, { count: number; plan_name: string; plan_id: string }>();

		recentSubscriptions.items.forEach((sub) => {
			const planId = sub.plan_id || 'Unknown';
			const planName = sub.plan?.name || sub.plan_id || 'Unknown Plan';
			const existing = planMap.get(planId);
			if (existing) {
				existing.count++;
			} else {
				planMap.set(planId, { count: 1, plan_name: planName, plan_id: planId });
			}
		});

		return Array.from(planMap.values());
	}, [recentSubscriptions]);

	// Fetch revenue for last 3 months
	const monthRanges = useMemo(() => {
		const ranges = [];
		const now = new Date();

		for (let i = 2; i >= 0; i--) {
			const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
			const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			ranges.push({
				start: startDate.toISOString(),
				end: endDate.toISOString(),
				label: startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
			});
		}

		return ranges;
	}, []);

	// Fetch revenue for each month
	const {
		data: revenueData,
		isLoading: revenueLoading,
		error: revenueError,
	} = useQuery({
		queryKey: ['revenue', 'monthly', monthRanges],
		queryFn: async () => {
			const results = await Promise.all(
				monthRanges.map(async (range) => {
					try {
						const data = await CostSheetApi.GetCostAnalytics({
							start_time: range.start,
							end_time: range.end,
						});
						return {
							month: range.label,
							revenue: parseFloat(data.total_revenue || '0'),
							currency: data.currency,
						};
					} catch (error) {
						return {
							month: range.label,
							revenue: 0,
							currency: 'USD',
						};
					}
				}),
			);
			return results;
		},
	});

	// Fetch invoices with payment failed
	const {
		data: failedPaymentInvoices,
		isLoading: failedPaymentLoading,
		error: failedPaymentError,
	} = useQuery({
		queryKey: ['invoices', 'payment-failed'],
		queryFn: async () => {
			return await InvoiceApi.getAllInvoices({
				payment_status: PAYMENT_STATUS.FAILED,
				limit: 100,
			});
		},
	});

	// Fetch past due subscriptions (using subscription status)
	const {
		data: pastDueSubscriptions,
		isLoading: pastDueLoading,
		error: pastDueError,
	} = useQuery({
		queryKey: ['subscriptions', 'past-due'],
		queryFn: async () => {
			return await SubscriptionApi.listSubscriptions({
				subscription_status: [SUBSCRIPTION_STATUS.PAST_DUE],
				limit: 100,
			});
		},
	});

	useEffect(() => {
		if (subscriptionsError) toast.error('Error fetching subscription data');
		if (revenueError) toast.error('Error fetching revenue data');
		if (failedPaymentError) toast.error('Error fetching failed payment data');
		if (pastDueError) toast.error('Error fetching past due data');
	}, [subscriptionsError, revenueError, failedPaymentError, pastDueError]);

	return (
		<Page heading='Home'>
			<div className='space-y-6'>
				{/* Controls */}
				<div className='flex flex-col sm:flex-row gap-4 sm:justify-end mb-6'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex flex-col gap-1'>
							<label className='text-xs font-medium text-gray-600'>Time Period</label>
							<Select
								value={timePeriod}
								options={timePeriodOptions}
								onChange={(value) => setTimePeriod(value as TimePeriod)}
								className='min-w-[150px]'
							/>
						</div>
						<div className='flex flex-col gap-1'>
							<label className='text-xs font-medium text-gray-600'>Window Size</label>
							<Select
								value={windowSize}
								options={windowSizeOptions}
								onChange={(value) => setWindowSize(value as WindowSize)}
								className='min-w-[150px]'
							/>
						</div>
					</div>
				</div>

				{/* Events Monitoring Chart */}
				<div>
					{monitoringLoading ? (
						<div className='flex items-center justify-center py-12 border rounded-lg'>
							<Loader />
						</div>
					) : (
						monitoringData && <EventsMonitoringChart data={monitoringData} title='Events Monitoring' description={getUpdatedTime()} />
					)}
				</div>

				{/* New Business Metrics - 3 cards per row */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6'>
					{/* Subscription Card */}
					<div className='bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden'>
						<div className='p-6 border-b border-[#E5E7EB]'>
							<div className='flex items-center justify-between mb-2'>
								<h3 className='text-base font-semibold text-[#111827]'>Recent Subscriptions</h3>
								<Users className='w-5 h-5 text-blue-600' />
							</div>
							<p className='text-xs text-[#6B7280]'>Created in last 24 hours</p>
						</div>
						<div className='p-6'>
							{subscriptionsLoading ? (
								<div className='flex items-center justify-center py-8'>
									<Loader />
								</div>
							) : (
								<>
									<div className='text-center mb-4'>
										<p className='text-4xl font-bold text-[#111827]'>{recentSubscriptions?.items?.length || 0}</p>
										<p className='text-sm text-[#6B7280] mt-1'>New subscriptions</p>
									</div>
									{subscriptionsByPlan.length > 0 ? (
										<div className='mt-4'>
											<p className='text-xs font-medium text-[#6B7280] mb-3'>Breakdown by Plan</p>
											<ResponsiveContainer width='100%' height={180}>
												<PieChart>
													<Pie
														data={subscriptionsByPlan.map((item) => ({
															name: item.plan_name.length > 20 ? item.plan_name.substring(0, 20) + '...' : item.plan_name,
															value: item.count,
															fullName: item.plan_name,
														}))}
														cx='50%'
														cy='50%'
														innerRadius={40}
														outerRadius={70}
														paddingAngle={2}
														dataKey='value'>
														{subscriptionsByPlan.map((_, idx) => (
															<Cell
																key={`cell-${idx}`}
																fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx % 6]}
															/>
														))}
													</Pie>
													<Tooltip
														contentStyle={{
															backgroundColor: 'white',
															border: '1px solid #e5e7eb',
															borderRadius: '8px',
															padding: '8px 12px',
														}}
														formatter={(value: any, _name: any, props: any) => [
															`${value} subscription${value !== 1 ? 's' : ''}`,
															props.payload.fullName,
														]}
													/>
													<Legend
														verticalAlign='bottom'
														height={36}
														iconType='circle'
														formatter={(value) => <span className='text-xs text-[#6B7280]'>{value}</span>}
													/>
												</PieChart>
											</ResponsiveContainer>
										</div>
									) : (
										<p className='text-center text-sm text-[#9CA3AF] py-4'>No subscriptions created in the last 24 hours</p>
									)}
								</>
							)}
						</div>
					</div>

					{/* Revenue Card */}
					<div className='bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden'>
						<div className='p-6 border-b border-[#E5E7EB]'>
							<div className='flex items-center justify-between mb-2'>
								<h3 className='text-base font-semibold text-[#111827]'>Revenue Trend</h3>
								<DollarSign className='w-5 h-5 text-green-600' />
							</div>
							<p className='text-xs text-[#6B7280]'>Last 3 months</p>
						</div>
						<div className='p-6'>
							{revenueLoading ? (
								<div className='flex items-center justify-center py-8'>
									<Loader />
								</div>
							) : revenueData && revenueData.length > 0 ? (
								<div className='space-y-4'>
									{revenueData.map((month, index) => {
										const prevRevenue = index > 0 ? revenueData[index - 1].revenue : month.revenue;
										const growth = prevRevenue > 0 ? ((month.revenue - prevRevenue) / prevRevenue) * 100 : 0;
										const isPositive = growth >= 0;

										return (
											<div key={month.month} className='flex items-center justify-between py-3 border-b border-[#F3F4F6] last:border-0'>
												<div className='flex-1'>
													<p className='text-sm font-medium text-[#111827]'>{month.month}</p>
													{index > 0 && (
														<div className='flex items-center gap-1 mt-1'>
															{isPositive ? (
																<TrendingUp className='w-3 h-3 text-green-600' />
															) : (
																<TrendingUp className='w-3 h-3 text-red-600 transform rotate-180' />
															)}
															<span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
																{Math.abs(growth).toFixed(1)}%
															</span>
														</div>
													)}
												</div>
												<div className='text-right'>
													<p className='text-lg font-bold text-[#111827]'>
														{new Intl.NumberFormat('en-US', {
															style: 'currency',
															currency: month.currency,
															minimumFractionDigits: 0,
															maximumFractionDigits: 0,
														}).format(month.revenue)}
													</p>
												</div>
											</div>
										);
									})}
									<div className='pt-3 mt-3 border-t-2 border-[#E5E7EB]'>
										<div className='flex items-center justify-between'>
											<p className='text-sm font-semibold text-[#111827]'>Total</p>
											<p className='text-xl font-bold text-[#111827]'>
												{new Intl.NumberFormat('en-US', {
													style: 'currency',
													currency: revenueData[0]?.currency || 'USD',
													minimumFractionDigits: 0,
													maximumFractionDigits: 0,
												}).format(revenueData.reduce((sum, month) => sum + month.revenue, 0))}
											</p>
										</div>
									</div>
								</div>
							) : (
								<p className='text-center text-sm text-[#9CA3AF] py-4'>No revenue data available</p>
							)}
						</div>
					</div>

					{/* Invoice Issues Card */}
					<div className='bg-white border border-[#E5E7EB] rounded-md shadow-sm overflow-hidden'>
						<div className='p-6 border-b border-[#E5E7EB]'>
							<div className='flex items-center justify-between mb-2'>
								<h3 className='text-base font-semibold text-[#111827]'>Invoice Issues</h3>
								<AlertCircle className='w-5 h-5 text-red-600' />
							</div>
							<p className='text-xs text-[#6B7280]'>Requires attention</p>
						</div>
						<div className='p-6'>
							{failedPaymentLoading || pastDueLoading ? (
								<div className='flex items-center justify-center py-8'>
									<Loader />
								</div>
							) : (
								<div className='space-y-4'>
									{/* Failed Payments */}
									<div className='bg-red-50 border border-red-200 rounded-lg p-4'>
										<div className='flex items-center justify-between mb-2'>
											<div className='flex items-center gap-2'>
												<FileText className='w-4 h-4 text-red-600' />
												<p className='text-sm font-medium text-red-900'>Payment Failed</p>
											</div>
											<span className='text-2xl font-bold text-red-600'>{failedPaymentInvoices?.items?.length || 0}</span>
										</div>
										<p className='text-xs text-red-700'>Invoices with failed payment attempts</p>
										{failedPaymentInvoices?.items && failedPaymentInvoices.items.length > 0 && (
											<div className='mt-3 pt-3 border-t border-red-200'>
												<p className='text-xs font-medium text-red-900 mb-2'>Total Amount Due:</p>
												<p className='text-lg font-bold text-red-600'>
													{new Intl.NumberFormat('en-US', {
														style: 'currency',
														currency: failedPaymentInvoices.items[0]?.currency || 'USD',
													}).format(
														failedPaymentInvoices.items.reduce((sum, inv) => sum + (inv.amount_remaining || inv.amount_due || 0), 0),
													)}
												</p>
											</div>
										)}
									</div>

									{/* Past Due Subscriptions */}
									<div className='bg-orange-50 border border-orange-200 rounded-lg p-4'>
										<div className='flex items-center justify-between mb-2'>
											<div className='flex items-center gap-2'>
												<Users className='w-4 h-4 text-orange-600' />
												<p className='text-sm font-medium text-orange-900'>Past Due</p>
											</div>
											<span className='text-2xl font-bold text-orange-600'>{pastDueSubscriptions?.items?.length || 0}</span>
										</div>
										<p className='text-xs text-orange-700'>Subscriptions with overdue payments</p>
										{pastDueSubscriptions?.items && pastDueSubscriptions.items.length > 0 && (
											<div className='mt-3 pt-3 border-t border-orange-200'>
												<p className='text-xs text-orange-700'>
													{pastDueSubscriptions.items.length} subscription{pastDueSubscriptions.items.length !== 1 ? 's' : ''} need
													immediate attention
												</p>
											</div>
										)}
									</div>

									{/* Summary */}
									<div className='pt-3 mt-2'>
										<div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
											<p className='text-sm font-medium text-[#4B5563]'>Total Issues</p>
											<p className='text-2xl font-bold text-[#111827]'>
												{(failedPaymentInvoices?.items?.length || 0) + (pastDueSubscriptions?.items?.length || 0)}
											</p>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</Page>
	);
};

export default DashboardPage;
