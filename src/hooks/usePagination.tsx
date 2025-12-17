import { useSearchParams } from 'react-router';
import { useEffect, useCallback } from 'react';

interface UsePaginationProps {
	initialLimit?: number;
	prefix?: PAGINATION_PREFIX;
}

export enum PAGINATION_PREFIX {
	WALLET_TRANSACTIONS = 'wallet_transactions',
}

const usePagination = ({ initialLimit = 10, prefix }: UsePaginationProps = {}) => {
	const [searchParams, setSearchParams] = useSearchParams();

	// Determine the query parameter key based on prefix
	const pageKey = prefix ? `${prefix}_page` : 'page';
	const page = Number(searchParams.get(pageKey) || '1');

	const reset = useCallback(() => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set(pageKey, '1');
		setSearchParams(newParams);
	}, [searchParams, setSearchParams, pageKey]);

	const setPage = useCallback(
		(newPage: number) => {
			const newParams = new URLSearchParams(searchParams);
			newParams.set(pageKey, String(newPage));
			setSearchParams(newParams);
		},
		[searchParams, setSearchParams, pageKey],
	);

	// Ensure `page` is set in the query parameters
	useEffect(() => {
		if (!searchParams.get(pageKey)) {
			const newParams = new URLSearchParams(searchParams);
			newParams.set(pageKey, '1');
			setSearchParams(newParams);
		}
	}, [searchParams, setSearchParams, pageKey]);

	const limit = initialLimit;
	const offset = limit > 0 ? Math.max((page - 1) * limit, 0) : 0;

	// Expose current page, limit, offset, and a setter for page
	return {
		limit,
		offset,
		page,
		setPage,
		reset,
	};
};

export default usePagination;
