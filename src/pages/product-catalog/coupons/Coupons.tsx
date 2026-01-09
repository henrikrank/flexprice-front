import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, CouponDrawer } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import GUIDES from '@/constants/guides';
import CouponApi from '@/api/CouponApi';
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
import { ENTITY_STATUS } from '@/models';
import { COUPON_TYPE } from '@/types/common/Coupon';
import { Coupon } from '@/models/Coupon';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
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
	{
		field: 'type',
		label: 'Type',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.ARRAY],
		dataType: DataType.ARRAY,
		options: [
			{ value: COUPON_TYPE.FIXED, label: 'Fixed Amount' },
			{ value: COUPON_TYPE.PERCENTAGE, label: 'Percentage' },
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

const CouponsPage = () => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
	const navigate = useNavigate();

	const handleCreateCoupon = () => {
		setSelectedCoupon(null);
		setIsDrawerOpen(true);
	};

	const handleEdit = (coupon: Coupon) => {
		setSelectedCoupon(coupon);
		setIsDrawerOpen(true);
	};

	const columns: ColumnData<Coupon>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: 'Name',
			},
			{
				title: 'Type',
				render: (row) => {
					const label = row.type === COUPON_TYPE.FIXED ? 'Fixed Amount' : 'Percentage';
					return <Chip variant='default' label={label} />;
				},
			},
			{
				title: 'Discount',
				render: (row) => {
					if (row.type === COUPON_TYPE.FIXED) {
						return row.amount_off ? `${getCurrencySymbol(row.currency)} ${row.amount_off}` : '-';
					} else {
						return row.percentage_off ? `${row.percentage_off}%` : '-';
					}
				},
			},
			{
				title: 'Redemptions',
				render: (row) => {
					const max = row.max_redemptions || '∞';
					const current = row.total_redemptions;
					return `${current}/${max}`;
				},
			},
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
					return formatDate(row.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render: (row) => (
					<ActionButton
						id={row.id}
						deleteMutationFn={(id) => CouponApi.deleteCoupon(id)}
						refetchQueryKey='fetchCoupons'
						entityName='Coupon'
						edit={{
							path: `${RouteNames.couponDetails}/${row.id}`,
							onClick: () => handleEdit(row),
						}}
						archive={{
							enabled: row.status === ENTITY_STATUS.PUBLISHED,
						}}
					/>
				),
			},
		],
		[],
	);

	return (
		<>
			<Page
				heading='Coupons'
				headingCTA={
					<div className='flex justify-between items-center gap-2'>
						<AddButton onClick={handleCreateCoupon} />
					</div>
				}>
				<ApiDocsContent tags={['Coupons']} />
				<QueryableDataArea<Coupon>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 500,
					}}
					dataConfig={{
						queryKey: 'fetchCoupons',
						fetchFn: async (params) => CouponApi.getCouponsByFilters(params),
						probeFetchFn: async (params) =>
							CouponApi.getCouponsByFilters({
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
							navigate(`${RouteNames.couponDetails}/${row.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: 'Coupons',
					}}
					emptyStateConfig={{
						heading: 'Coupons',
						description: 'Create your first coupon to offer discounts to customers.',
						buttonLabel: 'Create Coupon',
						buttonAction: handleCreateCoupon,
						tags: ['Coupons'],
						tutorials: GUIDES.coupons.tutorials,
					}}
				/>
			</Page>
			<CouponDrawer data={selectedCoupon} open={isDrawerOpen} onOpenChange={setIsDrawerOpen} refetchQueryKeys={['fetchCoupons']} />
		</>
	);
};

export default CouponsPage;
