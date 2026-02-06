import { useSearchParams } from 'react-router';
import { useCallback, useEffect, useRef, useLayoutEffect } from 'react';
import type { FilterCondition, SortOption } from '@/types/common/QueryBuilder';
import useFilterSorting from '@/hooks/useFilterSorting';
import {
	serializeFilters,
	deserializeFilters,
	serializeSorts,
	deserializeSorts,
	getFiltersParamKey,
	getSortsParamKey,
	readFiltersAndSortsFromSession,
	writeFiltersAndSortsToSession,
} from '@/utils/filterPersistence';

interface Props {
	initialFilters?: FilterCondition[];
	initialSorts?: SortOption[];
	debounceTime?: number;
	onFilterChange?: (filters: FilterCondition[]) => void;
	onSortChange?: (sorts: SortOption[]) => void;
	/** When set, filters/sorts are persisted to URL and session storage using this key */
	persistenceKey?: string;
}

/**
 * useFilterSorting with URL persistence (shareable links).
 * Params: {key}_filters and {key}_sorts (JSON). Preserves existing search params (e.g. page).
 *
 * Initial state: URL first (refresh/share), then sessionStorage (tab switch), then defaults.
 */
function getInitialFiltersAndSorts(
	key: string,
	initialFilters: FilterCondition[],
	initialSorts: SortOption[],
): { filters: FilterCondition[]; sorts: SortOption[] } {
	if (typeof window === 'undefined') return { filters: initialFilters, sorts: initialSorts };

	const params = new URLSearchParams(window.location.search);
	const urlFilters = deserializeFilters(params.get(getFiltersParamKey(key)));
	const urlSorts = deserializeSorts(params.get(getSortsParamKey(key)));
	const session = readFiltersAndSortsFromSession(key);

	const urlHasFilters = (urlFilters?.length ?? 0) > 0;
	const urlHasSorts = (urlSorts?.length ?? 0) > 0;
	const sessionHasFilters = (session.filters?.length ?? 0) > 0;
	const sessionHasSorts = (session.sorts?.length ?? 0) > 0;

	if (urlHasFilters || urlHasSorts) {
		return {
			filters: urlHasFilters ? urlFilters! : initialFilters,
			sorts: urlHasSorts ? urlSorts! : initialSorts,
		};
	}
	if (sessionHasFilters || sessionHasSorts) {
		return {
			filters: sessionHasFilters ? session.filters! : initialFilters,
			sorts: sessionHasSorts ? session.sorts! : initialSorts,
		};
	}
	return { filters: initialFilters, sorts: initialSorts };
}

const useFilterSortingWithPersistence = ({
	initialFilters = [],
	initialSorts = [],
	debounceTime = 300,
	onFilterChange,
	onSortChange,
	persistenceKey,
}: Props) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// Hydrate once from URL (window.location); useSearchParams() can be empty on first paint after refresh.
	const initialRef = useRef<{ key: string; filters: FilterCondition[]; sorts: SortOption[] } | null>(null);
	if (persistenceKey && (initialRef.current === null || initialRef.current.key !== persistenceKey)) {
		initialRef.current = {
			key: persistenceKey,
			...getInitialFiltersAndSorts(persistenceKey, initialFilters, initialSorts),
		};
	}
	const hydrated =
		persistenceKey && initialRef.current?.key === persistenceKey
			? { filters: initialRef.current.filters, sorts: initialRef.current.sorts }
			: { filters: initialFilters, sorts: initialSorts };

	const persistToUrlAndSession = useCallback(
		(key: string, filters: FilterCondition[], sorts: SortOption[]) => {
			setSearchParams((prev) => {
				const next = new URLSearchParams(prev);
				const fKey = getFiltersParamKey(key);
				const sKey = getSortsParamKey(key);
				if (filters.length) next.set(fKey, serializeFilters(filters));
				else next.delete(fKey);
				if (sorts.length) next.set(sKey, serializeSorts(sorts));
				else next.delete(sKey);
				return next;
			});
			writeFiltersAndSortsToSession(key, filters, sorts);
		},
		[setSearchParams],
	);

	const result = useFilterSorting({
		initialFilters: hydrated.filters,
		initialSorts: hydrated.sorts,
		debounceTime,
		onFilterChange,
		onSortChange,
	});

	const isMountedRef = useRef(false);
	const skipNextSyncToUrlRef = useRef(true);

	useLayoutEffect(() => {
		if (!persistenceKey) return;
		const params = new URLSearchParams(window.location.search);
		const fromUrlFilters = deserializeFilters(params.get(getFiltersParamKey(persistenceKey)));
		const fromUrlSorts = deserializeSorts(params.get(getSortsParamKey(persistenceKey)));
		if ((fromUrlFilters?.length ?? 0) > 0) result.setFilters(fromUrlFilters!);
		if ((fromUrlSorts?.length ?? 0) > 0) result.setSorts(fromUrlSorts!);
		isMountedRef.current = true;
		writeFiltersAndSortsToSession(persistenceKey, result.filters, result.sorts);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
	}, []);

	useEffect(() => {
		if (!persistenceKey || !isMountedRef.current) return;
		if (skipNextSyncToUrlRef.current) {
			skipNextSyncToUrlRef.current = false;
			return;
		}
		const params = new URLSearchParams(window.location.search);
		const urlFiltersStr = params.get(getFiltersParamKey(persistenceKey))?.trim() ?? '';
		const urlSortsStr = params.get(getSortsParamKey(persistenceKey))?.trim() ?? '';
		const currentFiltersStr = serializeFilters(result.filters);
		const currentSortsStr = serializeSorts(result.sorts);
		if (currentFiltersStr !== urlFiltersStr || currentSortsStr !== urlSortsStr) {
			persistToUrlAndSession(persistenceKey, result.filters, result.sorts);
		} else {
			writeFiltersAndSortsToSession(persistenceKey, result.filters, result.sorts);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only when filters/sorts change
	}, [result.filters, result.sorts, persistenceKey]);

	useEffect(() => {
		if (!persistenceKey || !isMountedRef.current) return;
		const fromUrlFilters = deserializeFilters(searchParams.get(getFiltersParamKey(persistenceKey)));
		const fromUrlSorts = deserializeSorts(searchParams.get(getSortsParamKey(persistenceKey)));
		const filtersMatch = fromUrlFilters && serializeFilters(fromUrlFilters) === serializeFilters(result.filters);
		const sortsMatch = fromUrlSorts && serializeSorts(fromUrlSorts) === serializeSorts(result.sorts);
		if (fromUrlFilters && !filtersMatch) result.setFilters(fromUrlFilters);
		if (fromUrlSorts && !sortsMatch) result.setSorts(fromUrlSorts);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only when URL changes
	}, [searchParams, persistenceKey]);

	return result;
};

export default useFilterSortingWithPersistence;
