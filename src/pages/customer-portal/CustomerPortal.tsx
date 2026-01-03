import { useMemo } from 'react';
import { createStatelessClient } from '@/core/axios/verbs';

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
 * This page uses a stateless axios client that extracts credentials from query parameters
 * on each request, making it suitable for embedded or shared portal experiences.
 */
interface CustomerPortalProps {
	customerId: string;
	token: string;
	envId: string | null;
}

const CustomerPortal = ({ customerId, token, envId }: CustomerPortalProps) => {
	// Create stateless axios client that uses the provided token and env_id
	// This client will automatically include the token and env_id in all requests
	// The client is ready to use for API calls - implement portal features as needed
	const statelessClient = useMemo(() => {
		return createStatelessClient(
			() => token, // getToken function
			() => envId, // getEnvId function
		);
	}, [token, envId]);

	// Example usage of the stateless client:
	// const fetchCustomerData = async () => {
	//   try {
	//     const data = await statelessClient.get(`/customers/${customerId}`);
	//     return data;
	//   } catch (error) {
	//     console.error('Error fetching customer data:', error);
	//   }
	// };

	// Note: statelessClient is ready to use for API calls
	// It will be used when implementing portal features (invoices, subscriptions, etc.)
	// For now, we reference it to satisfy the linter - remove this when implementing features
	void statelessClient;

	return (
		<div>
			<h1>Customer Portal</h1>
			<p>Customer ID: {customerId}</p>
			{/* The statelessClient is available for making API calls */}
			{/* All requests will automatically include the token and env_id */}
		</div>
	);
};

export default CustomerPortal;
