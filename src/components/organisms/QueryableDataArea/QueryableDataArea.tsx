import { memo, useCallback, useMemo } from 'react';
import { QueryBuilder } from '@/components/molecules';
import { Loader, ShortPagination, Spacer, Button, Card } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import usePagination from '@/hooks/usePagination';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import useFilterSorting from '@/hooks/useFilterSorting';
import { useQueryWithEmptyState } from '@/hooks/useQueryWithEmptyState';
import { FilterField, FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Configuration for filtering and sorting functionality.
 * Controls the QueryBuilder component behavior and initial state.
 */
export interface QueryConfig {
	/** Available filter fields that users can filter by */
	filterOptions: FilterField[];
	/** Available sort options that users can sort by */
	sortOptions?: SortOption[];
	/** Initial filter conditions to apply on mount */
	initialFilters?: FilterCondition[];
	/** Initial sort options to apply on mount */
	initialSorts?: SortOption[];
	/** Debounce time in milliseconds for filter changes (default: 300) */
	debounceTime?: number;
}

/**
 * Configuration for data fetching.
 * Defines how data is fetched from the API and cached.
 */
export interface DataConfig<T> {
	/** Unique key for React Query cache (e.g., 'fetchCustomers') */
	queryKey: string;
	/** Main function to fetch data. Receives pagination, filters, and sort params */
	fetchFn: (params: {
		limit: number;
		offset: number;
		filters: any[];
		sort: any[];
		[key: string]: any;
	}) => Promise<{ items: T[]; pagination: { total?: number } }>;
	/** Optional probe function to check if any data exists (for empty state detection) */
	probeFetchFn?: (params: {
		limit: number;
		offset: number;
		filters: any[];
		sort: any[];
		[key: string]: any;
	}) => Promise<{ items: T[]; pagination: { total?: number } }>;
	/** Additional query parameters to pass to fetch functions */
	additionalQueryParams?: Record<string, any>;
}

/**
 * Configuration for table rendering.
 * Controls how the data table is displayed and behaves.
 */
export interface TableConfig<T> {
	/** Column definitions for the table */
	columns: ColumnData<T>[];
	/** Optional callback when a row is clicked */
	onRowClick?: (row: T) => void;
	/** Show an empty row when there's no data (default: false) */
	showEmptyRow?: boolean;
	/** Hide the bottom border of the table (default: false) */
	hideBottomBorder?: boolean;
	/** Visual variant of the table (default: 'default') */
	variant?: 'default' | 'no-bordered';
}

/**
 * Configuration for pagination.
 * Controls pagination behavior and display.
 */
export interface PaginationConfig {
	/** Display label for pagination (e.g., 'Customers', 'Plans') */
	unit?: string;
	/** Initial number of items per page (default: 10) */
	initialLimit?: number;
	/** URL parameter prefix for pagination state (e.g., 'wallet_transactions') */
	prefix?: string;
}

/**
 * Configuration for empty state display.
 * Shown when no data is available after filtering.
 */
export interface EmptyStateConfig {
	/** Heading text for empty state */
	heading?: string;
	/** Description text for empty state */
	description?: string;
	/** Label for the action button */
	buttonLabel?: string;
	/** Callback when action button is clicked */
	buttonAction?: () => void;
	/** API documentation tags to show */
	tags?: string[];
	/** Tutorial cards to display */
	tutorials?: any[];
}

/**
 * Main props interface for QueryableDataArea component.
 *
 * This component provides a complete data table solution with:
 * - Filtering and sorting via QueryBuilder
 * - Pagination
 * - Data fetching with React Query
 * - Empty state handling
 * - Error handling
 *
 * The component is optimized to only re-render the data area when query parameters change,
 * keeping the QueryBuilder stable to prevent unnecessary re-renders.
 */
export interface QueryableDataAreaProps<T = any> {
	/** Query configuration: filtering and sorting */
	queryConfig: QueryConfig;
	/** Data configuration: fetching and caching */
	dataConfig: DataConfig<T>;
	/** Table configuration: columns and display options */
	tableConfig: TableConfig<T>;
	/** Pagination configuration */
	paginationConfig?: PaginationConfig;
	/** Empty state configuration */
	emptyStateConfig?: EmptyStateConfig;
	/** Optional error handler callback */
	onError?: (error: any) => void;
}

// Stable QueryBuilder wrapper - memoized to prevent re-renders
const QueryBuilderWrapper = memo<{
	filterOptions: FilterField[];
	sortOptions?: SortOption[];
	filters: FilterCondition[];
	sorts: SortOption[];
	onFilterChange: (filters: FilterCondition[]) => void;
	onSortChange: (sorts: SortOption[]) => void;
}>(({ filterOptions, sortOptions, filters, sorts, onFilterChange, onSortChange }) => {
	return (
		<QueryBuilder
			filterOptions={filterOptions}
			filters={filters}
			onFilterChange={onFilterChange}
			sortOptions={sortOptions}
			onSortChange={onSortChange}
			selectedSorts={sorts}
		/>
	);
});

QueryBuilderWrapper.displayName = 'QueryBuilderWrapper';

// Data area component - re-renders when query params change
const DataArea = <T,>({
	sanitizedFilters,
	sanitizedSorts,
	dataConfig,
	tableConfig,
	paginationConfig,
	page,
	limit,
	offset,
	reset,
	emptyStateConfig,
	onError,
}: {
	sanitizedFilters: any[];
	sanitizedSorts: any[];
	dataConfig: DataConfig<T>;
	tableConfig: TableConfig<T>;
	paginationConfig?: PaginationConfig;
	page: number;
	limit: number;
	offset: number;
	reset: () => void;
	emptyStateConfig?: EmptyStateConfig;
	onError?: (error: any) => void;
}) => {
	// Reset pagination when filters or sorts change
	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	// Create fetch function with all params
	const fetchData = useCallback(async () => {
		return await dataConfig.fetchFn({
			limit,
			offset,
			filters: sanitizedFilters,
			sort: sanitizedSorts,
			...dataConfig.additionalQueryParams,
		});
	}, [dataConfig, limit, offset, sanitizedFilters, sanitizedSorts]);

	// Create probe fetch function
	const probeFetch = useCallback(async () => {
		if (dataConfig.probeFetchFn) {
			return await dataConfig.probeFetchFn({
				limit: 1,
				offset: 0,
				filters: [],
				sort: [],
				...dataConfig.additionalQueryParams,
			});
		}
		// Default probe: use main fetch with limit 1
		return await dataConfig.fetchFn({
			limit: 1,
			offset: 0,
			filters: [],
			sort: [],
			...dataConfig.additionalQueryParams,
		});
	}, [dataConfig]);

	// Data fetching with empty state detection
	const { data, isLoading, isError, error, probeData } = useQueryWithEmptyState({
		main: {
			queryKey: [dataConfig.queryKey, page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: fetchData,
		},
		probe: {
			queryKey: [dataConfig.queryKey, 'probe', page, JSON.stringify(sanitizedFilters), JSON.stringify(sanitizedSorts)],
			queryFn: probeFetch,
		},
		shouldProbe: (mainData) => {
			return mainData?.items.length === 0;
		},
	});

	// Show empty page when no data exists
	const showEmptyPage = useMemo(() => {
		return !isLoading && probeData?.items.length === 0 && data?.items.length === 0;
	}, [isLoading, probeData, data]);

	// Handle errors
	if (isError) {
		const errorMessage = error as any;
		toast.error(errorMessage?.error?.message || 'Error fetching data');
		if (onError) {
			onError(error);
		}
		return (
			<div className='flex justify-center items-center min-h-[200px]'>
				<div>Error fetching data</div>
			</div>
		);
	}

	// Show empty state - render simple empty state without Page wrapper
	if (showEmptyPage && emptyStateConfig) {
		return (
			<div className='space-y-6'>
				<div className='bg-[#fafafa] border border-[#E9E9E9] rounded-xl w-full h-[360px] flex flex-col items-center justify-center mx-auto'>
					{emptyStateConfig.heading && (
						<div className='font-medium text-[20px] leading-normal text-gray-700 mb-4 text-center'>{emptyStateConfig.heading}</div>
					)}
					{emptyStateConfig.description && (
						<div className='font-normal bg-[#F9F9F9] text-[16px] leading-normal text-gray-400 mb-8 text-center max-w-[350px]'>
							{emptyStateConfig.description}
						</div>
					)}
					{emptyStateConfig.buttonAction && emptyStateConfig.buttonLabel && (
						<Button variant='outline' onClick={emptyStateConfig.buttonAction} className='!p-5 !bg-[#fbfbfb] !border-[#CFCFCF]'>
							{emptyStateConfig.buttonLabel}
						</Button>
					)}
				</div>
				{emptyStateConfig.tags && <ApiDocsContent tags={emptyStateConfig.tags} />}
				{emptyStateConfig.tutorials && emptyStateConfig.tutorials.length > 0 && (
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10'>
						{emptyStateConfig.tutorials.map((item: any, index: number) => {
							const imageUrl =
								item.imageUrl && item.imageUrl.trim() !== ''
									? item.imageUrl
									: 'https://mintlify.s3.us-west-1.amazonaws.com/flexprice/UsageBaseMetering(1).jpg';
							return (
								<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key={index}>
									<Card
										className='h-full group bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-100 hover:bg-slate-50 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 flex flex-col max-w-[280px] mx-auto p-4 bg-gradient-to-r from-[#ffffff] to-[#fcfcfc]'
										onClick={item.onClick}>
										<div className='w-full h-[80px] aspect-video rounded-t-lg overflow-hidden bg-[#f5f5f5] flex items-center justify-center'>
											<img src={imageUrl} loading='lazy' className='object-cover bg-gray-100 w-full h-full' alt=' ' />
										</div>
										<div className='flex-1 flex flex-col justify-between mt-4'>
											<div>
												<h3 className='text-slate-800 text-base font-medium group-hover:text-gray-600 transition-colors duration-200 text-left'>
													{item.title}
												</h3>
											</div>
											<div className='flex items-center gap-1 mt-8 text-slate-400 group-hover:text-gray-500 transition-all duration-200 text-left'>
												<span className='text-xs font-regular'>Learn More</span>
												<ArrowRight className='w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200' />
											</div>
										</div>
									</Card>
								</motion.div>
							);
						})}
					</div>
				)}
			</div>
		);
	}

	// Loading state
	if (isLoading) {
		return (
			<div className='flex justify-center items-center min-h-[200px]'>
				<Loader />
			</div>
		);
	}

	// Render table with data
	return (
		<>
			<FlexpriceTable
				columns={tableConfig.columns}
				data={data?.items || []}
				onRowClick={tableConfig.onRowClick}
				showEmptyRow={tableConfig.showEmptyRow}
				hideBottomBorder={tableConfig.hideBottomBorder}
				variant={tableConfig.variant}
			/>
			{paginationConfig?.unit && (
				<>
					<Spacer className='!h-4' />
					<ShortPagination unit={paginationConfig.unit} totalItems={data?.pagination.total ?? 0} prefix={paginationConfig.prefix as any} />
				</>
			)}
		</>
	);
};

/**
 * QueryableDataArea Component
 *
 * A comprehensive data table component with built-in filtering, sorting, pagination,
 * and empty state handling. Optimized to minimize re-renders by isolating the data
 * area from the query builder.
 *
 * @example
 * ```tsx
 * <QueryableDataArea<Customer>
 *   queryConfig={{
 *     filterOptions: customerFilterOptions,
 *     sortOptions: customerSortOptions,
 *     initialFilters: defaultFilters,
 *     debounceTime: 300,
 *   }}
 *   dataConfig={{
 *     queryKey: 'fetchCustomers',
 *     fetchFn: CustomerApi.getCustomersByFilters,
 *   }}
 *   tableConfig={{
 *     columns: customerColumns,
 *     onRowClick: (customer) => navigate(`/customers/${customer.id}`),
 *     showEmptyRow: true,
 *   }}
 *   paginationConfig={{
 *     unit: 'Customers',
 *     initialLimit: 10,
 *   }}
 *   emptyStateConfig={{
 *     heading: 'No Customers',
 *     description: 'Create your first customer to get started.',
 *     buttonLabel: 'Create Customer',
 *     buttonAction: handleCreate,
 *   }}
 * />
 * ```
 */
const QueryableDataArea = <T = any,>({
	queryConfig,
	dataConfig,
	tableConfig,
	paginationConfig,
	emptyStateConfig,
	onError,
}: QueryableDataAreaProps<T>) => {
	// Pagination
	const { limit, offset, page, reset } = usePagination({
		initialLimit: paginationConfig?.initialLimit ?? 10,
		prefix: paginationConfig?.prefix as any,
	});

	// Filter and sort state
	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSorting({
		initialFilters: queryConfig.initialFilters ?? [],
		initialSorts: queryConfig.initialSorts ?? [],
		debounceTime: queryConfig.debounceTime ?? 300,
	});

	return (
		<div>
			{/* Stable QueryBuilder - doesn't re-render */}
			<QueryBuilderWrapper
				filterOptions={queryConfig.filterOptions}
				sortOptions={queryConfig.sortOptions}
				filters={filters}
				sorts={sorts}
				onFilterChange={setFilters}
				onSortChange={setSorts}
			/>

			{/* Data area - re-renders when query params change */}
			<DataArea<T>
				sanitizedFilters={sanitizedFilters}
				sanitizedSorts={sanitizedSorts}
				dataConfig={dataConfig}
				tableConfig={tableConfig}
				paginationConfig={paginationConfig}
				page={page}
				limit={limit}
				offset={offset}
				reset={reset}
				emptyStateConfig={emptyStateConfig}
				onError={onError}
			/>
		</div>
	);
};

export default QueryableDataArea;
