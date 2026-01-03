import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { setRuntimeCredentials, clearRuntimeCredentials } from '@/core/axios/config';
import CustomerApi from '@/api/CustomerApi';
import { Customer } from '@/models';

/**
 * Customer Portal Page
 *
 * This is an out-of-auth-scope page similar to Stripe's customer portal.
 * It operates independently of the main application's authentication system.
 *
 * Required Parameters:
 * - customerId: Extracted from URL path parameter
 * - token: Access token (typically Supabase access token) passed via query parameter `token`
 * - env_id: Environment ID passed via query parameter `env_id` (optional but recommended)
 *
 * This page uses runtime credential override to set credentials dynamically,
 * allowing existing API classes to work in stateless contexts.
 */
interface CustomerPortalProps {
	customerId: string;
	token: string;
	envId: string | null;
}

const CustomerPortal = ({ customerId, token, envId }: CustomerPortalProps) => {
	useEffect(() => {
		// Set runtime credentials for this session
		setRuntimeCredentials(token, envId);

		// Cleanup on unmount
		return () => clearRuntimeCredentials();
	}, [token, envId]);

	const {
		data: customerData,
		isLoading,
		isError,
		error,
	} = useQuery<Customer>({
		queryKey: ['customer', customerId, token, envId],
		queryFn: async () => {
			// Use existing API classes - they now use runtime credentials
			return await CustomerApi.getCustomerById(customerId);
		},
		enabled: !!customerId && !!token,
		retry: 1,
		staleTime: 0, // Always fetch fresh data for customer portal
		gcTime: 0, // Don't cache data for customer portal
	});

	// Show toast notification for errors
	useEffect(() => {
		if (isError) {
			const err = error as any;
			toast.error(err?.error?.message || err?.message || 'Failed to fetch customer data');
		}
	}, [isError, error]);

	if (isLoading) return <div>Loading...</div>;
	if (isError) return null; // Error is handled by toast notification
	if (!customerData) return <div>No customer found</div>;

	return (
		<div>
			<h1>Customer Portal</h1>
			<p>Customer: {customerData.name}</p>
			<p>Email: {customerData.email}</p>
		</div>
	);
};

export default CustomerPortal;
