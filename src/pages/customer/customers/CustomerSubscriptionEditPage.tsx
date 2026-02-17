import { Loader, Page, Spacer, Card, FormHeader, AddButton, Button } from '@/components/atoms';
import { DetailsCard, SubscriptionEntitlementsSection, SubscriptionAddonsSection, UpdateSubscriptionDrawer } from '@/components/molecules';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import CustomerApi from '@/api/CustomerApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import CreditGrantApi from '@/api/CreditGrantApi';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import formatDate from '@/utils/common/format_date';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link } from 'react-router';
import { LineItem, SUBSCRIPTION_STATUS } from '@/models/Subscription';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import PriceOverrideDialog from '@/components/molecules/PriceOverrideDialog/PriceOverrideDialog';
import { getSubscriptionStatus } from '@/components/organisms/Subscription/SubscriptionTable';
import { UpdateSubscriptionLineItemRequest, DeleteSubscriptionLineItemRequest, UpdateSubscriptionRequest } from '@/types/dto/Subscription';
import { Price, BILLING_MODEL, TIER_MODE, PRICE_ENTITY_TYPE, PRICE_TYPE, PRICE_UNIT_TYPE, BILLING_PERIOD } from '@/models/Price';
import { ExtendedPriceOverride } from '@/utils/common/price_override_helpers';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { ENTITY_STATUS, CreditGrant, BILLING_CADENCE } from '@/models';
import EditSubscriptionCreditGrantModal from '@/components/molecules/CreditGrant/EditSubscriptionCreditGrantModal';
import CancelCreditGrantModal from '@/components/molecules/CreditGrant/CancelCreditGrantModal';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import { formatExpirationPeriod } from '@/utils/common/credit_grant_helpers';
import { formatBillingPeriodForPrice } from '@/utils/common/helper_functions';
import { formatAmount } from '@/components/atoms/Input/Input';
import { ActionButton } from '@/components/atoms';
import { getTypographyClass } from '@/lib/typography';
import { Pencil, ExternalLink } from 'lucide-react';

type Params = {
	id: string;
};

