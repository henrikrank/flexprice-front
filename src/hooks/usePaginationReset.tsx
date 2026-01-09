import { useEffect, useRef } from 'react';
import { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { TypedBackendSort } from '@/types/formatters/QueryBuilder';

/**
 * Custom hook to reset pagination only when filters or sorts actually change
 * Uses refs to track previous values and avoids expensive stringify operations
 *
 * @param reset - Function to reset pagination to page 1
 * @param filters - Current sanitized filters
 * @param sorts - Current sanitized sorts
 */
export const usePaginationReset = (reset: () => void, filters: TypedBackendFilter[], sorts: TypedBackendSort[]) => {
	const prevFiltersRef = useRef<string | null>(null);
	const prevSortsRef = useRef<string | null>(null);
	const isInitialMount = useRef(true);

	useEffect(() => {
		// Skip on initial mount - don't reset pagination when component first loads
		if (isInitialMount.current) {
			isInitialMount.current = false;
			// Store initial values
			prevFiltersRef.current = JSON.stringify(filters);
			prevSortsRef.current = JSON.stringify(sorts);
			return;
		}

		// Only stringify when we need to compare (not on every render)
		const currentFiltersKey = JSON.stringify(filters);
		const currentSortsKey = JSON.stringify(sorts);

		// Only reset if filters or sorts actually changed
		const filtersChanged = prevFiltersRef.current !== currentFiltersKey;
		const sortsChanged = prevSortsRef.current !== currentSortsKey;

		if (filtersChanged || sortsChanged) {
			reset();
			prevFiltersRef.current = currentFiltersKey;
			prevSortsRef.current = currentSortsKey;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters, sorts]); // Dependencies are arrays, but we compare by value
};
