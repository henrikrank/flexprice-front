import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import SubscriptionApi from '@/api/SubscriptionApi';
import InvoiceApi from '@/api/InvoiceApi';
import CostSheetApi from '@/api/CostSheetApi';
import EnvironmentApi from '@/api/EnvironmentApi';
import { PAYMENT_STATUS } from '@/constants/payment';
import { SortDirection } from '@/types/common/QueryBuilder';

export const useRecentSubscriptions = () => {
	const last24Hours = useMemo(() => {
		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
		return { start: startDate.toISOString(), end: endDate.toISOString() };
	}, []);

	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: recentSubscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['subscriptions', 'recent', environmentId, last24Hours],
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
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

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

	return {
		subscriptionsCount: recentSubscriptions?.items?.length || 0,
		subscriptionsByPlan,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	};
};

export const useRevenueData = () => {
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

		return ranges.reverse();
	}, []);

	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: revenueData,
		isLoading: revenueLoading,
		error: revenueError,
	} = useQuery({
		queryKey: ['revenue', 'monthly', environmentId, monthRanges],
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
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

	return {
		revenueData: revenueData || [],
		isLoading: revenueLoading,
		error: revenueError,
	};
};

export const useInvoiceIssues = () => {
	const environmentId = EnvironmentApi.getActiveEnvironmentId();

	const {
		data: allInvoices,
		isLoading: invoicesLoading,
		error: invoicesError,
	} = useQuery({
		queryKey: ['invoices', 'all-statuses', environmentId],
		queryFn: async () => {
			return await InvoiceApi.getAllInvoices({
				limit: 500, // Increased limit to get more invoices
				start_time: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
			});
		},
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

	const {
		data: pastDueSubscriptions,
		isLoading: pastDueLoading,
		error: pastDueError,
	} = useQuery({
		queryKey: ['subscriptions', 'past-due', environmentId],
		queryFn: async () => {
			return await SubscriptionApi.listSubscriptions({
				limit: 100,
			});
		},
		staleTime: 0, // No caching
		gcTime: 0, // No garbage collection time
		refetchOnWindowFocus: true,
		refetchOnMount: true,
		enabled: !!environmentId, // Only run if environment ID exists
	});

	// Categorize invoices by payment status
	const invoicesByStatus = useMemo(() => {
		if (!allInvoices?.items) {
			return {
				paid: [],
				failed: [],
				pending: [],
				processing: [],
				refunded: [],
				total: 0,
			};
		}

		const invoices = allInvoices.items;
		const categorized = {
			paid: invoices.filter((inv) => inv.payment_status === PAYMENT_STATUS.SUCCEEDED),
			failed: invoices.filter((inv) => inv.payment_status === PAYMENT_STATUS.FAILED),
			pending: invoices.filter((inv) => inv.payment_status === PAYMENT_STATUS.PENDING || inv.payment_status === PAYMENT_STATUS.INITIATED),
			processing: invoices.filter((inv) => inv.payment_status === PAYMENT_STATUS.PROCESSING),
			refunded: invoices.filter(
				(inv) => inv.payment_status === PAYMENT_STATUS.REFUNDED || inv.payment_status === PAYMENT_STATUS.PARTIALLY_REFUNDED,
			),
			total: invoices.length,
		};

		return categorized;
	}, [allInvoices]);

	return {
		invoicesByStatus,
		pastDueSubscriptions: pastDueSubscriptions?.items || [],
		isLoading: invoicesLoading || pastDueLoading,
		errors: [invoicesError, pastDueError].filter(Boolean),
		// Legacy support - keeping these for backward compatibility
		failedPaymentInvoices: invoicesByStatus.failed,
	};
};
