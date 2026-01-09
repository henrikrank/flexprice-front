import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { CreateCustomerDrawer, ApiDocsContent } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import Customer from '@/models/Customer';
import CustomerApi from '@/api/CustomerApi';
import { useState, useMemo } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { ENTITY_STATUS, EXPAND } from '@/models';
import { generateExpandQueryParams } from '@/utils/common/api_helper';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import formatChips from '@/utils/common/format_chips';
import { ExternalLink } from 'lucide-react';
import { useCustomerPortalUrl } from '@/hooks/useCustomerPortalUrl';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'email',
		label: 'Email',
		direction: SortDirection.ASC,
	},
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
];

const filterOptions: FilterField[] = [
	{
		field: 'name',
		label: 'Name',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'external_id',
		label: 'External ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'email',
		label: 'Email',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
	},
	{
		field: 'status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: ENTITY_STATUS.PUBLISHED, label: 'Active' },
			{ value: ENTITY_STATUS.ARCHIVED, label: 'Inactive' },
		],
	},
];

const initialFilters: FilterCondition[] = [
	{
		field: 'name',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-name',
	},
	{
		field: 'external_id',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-external-id',
	},
	{
		field: 'status',
		operator: FilterOperator.IN,
		valueArray: [ENTITY_STATUS.PUBLISHED],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const initialSorts: SortOption[] = [
	{
		field: 'updated_at',
		label: 'Updated At',
		direction: SortDirection.DESC,
	},
];

const CustomerListPage = () => {
	const [activeCustomer, setactiveCustomer] = useState<Customer>();
	const [customerDrawerOpen, setcustomerDrawerOpen] = useState(false);
	const navigate = useNavigate();

	const handleCreateCustomer = () => {
		setactiveCustomer(undefined);
		setcustomerDrawerOpen(true);
	};

	const handleEdit = (customer: Customer) => {
		setactiveCustomer(customer);
		setcustomerDrawerOpen(true);
	};

	// Define columns with proper type safety
	const columns: ColumnData<Customer>[] = useMemo(
		() => [
			{ fieldName: 'name', title: 'Name', width: '400px' },
			{ fieldName: 'external_id', title: 'External ID' },
			{
				title: 'Status',
				render: (row) => {
					const label = formatChips(row.status);
					return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: 'Updated at',
				render: (row) => {
					return <>{formatDate(row.updated_at)}</>;
				},
			},
			{
				title: '',
				fieldVariant: 'interactive',
				render: (row) => {
					// Create a component that uses the hook properly
					const ActionButtonWithPortal = ({ customer }: { customer: Customer }) => {
						const { openInNewTab } = useCustomerPortalUrl(customer.external_id);
						return (
							<ActionButton
								id={customer.id}
								deleteMutationFn={(id) => CustomerApi.deleteCustomerById(id)}
								refetchQueryKey='fetchCustomers'
								entityName='Customer'
								edit={{
									enabled: customer.status === ENTITY_STATUS.PUBLISHED,
									path: `/billing/customers/edit-customer?id=${customer.id}`,
									onClick: () => handleEdit(customer),
								}}
								archive={{
									enabled: customer.status === ENTITY_STATUS.PUBLISHED,
								}}
								customActions={[
									{
										text: 'Open Customer Portal',
										icon: <ExternalLink className='h-4 w-4' />,
										onClick: openInNewTab,
									},
								]}
							/>
						);
					};
					return <ActionButtonWithPortal customer={row} />;
				},
			},
		],
		[],
	);

	return (
		<Page
			heading='Customers'
			headingCTA={
				<div className='flex justify-between gap-2 items-center'>
					<CreateCustomerDrawer
						trigger={
							<AddButton
								onClick={() => {
									setactiveCustomer(undefined);
								}}
							/>
						}
						open={customerDrawerOpen}
						onOpenChange={setcustomerDrawerOpen}
						data={activeCustomer}
					/>
				</div>
			}>
			<ApiDocsContent tags={['Customers']} />
			<QueryableDataArea<Customer>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
				}}
				dataConfig={{
					queryKey: 'fetchCustomers',
					fetchFn: async (params) =>
						CustomerApi.getCustomersByFilters({
							...params,
							expand: generateExpandQueryParams([EXPAND.PARENT_CUSTOMER]),
						}),
					probeFetchFn: async (params) =>
						CustomerApi.getCustomersByFilters({
							...params,
							limit: 1,
							offset: 0,
							filters: [],
							sort: [],
						}),
				}}
				tableConfig={{
					columns,
					onRowClick: (row) => {
						navigate(RouteNames.customers + `/${row?.id}`);
					},
					showEmptyRow: true,
				}}
				paginationConfig={{
					unit: 'Customers',
				}}
				emptyStateConfig={{
					heading: 'Customers',
					description: 'Create a plan to display pricing and start billing customers.',
					buttonLabel: 'Create Customer',
					buttonAction: handleCreateCustomer,
					tags: ['Customers'],
					tutorials: GUIDES.customers.tutorials,
				}}
			/>
			<CreateCustomerDrawer open={customerDrawerOpen} onOpenChange={setcustomerDrawerOpen} data={activeCustomer} />
		</Page>
	);
};

export default CustomerListPage;
