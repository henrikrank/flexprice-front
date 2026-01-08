import { AddButton, Loader, Page, ShortPagination, Spacer } from '@/components/atoms';
import { ApiDocsContent, PriceUnitDrawer, PriceUnitTable, QueryBuilder } from '@/components/molecules';
import { PriceUnit } from '@/models/PriceUnit';
import { EmptyPage } from '@/components/organisms';
import usePagination from '@/hooks/usePagination';
import { useState, useEffect, useMemo } from 'react';
import { PriceUnitApi } from '@/api/PriceUnitApi';
import toast from 'react-hot-toast';
import useFilterSorting from '@/hooks/useFilterSorting';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
} from '@/types/common/QueryBuilder';
import { ENTITY_STATUS } from '@/models';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';

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
		operators: [FilterOperator.IS_ANY_OF, FilterOperator.IS_NOT_ANY_OF],
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

const PriceUnitsPage = () => {
	const { limit, offset, page, reset } = usePagination();
	const [activePriceUnit, setActivePriceUnit] = useState<PriceUnit | null>(null);
	const [priceUnitDrawerOpen, setPriceUnitDrawerOpen] = useState(false);

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: [
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
				operator: FilterOperator.IS_ANY_OF,
				valueArray: [ENTITY_STATUS.PUBLISHED],
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
		debounceTime: 300,
	});

	useEffect(() => {
		reset();
	}, [sanitizedFilters, sanitizedSorts]);

	const fetchPriceUnits = async () => {
		return await PriceUnitApi.ListPriceUnitsByFilter({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
		});
	};

	const {
		data: priceUnitsData,
		isLoading,
		probeData,
		isError,
		error,
	} = useQueryWithEmptyState({
		main: {
			queryKey: ['fetchPriceUnits', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchPriceUnits,
		},
		probe: {
			queryKey: ['fetchPriceUnits', 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: async () => {
				return await PriceUnitApi.ListPriceUnitsByFilter({
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

	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && priceUnitsData?.items.length === 0;
	}, [isLoading, probeData, priceUnitsData]);

	const handleOnAdd = () => {
		setActivePriceUnit(null);
		setPriceUnitDrawerOpen(true);
	};

	if (isError) {
		const err = error as any;
		toast.error(err?.error?.message || 'Error fetching price units');
		return null;
	}

	if (isLoading) {
		return <Loader />;
	}

	if (showEmptyPage) {
		return (
			<div className='space-y-6'>
				<PriceUnitDrawer
					data={activePriceUnit}
					open={priceUnitDrawerOpen}
					onOpenChange={setPriceUnitDrawerOpen}
					refetchQueryKeys={['fetchPriceUnits']}
				/>
				<EmptyPage
					onAddClick={handleOnAdd}
					emptyStateCard={{
						heading: 'Create Your First Price Unit',
						description: 'Create a price unit to define custom currencies or tokens for pricing.',
						buttonLabel: 'Create Price Unit',
						buttonAction: handleOnAdd,
					}}
					heading='Price Units'
					tags={['Price Units']}
				/>
			</div>
		);
	}

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
						<PriceUnitTable
							data={(priceUnitsData?.items || []) as PriceUnit[]}
							onEdit={(priceUnit) => {
								setActivePriceUnit(priceUnit);
								setPriceUnitDrawerOpen(true);
							}}
						/>
						<Spacer className='!h-4' />
						<ShortPagination unit='Price Units' totalItems={priceUnitsData?.pagination.total ?? 0} />
					</>
				)}
			</div>
		</Page>
	);
};

export default PriceUnitsPage;
