import { useParams, useSearchParams } from 'react-router';
import { RefreshCw, Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import CustomerPortal from './CustomerPortal';

/**
 * Wrapper component for CustomerPortal that extracts required parameters:
 * - customerId from URL path params
 * - token from query params (required)
 * - env_id from query params (optional)
 *
 * Handles validation and error cases with proper UI components:
 * - Missing customerId: shows error card with refresh option
 * - Missing token: shows authentication error card
 * - Missing env_id: allows request to proceed (env_id is optional, backend may handle default)
 */

interface ErrorStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

const ErrorState = ({ icon, title, description, actionLabel, onAction }: ErrorStateProps) => (
	<div className='min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12'>
		<Card className='w-full max-w-md'>
			<CardHeader className='text-center pb-4'>
				<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50'>{icon}</div>
				<CardTitle className='text-xl font-semibold text-gray-900'>{title}</CardTitle>
			</CardHeader>
			<CardContent className='text-center'>
				<p className='text-gray-600 mb-6'>{description}</p>
				{actionLabel && onAction && (
					<Button onClick={onAction} className='w-full' variant='outline'>
						<RefreshCw className='w-4 h-4 mr-2' />
						{actionLabel}
					</Button>
				)}
			</CardContent>
		</Card>
	</div>
);
const CustomerPortalWrapper = () => {
	const { customerId } = useParams<{ customerId: string }>();
	const [searchParams] = useSearchParams();

	const token = searchParams.get('token');
	const envId = searchParams.get('env_id');

	// Validate required parameters
	if (!customerId) {
		return (
			<ErrorState
				icon={<User className='h-8 w-8 text-red-500' />}
				title='Invalid Customer Portal Link'
				description='Customer ID is missing from the URL. Please check your link and try again.'
				actionLabel='Refresh Page'
				onAction={() => window.location.reload()}
			/>
		);
	}

	if (!token) {
		return (
			<ErrorState
				icon={<Shield className='h-8 w-8 text-red-500' />}
				title='Authentication Required'
				description='Access token is missing. Please provide a valid token in the query parameters to access this customer portal.'
				actionLabel='Refresh Page'
				onAction={() => window.location.reload()}
			/>
		);
	}

	// Pass extracted parameters to CustomerPortal
	return <CustomerPortal customerId={customerId} token={token} envId={envId || null} />;
};

export default CustomerPortalWrapper;
