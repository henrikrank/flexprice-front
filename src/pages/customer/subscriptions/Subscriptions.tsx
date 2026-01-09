import { Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { QueryBuilder } from '@/components/molecules';
import { SubscriptionTable } from '@/components/molecules/SubscriptionTable';
import EmptyPage from '@/components/organisms/EmptyPage/EmptyPage';
import GUIDES from '@/constants/guides';
import usePagination from '@/hooks/usePagination';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import SubscriptionApi from '@/api/SubscriptionApi';
import CustomerApi from '@/api/CustomerApi';
import toast from 'react-hot-toast';
import { useMemo } from 'react';
import { FilterField, FilterFieldType, DataType, FilterOperator, SortOption, SortDirection } from '@/types/common/QueryBuilder';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { BILLING_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { EXPAND } from '@/models/expand';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { SelectOption } from '@/components/atoms/Select/SearchableSelect';
import { PlanApi } from '@/api/PlanApi';

// UI adapter: Transform API response to SelectOption format for filter components
const searchCustomersForFilter = async (query: string): Promise<Array<SelectOption & { data: any }>> => {
	const result = await CustomerApi.searchCustomers(query, 20);
	return result.items.map((customer) => ({
		value: customer.id,
		label: customer.name,
		description: customer.email,
		data: customer,
	}));
};

const searchPlansForFilter = async (query: string): Promise<Array<SelectOption & { data: any }>> => {
	// If query is empty, get all plans without filters
	if (!query || query.trim() === '') {
		const result = await PlanApi.getPlansByFilter({
			limit: 20,
			offset: 0,
			filters: [],
			sort: [],
		});
		return result.items.map((plan) => ({
			value: plan.id,
			label: plan.name,
			description: plan.description,
			data: plan,
		}));
	}

	// For non-empty queries, use searchPlans
	const result = await PlanApi.searchPlans(query, { limit: 20, offset: 0 });
	return result.items.map((plan) => ({
		value: plan.id,
		label: plan.name,
		description: plan.description,
		data: plan,
	}));
};

const sortingOptions: SortOption[] = [
	{
		field: 'created_at',
		label: 'Created At',
		direction: SortDirection.DESC,
	},
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
	{
		field: 'start_date',
		label: 'Start Date',
		direction: SortDirection.DESC,
	},
	{
		field: 'end_date',
		label: 'End Date',
		direction: SortDirection.DESC,
	},
];

const filterOptions: FilterField[] = [
	{
		field: 'customer_id',
		label: 'Customer',
		fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		asyncConfig: {
			searchFn: searchCustomersForFilter,
		},
	},
	{
		field: 'plan_id',
		label: 'Plan',
		fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		asyncConfig: {
			searchFn: searchPlansForFilter,
		},
	},
	{
		field: 'subscription_status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: SUBSCRIPTION_STATUS.ACTIVE, label: 'Active' },
			{ value: SUBSCRIPTION_STATUS.CANCELLED, label: 'Cancelled' },
			{ value: SUBSCRIPTION_STATUS.INCOMPLETE, label: 'Incomplete' },
			{ value: SUBSCRIPTION_STATUS.TRIALING, label: 'Trialing' },
		],
	},
	{
		field: 'billing_cadence',
		label: 'Billing Cadence',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_CADENCE).map((cadence) => ({
			value: cadence,
			label: cadence.charAt(0).toUpperCase() + cadence.slice(1).toLowerCase(),
		})),
	},
	{
		field: 'billing_period',
		label: 'Billing Period',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_PERIOD).map((period) => ({
			value: period,
			label: toSentenceCase(period.replace('_', ' ')),
		})),
	},
];

const SubscriptionsPage = () => {
	const { limit, offset, page, reset } = usePagination();

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [
			{
				field: 'subscription_status',
				operator: FilterOperator.IN,
				valueArray: [SUBSCRIPTION_STATUS.ACTIVE],
				dataType: DataType.ARRAY,
				id: 'initial-status',
			},
		],
		initialSorts: [
			{
				field: 'updated_at',
				label: 'Updated At',
				direction: SortDirection.DESC,
			},
		],
		debounceTime: 300, // Match the debounce time used in other pages
	});

	const fetchSubscriptions = async () => {
		return await SubscriptionApi.searchSubscriptions({
			limit: limit,
			offset: offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
			expand: generateExpandQueryParams([EXPAND.CUSTOMER]),
		});
	};

	// Reset pagination only when filters or sorts actually change
	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	const {
		isLoading,
		isError,
		data: subscriptionData,
		probeData,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchSubscriptions', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchSubscriptions,
		},
		probe: {
			queryKey: ['fetchSubscriptionsForProbe', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await SubscriptionApi.searchSubscriptions({
					limit: 1,
					offset: 0,
					filters: [],
					sort: [],
				});
			},
		},
		shouldProbe: (mainData) => {
			return mainData?.items.length === 0;
		},
	});

	// show empty page when no subscriptions and no search query
	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && subscriptionData?.items.length === 0;
	}, [isLoading, probeData, subscriptionData]);

	if (isError) {
		toast.error('Error fetching subscriptions');
		return null;
	}

	if (isLoading) {
		return <Loader />;
	}

	// Render empty state when no subscriptions and no search query
	if (showEmptyPage) {
		return (
			<EmptyPage
				heading='Subscriptions'
				tags={['Subscriptions']}
				tutorials={GUIDES.customers.tutorials}
				emptyStateCard={{
					heading: 'Add Your First Subscription',
					description: 'Create your first subscription to start billing your customers.',
					buttonLabel: 'Create Subscription',
				}}
			/>
		);
	}

	return (
		<Page heading='Subscriptions'>
			<div>
				<QueryBuilder
					filterOptions={filterOptions}
					filters={filters}
					onFilterChange={setFilters}
					sortOptions={sortingOptions}
					onSortChange={setSorts}
					selectedSorts={sorts}
				/>
				{isLoading ? (
					<div className='flex justify-center items-center min-h-[200px]'>
						<Loader />
					</div>
				) : (
					<>
						<SubscriptionTable data={subscriptionData?.items || []} />
						<Spacer className='!h-4' />
						<ShortPagination unit='Subscriptions' totalItems={subscriptionData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default SubscriptionsPage;
