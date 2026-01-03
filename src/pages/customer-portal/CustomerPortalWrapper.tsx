import { useParams, useSearchParams } from 'react-router';
import { RefreshCw, Server, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/atoms/Button';
import CustomerPortal from './CustomerPortal';

/**
 * Wrapper component for CustomerPortal that extracts required parameters:
 * - customerId from URL path params (required)
 * - token from query params (required)
 * - env_id from query params (required)
 *
 * Handles validation and error cases with proper UI components:
 * - Missing customerId: shows error card with refresh option
 * - Missing token: shows authentication error card
 * - Missing env_id: shows environment error card
 */

interface ErrorStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
}

const ErrorState = ({ icon, title, description, actionLabel, onAction }: ErrorStateProps) => (
	<div className='min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12 sm:px-6'>
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className='w-full max-w-lg'>
			<Card className='bg-white border border-[#E9E9E9] rounded-xl shadow-sm'>
				<CardHeader className='text-center pb-6 pt-10 px-8'>
					<div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]/30'>
						<div className='text-zinc-700'>{icon}</div>
					</div>
					<CardTitle className='text-[20px] font-medium text-zinc-950 mb-4 leading-normal'>{title}</CardTitle>
				</CardHeader>
				<CardContent className='text-center px-8 pb-10'>
					<p className='text-base text-zinc-600 mb-8 leading-normal max-w-md mx-auto'>{description}</p>
					{actionLabel && onAction && (
						<Button
							onClick={onAction}
							className='w-full sm:w-auto min-w-[140px] transition-all duration-200 hover:opacity-90'
							variant='outline'>
							<RefreshCw className='w-4 h-4 mr-2' />
							{actionLabel}
						</Button>
					)}
				</CardContent>
			</Card>
		</motion.div>
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
				icon={<User className='h-9 w-9 text-zinc-700' />}
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
				icon={<Shield className='h-9 w-9 text-zinc-700' />}
				title='Authentication Required'
				description='Access token is missing. Please provide a valid token in the query parameters to access this customer portal.'
				actionLabel='Refresh Page'
				onAction={() => window.location.reload()}
			/>
		);
	}

	if (!envId) {
		return (
			<ErrorState
				icon={<Server className='h-9 w-9 text-zinc-700' />}
				title='Environment ID Required'
				description='Environment ID is missing from the URL. Please provide a valid environment ID in the query parameters to access this customer portal.'
				actionLabel='Refresh Page'
				onAction={() => window.location.reload()}
			/>
		);
	}

	// Pass extracted parameters to CustomerPortal
	return <CustomerPortal customerId={customerId} token={token} envId={envId} />;
};

export default CustomerPortalWrapper;
