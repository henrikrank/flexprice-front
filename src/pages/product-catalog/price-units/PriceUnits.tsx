import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, PriceUnitDrawer } from '@/components/molecules';
import { ColumnData } from '@/components/molecules/Table';
import { PriceUnit } from '@/models/PriceUnit';
import { QueryableDataArea } from '@/components/organisms';
import { useState, useMemo } from 'react';
import { PriceUnitApi } from '@/api/PriceUnitApi';
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
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';

const sortingOptions: SortOption[] = [
	{
		field: 'name',
		label: 'Name',
		direction: SortDirection.ASC,
	},
	{
		field: 'code',
		label: 'Code',
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
		field: 'code',
		label: 'Code',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: 'base_currency',
		label: 'Base Currency',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
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
		field: 'created_at',
		label: 'Created At',
		fieldType: FilterFieldType.DATEPICKER,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
		dataType: DataType.DATE,
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
		field: 'code',
		operator: FilterOperator.CONTAINS,
		valueString: '',
		dataType: DataType.STRING,
		id: 'initial-code',
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

const formatConversionRate = (rate: string): string => {
	if (!rate) return '-';
	const numRate = parseFloat(rate);
	if (isNaN(numRate)) return '-';
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	}).format(numRate);
};

const PriceUnitsPage = () => {
	const [activePriceUnit, setActivePriceUnit] = useState<PriceUnit | null>(null);
	const [priceUnitDrawerOpen, setPriceUnitDrawerOpen] = useState(false);

	const handleOnAdd = () => {
		setActivePriceUnit(null);
		setPriceUnitDrawerOpen(true);
	};

	const handleEdit = (priceUnit: PriceUnit) => {
		setActivePriceUnit(priceUnit);
		setPriceUnitDrawerOpen(true);
	};

	const columns: ColumnData<PriceUnit>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: 'Name',
			},
			{
				fieldName: 'code',
				title: 'Code',
			},
			{
				fieldName: 'symbol',
				title: 'Symbol',
			},
			{
				title: 'Base Currency',
				render: (row) => {
					return row?.base_currency?.toUpperCase() || '-';
				},
			},
			{
				title: 'Conversion Rate',
				render: (row) => {
					return formatConversionRate(row?.conversion_rate || '');
				},
			},
			{
				title: 'Status',
				render: (row) => {
					const label = formatChips(row?.status);
					return <Chip variant={label === 'Active' ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: 'Updated At',
				render: (row) => {
					return formatDate(row?.updated_at);
				},
			},
			{
				fieldVariant: 'interactive',
				render(row) {
					return (
						<ActionButton
							id={row?.id}
							deleteMutationFn={async () => {
								return await PriceUnitApi.DeletePriceUnit(row?.id);
							}}
							refetchQueryKey='fetchPriceUnits'
							entityName={row?.name}
							edit={{
								enabled: false,
								onClick: () => handleEdit(row),
							}}
							archive={{
								enabled: row?.status !== ENTITY_STATUS.ARCHIVED,
							}}
						/>
					);
				},
			},
		],
		[],
	);

	return (
		<Page heading='Price Units' headingCTA={<AddButton onClick={handleOnAdd} />}>
			<PriceUnitDrawer
				data={activePriceUnit}
				open={priceUnitDrawerOpen}
				onOpenChange={setPriceUnitDrawerOpen}
				refetchQueryKeys={['fetchPriceUnits']}
			/>
			<ApiDocsContent tags={['Price Units']} />
			<div className='space-y-6'>
				<QueryableDataArea<PriceUnit>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 300,
					}}
					dataConfig={{
						queryKey: 'fetchPriceUnits',
						fetchFn: async (params) => PriceUnitApi.ListPriceUnitsByFilter(params),
						probeFetchFn: async (params) =>
							PriceUnitApi.ListPriceUnitsByFilter({
								...params,
								limit: 1,
								offset: 0,
								filters: [],
								sort: [],
							}),
					}}
					tableConfig={{
						columns,
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: 'Price Units',
					}}
					emptyStateConfig={{
						heading: 'Price Units',
						description: 'Create a price unit to define custom currencies or tokens for pricing.',
						buttonLabel: 'Create Price Unit',
						buttonAction: handleOnAdd,
						tags: ['Price Units'],
					}}
				/>
			</div>
		</Page>
	);
};

export default PriceUnitsPage;
