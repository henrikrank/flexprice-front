import { useParams, useSearchParams } from 'react-router';
import CustomerPortal from './CustomerPortal';

/**
 * Wrapper component for CustomerPortal that extracts required parameters:
 * - customerId from URL path params
 * - token from query params (required)
 * - env_id from query params (optional)
 *
 * Handles validation and error cases:
 * - Missing customerId: redirects to error or shows error message
 * - Missing token: shows error message (token is required for authentication)
 * - Missing env_id: allows request to proceed (env_id is optional, backend may handle default)
 */
const CustomerPortalWrapper = () => {
	const { customerId } = useParams<{ customerId: string }>();
	const [searchParams] = useSearchParams();

	const token = searchParams.get('token');
	const envId = searchParams.get('env_id');

	// Validate required parameters
	if (!customerId) {
		// Customer ID is required from path params
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-red-600 mb-2'>Invalid Customer Portal Link</h1>
					<p className='text-gray-600'>Customer ID is missing from the URL.</p>
				</div>
			</div>
		);
	}

	if (!token) {
		// Token is required for authentication
		return (
			<div className='flex items-center justify-center min-h-screen'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold text-red-600 mb-2'>Authentication Required</h1>
					<p className='text-gray-600'>Access token is missing. Please provide a valid token in the query parameters.</p>
				</div>
			</div>
		);
	}

	// Pass extracted parameters to CustomerPortal
	return <CustomerPortal customerId={customerId} token={token} envId={envId || null} />;
};

export default CustomerPortalWrapper;
