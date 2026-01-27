import { useNavigate, useParams, useOutletContext } from 'react-router';
import { AddButton, Card, CardHeader, NoDataCard } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import { useQuery, useQueries } from '@tanstack/react-query';
import { SubscriptionTable } from '@/components/organisms';
import { Subscription, SUBSCRIPTION_STATUS, PRICE_ENTITY_TYPE } from '@/models';
import { Loader } from '@/components/atoms';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable';
import { UpcomingCreditGrantApplicationsTable } from '@/components/molecules';
import SubscriptionApi from '@/api/SubscriptionApi';
import { PriceApi } from '@/api';
import { useMemo } from 'react';

type ContextType = {
	isArchived: boolean;
};

const fetchAllSubscriptions = async (customerId: string) => {
	const subs = await SubscriptionApi.searchSubscriptions({
		customer_id: customerId,
		limit: 1000,
		subscription_status: [
			SUBSCRIPTION_STATUS.ACTIVE,
			SUBSCRIPTION_STATUS.CANCELLED,
			SUBSCRIPTION_STATUS.INCOMPLETE,
			SUBSCRIPTION_STATUS.TRIALING,
			SUBSCRIPTION_STATUS.DRAFT,
		],
	});
	return subs.items;
};

const CustomerOverviewTab = () => {
	const navigate = useNavigate();
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();

	const handleAddSubscription = () => {
		navigate(`${RouteNames.customers}/${customerId}/add-subscription`);
	};

	const {
		data: subscriptions,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['subscriptions', customerId],
		queryFn: () => fetchAllSubscriptions(customerId!),
	});

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId! }),
	});

	const {
		data: upcomingCreditGrantApplications,
		isLoading: upcomingGrantsLoading,
		error: upcomingGrantsError,
	} = useQuery({
		queryKey: ['upcomingCreditGrantApplications', customerId],
		queryFn: () => CustomerApi.getUpcomingCreditGrantApplications(customerId!),
		enabled: !!customerId,
	});

	const {
		data: customer,
		isLoading: customerLoading,
		error: customerError,
	} = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});

	// Check for subscription overrides
	const overrideQueries = useQueries({
		queries:
			subscriptions?.map((sub) => ({
				queryKey: ['subscriptionOverride', sub.id],
				queryFn: async () => {
					const result = await PriceApi.ListPrices({
						entity_type: PRICE_ENTITY_TYPE.SUBSCRIPTION,
						entity_ids: [sub.id],
						limit: 1,
					});
					return {
						subscriptionId: sub.id,
						hasOverride: (result.items?.length || 0) > 0,
					};
				},
				enabled: !!sub.id,
			})) || [],
	});

	// Create a map of subscription IDs to override status
	const subscriptionOverrides = useMemo(() => {
		const overrideMap = new Map<string, boolean>();
		overrideQueries.forEach((query) => {
			if (query.data) {
				overrideMap.set(query.data.subscriptionId, query.data.hasOverride);
			}
		});
		return overrideMap;
	}, [overrideQueries]);

	const isOverridesLoading = overrideQueries.some((query) => query.isLoading);

	if (subscriptionsLoading || usageLoading || upcomingGrantsLoading || customerLoading || isOverridesLoading) {
		return <Loader />;
	}

	if (subscriptionsError || usageError || upcomingGrantsError || customerError) {
		toast.error('Something went wrong');
	}

	const renderSubscriptionContent = () => {
		if ((subscriptions?.length || 0) > 0) {
			return (
				<Card variant='notched'>
					<CardHeader title='Subscriptions' cta={!isArchived && <AddButton onClick={handleAddSubscription} />} />
					<SubscriptionTable
						onRowClick={(row) => {
							navigate(`${RouteNames.customers}/${customerId}/subscription/${row.id}`);
						}}
						data={subscriptions as Subscription[]}
						subscriptionOverrides={subscriptionOverrides}
						customerName={customer?.name}
					/>
				</Card>
			);
		}

		return (
			<NoDataCard
				title='Subscriptions'
				subtitle={isArchived ? 'No subscriptions found' : 'No active subscriptions'}
				cta={!isArchived && <AddButton onClick={handleAddSubscription} />}
			/>
		);
	};

	return (
		<div className='space-y-6'>
			{renderSubscriptionContent()}

			{/* customer entitlements table */}
			{(usageData?.features?.length || 0) > 0 && (
				<Card variant='notched'>
					<CardHeader title='Entitlements' />
					<CustomerUsageTable data={usageData?.features ?? []} />
				</Card>
			)}

			{/* upcoming credit grant applications */}
			<UpcomingCreditGrantApplicationsTable data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId} />
		</div>
	);
};

export default CustomerOverviewTab;
