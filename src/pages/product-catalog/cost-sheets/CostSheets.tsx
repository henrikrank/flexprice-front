import { AddButton, Page, ActionButton, Chip } from '@/components/atoms';
import { ApiDocsContent, CostSheetDrawer } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { ColumnData } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import CostSheet from '@/models/CostSheet';
import GUIDES from '@/constants/guides';
import { useState, useMemo } from 'react';
import CostSheetApi from '@/api/CostSheetApi';
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
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatChips from '@/utils/common/format_chips';
import formatDate from '@/utils/common/format_date';

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
		field: 'lookup_key',
		label: 'Lookup Key',
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

const CostSheetsPage = () => {
	const [activeCostSheet, setActiveCostSheet] = useState<CostSheet | null>(null);
	const [costSheetDrawerOpen, setCostSheetDrawerOpen] = useState(false);
	const navigate = useNavigate();

	const handleOnAdd = () => {
		setActiveCostSheet(null);
		setCostSheetDrawerOpen(true);
	};

	const handleEdit = (costSheet: CostSheet) => {
		setActiveCostSheet(costSheet);
		setCostSheetDrawerOpen(true);
	};

	const columns: ColumnData<CostSheet>[] = useMemo(
		() => [
			{
				fieldName: 'name',
				title: 'Cost Sheet Name',
			},
			{
				fieldName: 'lookup_key',
				title: 'Lookup Key',
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
								return await CostSheetApi.DeleteCostSheet(row?.id);
							}}
							refetchQueryKey='fetchCostSheets'
							entityName={row?.name}
							edit={{
								enabled: true,
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
		<Page heading='Cost Sheets' headingCTA={<AddButton onClick={handleOnAdd} />}>
			<CostSheetDrawer
				data={activeCostSheet}
				open={costSheetDrawerOpen}
				onOpenChange={setCostSheetDrawerOpen}
				refetchQueryKeys={['fetchCostSheets']}
			/>
			<ApiDocsContent tags={[...API_DOCS_TAGS.Costs]} />
			<div className='space-y-6'>
				<QueryableDataArea<CostSheet>
					queryConfig={{
						filterOptions,
						sortOptions: sortingOptions,
						initialFilters,
						initialSorts,
						debounceTime: 500,
					}}
					dataConfig={{
						queryKey: 'fetchCostSheets',
						fetchFn: async (params) => CostSheetApi.GetCostSheetsByFilter(params),
						probeFetchFn: async (params) =>
							CostSheetApi.GetCostSheetsByFilter({
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
							navigate(RouteNames.costSheetDetails + `/${row?.id}`);
						},
						showEmptyRow: true,
					}}
					paginationConfig={{
						unit: 'Cost Sheets',
					}}
					emptyStateConfig={{
						heading: 'Cost Sheets',
						description: 'Create your first cost sheet to define pricing structures and charges.',
						buttonLabel: 'Create Cost Sheet',
						buttonAction: handleOnAdd,
						tags: [...API_DOCS_TAGS.Costs],
						tutorials: GUIDES.features.tutorials,
					}}
				/>
			</div>
		</Page>
	);
};
export default CostSheetsPage;
