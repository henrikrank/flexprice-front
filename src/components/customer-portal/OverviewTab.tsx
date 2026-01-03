import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomerApi from '@/api/CustomerApi';
import EventsApi from '@/api/EventsApi';
import WalletApi from '@/api/WalletApi';
import { Card } from '@/components/atoms';
import { CustomerUsageChart } from '@/components/molecules';
import { WindowSize } from '@/models';
import { WALLET_STATUS } from '@/models/Wallet';
import { GetUsageAnalyticsRequest } from '@/types';
import { cn } from '@/lib/utils';
import { formatAmount } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { Wallet as WalletIcon } from 'lucide-react';
import SubscriptionsSection from './SubscriptionsSection';
import UsageSection from './UsageSection';

interface OverviewTabProps {
	customerId: string;
}

type TimePeriod = '1d' | '7d' | '30d';

const OverviewSkeleton = () => (
	<div className='space-y-6'>
		{/* Subscriptions Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse space-y-4'>
				<div className='h-5 bg-zinc-100 rounded w-1/4'></div>
				<div className='h-20 bg-zinc-100 rounded'></div>
			</div>
		</Card>

		{/* Wallet Balance Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse'>
				<div className='h-10 bg-zinc-100 rounded w-1/3 mb-6'></div>
				<div className='h-10 bg-zinc-100 rounded w-1/4'></div>
			</div>
		</Card>

		{/* Usage Chart Skeleton */}
		<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
			<div className='animate-pulse'>
				<div className='h-5 bg-zinc-100 rounded w-1/4 mb-4'></div>
				<div className='h-48 bg-zinc-100 rounded'></div>
			</div>
		</Card>
	</div>
);

const OverviewTab = ({ customerId }: OverviewTabProps) => {
	const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

	// Fetch customer to get external_id for analytics
	const { data: customer } = useQuery({
		queryKey: ['portal-customer-overview', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId),
		enabled: !!customerId,
	});

	// Fetch subscriptions
	const {
		data: subscriptionsData,
		isLoading: subscriptionsLoading,
		isError: subscriptionsError,
	} = useQuery({
		queryKey: ['portal-subscriptions', customerId],
		queryFn: () => CustomerApi.getCustomerSubscriptions(customerId),
		enabled: !!customerId,
	});

	// Fetch wallets
	const {
		data: wallets,
		isLoading: walletsLoading,
		isError: walletsError,
	} = useQuery({
		queryKey: ['portal-wallets', customerId],
		queryFn: () => WalletApi.getCustomerWallets({ id: customerId }),
		enabled: !!customerId,
	});

	// Get first wallet (prefer active, otherwise first available)
	const firstWallet = wallets?.find((w) => w.wallet_status === WALLET_STATUS.ACTIVE) || wallets?.[0];

	// Fetch wallet balance for first wallet
	const { data: walletBalance, isLoading: balanceLoading } = useQuery({
		queryKey: ['portal-wallet-balance', firstWallet?.id],
		queryFn: () => WalletApi.getWalletBalance(firstWallet!.id),
		enabled: !!firstWallet?.id,
	});

	// Fetch usage summary
	const {
		data: usageData,
		isLoading: usageLoading,
		isError: usageError,
	} = useQuery({
		queryKey: ['portal-usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId }),
		enabled: !!customerId,
	});

	// Prepare analytics params based on selected period
	const analyticsParams: GetUsageAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) return null;

		const endDate = new Date();
		const startDate = new Date();

		// Calculate days based on selected period
		const daysMap: Record<TimePeriod, number> = {
			'1d': 1,
			'7d': 7,
			'30d': 30,
		};

		startDate.setDate(startDate.getDate() - daysMap[selectedPeriod]);

		return {
			external_customer_id: customer.external_id,
			window_size: WindowSize.DAY,
			start_time: startDate.toISOString(),
			end_time: endDate.toISOString(),
		};
	}, [customer?.external_id, selectedPeriod]);

	// Fetch usage analytics for chart
	const { data: analyticsData, isError: analyticsError } = useQuery({
		queryKey: ['portal-analytics', customerId, analyticsParams],
		queryFn: () => EventsApi.getUsageAnalytics(analyticsParams!),
		enabled: !!analyticsParams,
	});

	// Handle errors with toast
	useEffect(() => {
		if (subscriptionsError) {
			toast.error('Failed to load subscriptions');
		}
	}, [subscriptionsError]);

	useEffect(() => {
		if (usageError) {
			toast.error('Failed to load usage data');
		}
	}, [usageError]);

	useEffect(() => {
		if (analyticsError) {
			toast.error('Failed to load usage analytics');
		}
	}, [analyticsError]);

	useEffect(() => {
		if (walletsError) {
			toast.error('Failed to load wallet');
		}
	}, [walletsError]);

	const isLoading = subscriptionsLoading || walletsLoading || usageLoading;

	if (isLoading) {
		return <OverviewSkeleton />;
	}

	const subscriptions = subscriptionsData?.items || [];
	const usage = usageData?.features || [];
	const currencySymbol = getCurrencySymbol(walletBalance?.currency ?? firstWallet?.currency ?? 'USD');
	return (
		<div className='space-y-6'>
			{/* Wallet Balance */}
			{firstWallet && (
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='flex items-center gap-3 mb-6'>
						<div className='h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center'>
							<WalletIcon className='h-5 w-5 text-blue-600' />
						</div>
						<div>
							<h3 className='text-base font-medium text-zinc-950'>{firstWallet.name || 'Wallet'}</h3>
						</div>
					</div>

					{/* Balance */}
					<div>
						<span className='text-sm text-zinc-500 block mb-2'>Balance</span>
						{balanceLoading ? (
							<div className='h-10 w-32 bg-zinc-100 animate-pulse rounded'></div>
						) : (
							<>
								<div className='flex items-baseline gap-2'>
									<span className='text-4xl font-semibold text-zinc-950'>
										{formatAmount(walletBalance?.real_time_credit_balance?.toString() ?? '0')}
									</span>
									<span className='text-base font-normal text-zinc-500'>credits</span>
								</div>
								<p className='text-sm text-zinc-500 mt-1'>
									{currencySymbol}
									{formatAmount(walletBalance?.real_time_balance?.toString() ?? '0')} value
								</p>
							</>
						)}
					</div>
				</Card>
			)}

			{/* Active Subscriptions */}
			<SubscriptionsSection subscriptions={subscriptions} />
			{/* Usage Analytics Chart */}
			{analyticsData && (
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='flex items-center justify-between mb-4'>
						<h3 className='text-base font-medium text-zinc-950'>Usage</h3>
						<div className='flex items-center gap-1 bg-zinc-50 rounded-lg p-1'>
							{(['1d', '7d', '30d'] as TimePeriod[]).map((period) => (
								<button
									key={period}
									onClick={() => setSelectedPeriod(period)}
									className={cn(
										'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
										selectedPeriod === period ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
									)}>
									{period}
								</button>
							))}
						</div>
					</div>
					<CustomerUsageChart data={analyticsData} />
				</Card>
			)}

			{/* Current Period Usage */}
			<UsageSection usageData={usage} />
		</div>
	);
};

export default OverviewTab;