const CustomerSubscriptionEditPage: React.FC = () => {
	const { id: subscriptionId } = useParams<Params>();
	const [editingLineItem, setEditingLineItem] = useState<LineItem | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [overriddenPrices, setOverriddenPrices] = useState<Record<string, ExtendedPriceOverride>>({});

	// Credit grant modals state
	const [isAddCreditGrantModalOpen, setIsAddCreditGrantModalOpen] = useState(false);
	const [isCancelCreditGrantModalOpen, setIsCancelCreditGrantModalOpen] = useState(false);
	const [selectedCreditGrantToCancel, setSelectedCreditGrantToCancel] = useState<CreditGrant | null>(null);

	const [updateSubscriptionDrawerOpen, setUpdateSubscriptionDrawerOpen] = useState(false);

	const { updateBreadcrumb } = useBreadcrumbsStore();

	const {
		data: subscriptionDetails,
		isLoading: isSubscriptionDetailsLoading,
		isError: isSubscriptionDetailsError,
	} = useQuery({
		queryKey: ['subscriptionDetails', subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.getSubscription(subscriptionId!);
		},
		enabled: !!subscriptionId,
	});

	const { data: customer } = useQuery({
		queryKey: ['fetchCustomerDetails', subscriptionDetails?.customer_id],
		queryFn: async () => await CustomerApi.getCustomerById(subscriptionDetails?.customer_id ?? ''),
		enabled: !!subscriptionDetails?.customer_id && !!subscriptionDetails?.customer_id,
	});

	const { data: creditGrants } = useQuery({
		queryKey: ['creditGrants', subscriptionId],
		queryFn: async () => {
			return await CreditGrantApi.List({
				subscription_ids: [subscriptionId!],
				status: ENTITY_STATUS.PUBLISHED,
			});
		},
		enabled:
			!!subscriptionDetails &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED &&
			subscriptionDetails.subscription_status !== SUBSCRIPTION_STATUS.TRIALING &&
			!!subscriptionId,
	});

	const { mutate: updateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, updateData }: { lineItemId: string; updateData: UpdateSubscriptionLineItemRequest }) => {
			return await SubscriptionApi.updateSubscriptionLineItem(lineItemId, updateData);
		},
		onSuccess: () => {
			toast.success('Line item updated successfully');
			refetchQueries(['subscriptionLineItems', subscriptionId!]);
			refetchQueries(['subscriptionDetails', subscriptionId!]);
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error?.error?.message || 'Failed to update line item');
		},
	});

	const { mutate: terminateLineItem } = useMutation({
		mutationFn: async ({ lineItemId, endDate }: { lineItemId: string; endDate?: string }) => {
			const payload: DeleteSubscriptionLineItemRequest = {};
			if (endDate) {
				payload.effective_from = endDate;
			}
			return await SubscriptionApi.deleteSubscriptionLineItem(lineItemId, payload);
		},
		onSuccess: () => {
			toast.success('Line item terminated successfully');
			refetchQueries(['subscriptionLineItems', subscriptionId!]);
			refetchQueries(['subscriptionDetails', subscriptionId!]);
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error?.error?.message || 'Failed to terminate line item');
		},
	});

	const { mutate: updateSubscription, isPending: isUpdatingSubscription } = useMutation({
		mutationFn: async (payload: UpdateSubscriptionRequest) => {
			return await SubscriptionApi.updateSubscription(subscriptionId!, payload);
		},
		onSuccess: () => {
			toast.success('Subscription updated successfully');
			refetchQueries(['subscriptionDetails', subscriptionId!]);
			refetchQueries(['subscriptions']);
			setUpdateSubscriptionDrawerOpen(false);
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error?.error?.message || 'Failed to update subscription');
		},
	});

	const { mutate: createCreditGrant } = useMutation({
		mutationFn: async (data: any) => {
			return await CreditGrantApi.Create(data);
		},
		onSuccess: () => {
			toast.success('Credit grant created successfully');
			refetchQueries(['creditGrants', subscriptionId!]);
			refetchQueries(['subscriptionDetails', subscriptionId!]);
			setIsAddCreditGrantModalOpen(false);
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error?.error?.message || 'Failed to create credit grant');
		},
	});

	const { mutate: deleteCreditGrant } = useMutation({
		mutationFn: async ({ creditGrantId, effectiveDate }: { creditGrantId: string; effectiveDate: string }) => {
			const deleteRequest: { effective_date?: string } = effectiveDate ? { effective_date: effectiveDate } : {};
			return await CreditGrantApi.Delete(creditGrantId, deleteRequest);
		},
		onSuccess: () => {
			toast.success('Credit grant deleted successfully');
			refetchQueries(['creditGrants', subscriptionId!]);
			refetchQueries(['subscriptionDetails', subscriptionId!]);
			setIsCancelCreditGrantModalOpen(false);
			setSelectedCreditGrantToCancel(null);
		},
		onError: (error: { error?: { message?: string } }) => {
			toast.error(error?.error?.message || 'Failed to delete credit grant');
		},
	});

	useEffect(() => {
		if (subscriptionDetails?.plan?.name) {
			updateBreadcrumb(2, `Subscription`, `${RouteNames.customers}/${customer?.id}/subscription/${subscriptionId}`);
		}

		if (customer?.external_id) {
			updateBreadcrumb(1, customer.external_id, `${RouteNames.customers}/${customer.id}`);
		}
	}, [subscriptionDetails, updateBreadcrumb, customer, subscriptionId]);

	// Group line items by phase ID
	const groupedLineItems = useMemo(() => {
		if (!subscriptionDetails?.line_items) return { withoutPhase: [], byPhase: {} };

		const lineItems = subscriptionDetails.line_items;
		const withoutPhase: LineItem[] = [];
		const byPhase: Record<string, LineItem[]> = {};

		lineItems.forEach((lineItem) => {
			if (lineItem.subscription_phase_id) {
				if (!byPhase[lineItem.subscription_phase_id]) {
					byPhase[lineItem.subscription_phase_id] = [];
				}
				byPhase[lineItem.subscription_phase_id].push(lineItem);
			} else {
				withoutPhase.push(lineItem);
			}
		});

		return { withoutPhase, byPhase };
	}, [subscriptionDetails?.line_items]);

	// Get phase details for each phase ID
	const phaseDetails = useMemo(() => {
		if (!subscriptionDetails?.phases) return {};

		const details: Record<string, { index: number; startDate: string; endDate?: string }> = {};
		subscriptionDetails.phases.forEach((phase, index) => {
			details[phase.id] = {
				index: index + 1,
				startDate: phase.start_date,
				endDate: phase.end_date || undefined,
			};
		});

		return details;
	}, [subscriptionDetails?.phases]);

	const handleEditLineItem = (lineItem: LineItem) => {
		setEditingLineItem(lineItem);
		setIsEditDialogOpen(true);
	};

	const handleTerminateLineItem = (lineItemId: string, endDate?: string) => {
		terminateLineItem({ lineItemId, endDate });
	};

	// Convert price override data to subscription line item update data
	const convertPriceOverrideToLineItemUpdate = (
		_priceId: string,
		override: Partial<ExtendedPriceOverride>,
	): UpdateSubscriptionLineItemRequest => {
		const updateData: UpdateSubscriptionLineItemRequest = {};

		if (override.amount) {
			updateData.amount = parseFloat(override.amount);
		}

		if (override.billing_model && override.billing_model !== 'SLAB_TIERED') {
			updateData.billing_model = override.billing_model;
		}

		if (override.tier_mode) {
			updateData.tier_mode = override.tier_mode;
		}

		if (override.tiers) {
			updateData.tiers = override.tiers;
		}

		if (override.transform_quantity) {
			updateData.transform_quantity = override.transform_quantity;
		}

		if (override.effective_from) {
			updateData.effective_from = override.effective_from;
		}

		return updateData;
	};

	const handlePriceOverride = (priceId: string, override: Partial<ExtendedPriceOverride>) => {
		if (!editingLineItem) return;

		const updateData = convertPriceOverrideToLineItemUpdate(priceId, override);
		updateLineItem({ lineItemId: editingLineItem.id, updateData });
		setIsEditDialogOpen(false);
		setEditingLineItem(null);
	};

	const handleResetOverride = (priceId: string) => {
		// Reset the override for this price
		setOverriddenPrices((prev) => {
			const newOverrides = { ...prev };
			delete newOverrides[priceId];
			return newOverrides;
		});
	};

	const handleCreateCreditGrant = (data: any) => {
		createCreditGrant(data);
	};

	const handleCancelCreditGrant = (grant: CreditGrant) => {
		setSelectedCreditGrantToCancel(grant);
		setIsCancelCreditGrantModalOpen(true);
	};

	const handleConfirmCancelCreditGrant = (effectiveDate: string) => {
		if (selectedCreditGrantToCancel) {
			deleteCreditGrant({
				creditGrantId: selectedCreditGrantToCancel.id,
				effectiveDate: effectiveDate || new Date().toISOString(),
			});
		}
	};

	// Credit grants table columns
	const creditGrantColumns: ColumnData<CreditGrant>[] = useMemo(() => {
		return [
			{
				title: 'Name',
				render: (row) => <span>{row.name}</span>,
			},
			{
				title: 'Credits',
				render: (row) => <span>{formatAmount(row.credits.toString())}</span>,
			},
			{
				title: 'Priority',
				render: (row) => <span>{row.priority ?? '--'}</span>,
			},
			{
				title: 'Cadence',
				render: (row) => {
					const cadence = row.cadence.toLowerCase().replace('_', ' ');
					return cadence.charAt(0).toUpperCase() + cadence.slice(1);
				},
			},
			{
				title: 'Period',
				render: (row) => (row.period ? `${row.period_count || 1} ${formatBillingPeriodForPrice(row.period)}` : '--'),
			},
			{
				title: 'Expiration Config',
				render: (row) => <span>{formatExpirationPeriod(row)}</span>,
			},
			{
				fieldVariant: 'interactive' as const,
				width: '30px',
				hideOnEmpty: true,
				render: (row) => {
					return (
						<ActionButton
							id={row.id}
							deleteMutationFn={async () => {
								// Empty function - not used
							}}
							refetchQueryKey='creditGrants'
							entityName={row.name}
							edit={{
								enabled: false,
							}}
							archive={{
								enabled: false,
							}}
							customActions={[
								{
									text: 'Delete',
									onClick: () => handleCancelCreditGrant(row),
									enabled: true,
								},
							]}
						/>
					);
				},
			},
		];
	}, []);

	// Convert LineItem to Price object for PriceOverrideDialog
	const convertLineItemToPrice = (lineItem: LineItem): Price => {
		if (lineItem.price) {
			return lineItem.price;
		}

		// Use entity_type and entity_id from line item; fall back to plan_id or subscription for legacy/API shape
		const entityType =
			lineItem.entity_type != null
				? (lineItem.entity_type.toUpperCase() as PRICE_ENTITY_TYPE)
				: lineItem.plan_id
					? PRICE_ENTITY_TYPE.PLAN
					: PRICE_ENTITY_TYPE.SUBSCRIPTION;
		const entityId = lineItem.entity_id ?? lineItem.plan_id ?? lineItem.subscription_id;

		return {
			id: lineItem.price_id,
			amount: lineItem.quantity?.toString() || '0',
			currency: lineItem.currency,
			billing_model: lineItem.price_type as BILLING_MODEL,
			tier_mode: TIER_MODE.VOLUME,
			tiers: [],
			transform_quantity: { divide_by: 1 },
			description: lineItem.display_name,
			meter: { name: lineItem.meter_display_name },
			type: PRICE_TYPE.USAGE,
			display_amount: lineItem.quantity?.toString() || '0',
			entity_type: entityType,
			entity_id: entityId,
			price_unit_type: PRICE_UNIT_TYPE.FIAT,
			created_at: lineItem.created_at,
			updated_at: lineItem.updated_at,
			status: ENTITY_STATUS.PUBLISHED,
			environment_id: lineItem.environment_id,
			tenant_id: lineItem.tenant_id,
			meter_id: lineItem.meter_id,
			metadata: lineItem.metadata,
			billing_period: BILLING_PERIOD.MONTHLY,
			billing_period_count: 1,
			billing_cadence: BILLING_CADENCE.RECURRING,
			filter_values: {},
			unit_amount: lineItem.quantity?.toString() || '0',
			flat_amount: '0',
			up_to: null,
		} as unknown as Price;
	};

	if (isSubscriptionDetailsLoading) {
		return <Loader />;
	}

	if (isSubscriptionDetailsError) {
		toast.error('Error loading subscription data');
		return null;
	}

	if (!subscriptionDetails) {
		toast.error('No subscription data available');
		return null;
	}

	const subscriptionDetailsData = [
		{ label: 'Plan', value: subscriptionDetails?.plan?.name },
		{
			label: 'Status',
			value: getSubscriptionStatus(subscriptionDetails?.subscription_status ?? ''),
		},
		{ label: 'Billing Cycle', value: subscriptionDetails?.billing_cycle || '--' },
		{ label: 'Start Date', value: formatDate(subscriptionDetails?.start_date ?? '') },
		{ label: 'Current Period End', value: formatDate(subscriptionDetails?.current_period_end ?? '') },
		...(subscriptionDetails?.commitment_amount
			? [
					{
						label: 'Commitment Amount',
						value: `${getCurrencySymbol(subscriptionDetails?.currency || '')} ${subscriptionDetails?.commitment_amount}`,
					},
				]
			: []),
		...(subscriptionDetails?.overage_factor && subscriptionDetails?.overage_factor > 1
			? [{ label: 'Overage Factor', value: subscriptionDetails?.overage_factor.toString() }]
			: []),
		{
			label: 'Parent subscription',
			value: subscriptionDetails?.parent_subscription_id ? (
				<Link
					to={`${RouteNames.subscriptions}/${subscriptionDetails.parent_subscription_id}/edit`}
					className='inline-flex items-center text-sm gap-1.5 hover:underline transition-colors'>
					{subscriptionDetails.parent_subscription_id}
					<ExternalLink className='w-3.5 h-3.5' />
				</Link>
			) : (
				'None'
			),
		},
	];

	return (
		<Page documentTitle='Edit Subscription' heading={`Edit Subscription`}>
			<div className='space-y-6'>
				<div>
					<Spacer className='!h-4' />
					<div className='flex justify-between items-center'>
						<h3 className={getTypographyClass('card-header') + ' !text-[16px]'}>Subscription Details</h3>
						{subscriptionDetails?.subscription_status !== SUBSCRIPTION_STATUS.CANCELLED && (
							<Button variant='outline' size='icon' onClick={() => setUpdateSubscriptionDrawerOpen(true)} title='Update subscription'>
								<Pencil className='size-4' />
							</Button>
						)}
					</div>
					<Spacer className='!h-4' />
					<DetailsCard variant='stacked' data={subscriptionDetailsData} childrenAtTop cardStyle='borderless' />
					<UpdateSubscriptionDrawer
						open={updateSubscriptionDrawerOpen}
						onOpenChange={setUpdateSubscriptionDrawerOpen}
						subscriptionId={subscriptionId!}
						subscription={subscriptionDetails}
						onSave={(payload) => updateSubscription(payload)}
						isSaving={isUpdatingSubscription}
					/>
				</div>

				{/* Line Items without Phase (Subscription-level) */}
				{groupedLineItems.withoutPhase.length > 0 && (
					<div className='space-y-4'>
						<div className='flex items-center gap-2'>
							<h3 className='text-lg font-semibold text-gray-900'>Charges</h3>
							<span className='text-sm text-gray-500'>({groupedLineItems.withoutPhase.length} items)</span>
						</div>
						<SubscriptionLineItemTable
							data={groupedLineItems.withoutPhase}
							isLoading={isSubscriptionDetailsLoading}
							onEdit={handleEditLineItem}
							onTerminate={handleTerminateLineItem}
						/>
					</div>
				)}

				{/* Line Items grouped by Phase */}
				{Object.keys(groupedLineItems.byPhase).length > 0 && (
					<div className='space-y-6'>
						{Object.entries(groupedLineItems.byPhase)
							.sort(([phaseIdA], [phaseIdB]) => {
								// Sort by start date chronologically (earliest to latest)
								const startDateA = phaseDetails[phaseIdA]?.startDate;
								const startDateB = phaseDetails[phaseIdB]?.startDate;

								if (!startDateA && !startDateB) return 0;
								if (!startDateA) return 1;
								if (!startDateB) return -1;

								return new Date(startDateA).getTime() - new Date(startDateB).getTime();
							})
							.map(([phaseId, lineItems], index) => {
								const phase = phaseDetails[phaseId];
								const phaseNumber = index + 1; // Assign phase number based on chronological order
								const startDate = phase?.startDate ? formatDate(phase.startDate) : 'N/A';
								const endDate = phase?.endDate ? formatDate(phase.endDate) : 'Forever';

								return (
									<Card key={phaseId} variant='notched'>
										<div className='mb-4 pb-4 border-b border-gray-200'>
											<h3 className='text-base font-semibold text-gray-900'>Phase {phaseNumber}</h3>
											<p className='text-sm text-gray-600 mt-1'>
												{startDate} → {endDate}
											</p>
										</div>
										<SubscriptionLineItemTable
											data={lineItems}
											isLoading={isSubscriptionDetailsLoading}
											onEdit={handleEditLineItem}
											onTerminate={handleTerminateLineItem}
											hideCardWrapper={true}
										/>
									</Card>
								);
							})}
					</div>
				)}

				{/* Show single table if no phases exist */}
				{groupedLineItems.withoutPhase.length === 0 && Object.keys(groupedLineItems.byPhase).length === 0 && (
					<SubscriptionLineItemTable
						data={subscriptionDetails?.line_items || []}
						isLoading={isSubscriptionDetailsLoading}
						onEdit={handleEditLineItem}
						onTerminate={handleTerminateLineItem}
					/>
				)}

				{/* Credit Grants Section */}
				<Card variant='notched'>
					<div className='flex items-center justify-between mb-4'>
						<FormHeader title='Credit Grants' variant='sub-header' titleClassName='font-semibold' className='mb-0' />
						<AddButton
							onClick={() => setIsAddCreditGrantModalOpen(true)}
							disabled={
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.CANCELLED ||
								subscriptionDetails?.subscription_status === SUBSCRIPTION_STATUS.TRIALING
							}
						/>
					</div>
					<div className='mt-4'>
						<FlexpriceTable showEmptyRow={true} data={creditGrants?.items || []} columns={creditGrantColumns} />
					</div>
				</Card>

				{/* Subscription Entitlements Section */}
				{subscriptionId && <SubscriptionEntitlementsSection subscriptionId={subscriptionId} />}

				{/* Subscription Addons Section */}
				{subscriptionId && <SubscriptionAddonsSection subscriptionId={subscriptionId} />}

				{/* Price Override Dialog */}
				{editingLineItem && (
					<PriceOverrideDialog
						isOpen={isEditDialogOpen}
						onOpenChange={setIsEditDialogOpen}
						price={convertLineItemToPrice(editingLineItem)}
						onPriceOverride={handlePriceOverride}
						onResetOverride={handleResetOverride}
						overriddenPrices={overriddenPrices}
						showEffectiveFrom={true}
					/>
				)}

				{/* Add Credit Grant Modal */}
				{subscriptionId && (
					<EditSubscriptionCreditGrantModal
						isOpen={isAddCreditGrantModalOpen}
						onOpenChange={setIsAddCreditGrantModalOpen}
						onSave={handleCreateCreditGrant}
						onCancel={() => setIsAddCreditGrantModalOpen(false)}
						subscriptionId={subscriptionId}
						subscriptionStartDate={subscriptionDetails?.start_date}
						subscriptionCurrentPeriodEnd={subscriptionDetails?.current_period_end}
					/>
				)}

				{/* Cancel Credit Grant Modal */}
				<CancelCreditGrantModal
					isOpen={isCancelCreditGrantModalOpen}
					onOpenChange={setIsCancelCreditGrantModalOpen}
					onConfirm={handleConfirmCancelCreditGrant}
					onCancel={() => {
						setIsCancelCreditGrantModalOpen(false);
						setSelectedCreditGrantToCancel(null);
					}}
					creditGrant={selectedCreditGrantToCancel}
				/>

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default CustomerSubscriptionEditPage;
