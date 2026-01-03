import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { setRuntimeCredentials, clearRuntimeCredentials } from '@/core/axios/config';
import CustomerApi from '@/api/CustomerApi';
import WalletApi from '@/api/WalletApi';
import { Customer } from '@/models';
import { Loader } from '@/components/atoms';
import { PortalHeader, OverviewTab, InvoicesTab, WalletTab, UsageEventsTab } from '@/components/customer-portal';
import { cn } from '@/lib/utils';

/**
 * Customer Portal Page
 *
 * This is an out-of-auth-scope page similar to Stripe's customer portal.
 * It operates independently of the main application's authentication system.
 *
 * Required Parameters:
 * - customerId: Extracted from URL path parameter
 * - token: Access token (typically Supabase access token) passed via query parameter `token`
 * - env_id: Environment ID passed via query parameter `env_id` (required)
 *
 * This page uses runtime credential override to set credentials dynamically,
 * allowing existing API classes to work in stateless contexts.
 */
interface CustomerPortalProps {
	customerId: string;
	token: string;
	envId: string;
}

enum PortalTab {
	OVERVIEW = 'overview',
	CREDITS = 'credits',
	INVOICES = 'invoices',
	EVENTS = 'events',
}

const CustomerPortal = ({ customerId, token, envId }: CustomerPortalProps) => {
	const [activeTab, setActiveTab] = useState<PortalTab>(PortalTab.OVERVIEW);

	useEffect(() => {
		// Set runtime credentials for this session
		setRuntimeCredentials(token, envId);

		// Cleanup on unmount
		return () => clearRuntimeCredentials();
	}, [token, envId]);

	// Fetch customer data
	const {
		data: customerData,
		isLoading: customerLoading,
		isError: customerError,
		error,
	} = useQuery<Customer>({
		queryKey: ['portal-customer', customerId, token, envId],
		queryFn: async () => {
			return await CustomerApi.getCustomerById(customerId);
		},
		enabled: !!customerId && !!token && !!envId,
		retry: 1,
		staleTime: 0,
		gcTime: 0,
	});

	// Check if customer has wallets (to conditionally show wallet tab)
	const { data: wallets } = useQuery({
		queryKey: ['portal-wallets-check', customerId],
		queryFn: () => WalletApi.getCustomerWallets({ id: customerId }),
		enabled: !!customerId && !!token && !!envId,
	});

	// Show toast notification for errors
	useEffect(() => {
		if (customerError) {
			const err = error as any;
			toast.error(err?.error?.message || err?.message || 'Failed to fetch customer data');
		}
	}, [customerError, error]);

	if (customerLoading) {
		return (
			<div className='min-h-screen bg-[#fafafa] flex items-center justify-center'>
				<Loader />
			</div>
		);
	}

	if (customerError) {
		return null; // Error is handled by toast notification
	}

	if (!customerData) {
		return (
			<div className='min-h-screen bg-[#fafafa] flex items-center justify-center'>
				<p className='text-zinc-500'>No customer found</p>
			</div>
		);
	}

	const hasWallets = wallets && wallets.length > 0;

	const tabs: { id: PortalTab; label: string; show: boolean }[] = [
		{ id: PortalTab.OVERVIEW, label: 'Overview', show: true },
		{ id: PortalTab.CREDITS, label: 'Credits', show: hasWallets || false },
		{ id: PortalTab.INVOICES, label: 'Invoices', show: true },
		{ id: PortalTab.EVENTS, label: 'Usage', show: true },
	];

	const visibleTabs = tabs.filter((tab) => tab.show);

	return (
		<div className='min-h-screen bg-[#fafafa]'>
			{/* Header */}
			<PortalHeader customer={customerData} />

			{/* Main Content */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3 }}
				className='max-w-6xl mx-auto px-4 sm:px-6 py-6'>
				{/* Tab Navigation */}
				<div className='mb-6'>
					<div className='flex space-x-1 bg-white border border-[#E9E9E9] rounded-lg p-1 w-fit'>
						{visibleTabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={cn(
									'px-4 py-2 text-sm font-medium rounded-md transition-colors',
									activeTab === tab.id ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
								)}>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{/* Tab Content */}
				<div>
					{activeTab === PortalTab.OVERVIEW && <OverviewTab customerId={customerId} />}
					{activeTab === PortalTab.CREDITS && hasWallets && <WalletTab customerId={customerId} />}
					{activeTab === PortalTab.INVOICES && <InvoicesTab customerId={customerId} />}
					{activeTab === PortalTab.EVENTS && <UsageEventsTab customerId={customerId} />}
				</div>

				{/* Footer */}
				<div className='mt-12 pt-6 border-t border-[#E9E9E9] text-center'>
					<p className='text-xs text-zinc-400'>
						Powered by{' '}
						<a
							href='https://flexprice.io'
							target='_blank'
							rel='noopener noreferrer'
							className='text-zinc-500 hover:text-zinc-700 transition-colors'>
							Flexprice
						</a>
					</p>
				</div>
			</motion.div>
		</div>
	);
};

export default CustomerPortal;
