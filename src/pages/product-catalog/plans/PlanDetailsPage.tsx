// React imports
import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router';

// Third-party libraries
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Pencil, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Internal components
import { Button, CopyIdButton, Loader, Page } from '@/components/atoms';
import { ApiDocsContent, PlanDrawer } from '@/components/molecules';

// API imports
import { PlanApi } from '@/api';

// Core services and routes
import { RouteNames } from '@/core/routes/Routes';

// Models and types
import { Plan, ENTITY_STATUS } from '@/models';

// Constants and utilities
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { ServerError } from '@/core/axios/types';
import { INVOICE_CADENCE } from '@/models';

export const formatInvoiceCadence = (cadence: string): string => {
	switch (cadence.toUpperCase()) {
		case INVOICE_CADENCE.ADVANCE:
			return 'Advance';
		case INVOICE_CADENCE.ARREAR:
			return 'Arrear';
		default:
			return '--';
	}
};

const tabs = [
	{ id: '', label: 'Overview' },
	{ id: 'entitlements', label: 'Entitlements' },
	{ id: 'credit-grants', label: 'Credit Grants' },
	{ id: 'information', label: 'Information' },
] as const;

type TabId = (typeof tabs)[number]['id'];

const getActiveTab = (pathTabId: string): TabId => {
	const validTabId = tabs.find((tab) => tab.id === pathTabId);
	return validTabId ? validTabId.id : '';
};

type Params = {
	planId: string;
};

const PlanDetailsPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { planId } = useParams<Params>();
	const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id);
	const [planDrawerOpen, setPlanDrawerOpen] = useState(false);

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			return await PlanApi.getPlanById(planId!);
		},
		enabled: !!planId,
	});

	const { mutate: archivePlan } = useMutation({
		mutationFn: async () => {
			return await PlanApi.deletePlan(planId!);
		},
		onSuccess: () => {
			toast.success('Plan archived successfully');
			navigate(RouteNames.plan);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to archive plan');
		},
	});

	const { mutate: syncPlan, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(planId!),
		onSuccess: () => {
			toast.success('Sync has been started and will take up to 1 hour to complete.');
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error synchronizing plan with subscriptions');
		},
	});

	const { updateBreadcrumb, setSegmentLoading } = useBreadcrumbsStore();

	// Handle tab changes based on URL
	useEffect(() => {
		const currentPath = location.pathname.split('/');
		// Path structure: /product-catalog/plan/:planId/:tabId
		// So index 4 would be the tabId (or empty for overview)
		const pathTabId = currentPath[4] || '';
		const newActiveTab = getActiveTab(pathTabId);
		setActiveTab(newActiveTab);
	}, [location.pathname]);

	// Update breadcrumbs based on active tab
	useEffect(() => {
		if (activeTab !== '') {
			setSegmentLoading(3, true);
		}

		const activeTabData = tabs.find((tab) => tab.id === activeTab);
		setSegmentLoading(2, true);

		if (activeTab !== '' && activeTabData) {
			updateBreadcrumb(3, activeTabData.label);
		}
		if (planData?.name) {
			updateBreadcrumb(2, planData.name);
		}
	}, [activeTab, updateBreadcrumb, setSegmentLoading, planData]);

	const onTabChange = (tabId: TabId) => {
		if (tabId === '') {
			navigate(`${RouteNames.plan}/${planId}`);
		} else {
			navigate(`${RouteNames.plan}/${planId}/${tabId}`);
		}
	};

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading plan data');
		return null;
	}

	if (!planData) {
		toast.error('No plan data available');
		return null;
	}

	return (
		<Page
			documentTitle={planData.name}
			heading={
				<div className='flex items-center gap-2'>
					<span>{planData.name}</span>
					{planData.id && <CopyIdButton id={planData.id} entityType='Plan' />}
				</div>
			}
			headingCTA={
				<>
					<Button onClick={() => syncPlan()} disabled={isSyncing} isLoading={isSyncing} variant={'outline'} className='flex gap-2'>
						<RefreshCw />
						Plan Sync
					</Button>

					<Button onClick={() => setPlanDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button
						onClick={() => archivePlan()}
						disabled={planData?.status !== ENTITY_STATUS.PUBLISHED}
						variant={'outline'}
						className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<PlanDrawer data={planData as Plan} open={planDrawerOpen} onOpenChange={setPlanDrawerOpen} refetchQueryKeys={['fetchPlan']} />

			<ApiDocsContent tags={['Plans']} />

			<div className='border-b border-border mt-4 mb-6'>
				<nav className='flex space-x-4' aria-label='Tabs'>
					{tabs.map((tab, index) => {
						return (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									'px-4 py-2 text-sm font-normal transition-colors focus-visible:outline-none',
									index === 0 && 'px-0',
									activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
								)}
								role='tab'
								aria-selected={activeTab === tab.id}>
								{tab.label}
							</button>
						);
					})}
				</nav>
			</div>
			<Outlet />
		</Page>
	);
};

export default PlanDetailsPage;
