import { FC, useCallback, useState } from 'react';
import { Button, Card, CardHeader, NoDataCard } from '@/components/atoms';
import { FlexpriceTable, ColumnData, DropdownMenu, TerminatePriceModal, SyncOption } from '@/components/molecules';
import { Price, Plan } from '@/models';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import { PlanApi } from '@/api/PlanApi';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { RouteNames } from '@/core/routes/Routes';
import { getPriceTypeLabel } from '@/utils';
import { BILLING_PERIOD } from '@/constants/constants';
import { ChargeValueCell } from '@/components/molecules';
import { formatInvoiceCadence } from '@/pages';
import { Dialog } from '@/components/ui';
import { DeletePriceRequest } from '@/types/dto';

// ===== TYPES & CONSTANTS =====

interface PlanChargesTableProps {
	plan: Plan;
	onPriceUpdate?: () => void;
	onEditPrice?: (price: Price) => void;
}

const formatBillingPeriod = (billingPeriod: string) => {
	switch (billingPeriod.toUpperCase()) {
		case BILLING_PERIOD.DAILY:
			return 'Daily';
		case BILLING_PERIOD.WEEKLY:
			return 'Weekly';
		case BILLING_PERIOD.MONTHLY:
			return 'Monthly';
		case BILLING_PERIOD.ANNUAL:
			return 'Yearly';
		case BILLING_PERIOD.QUARTERLY:
			return 'Quarterly';
		case BILLING_PERIOD.HALF_YEARLY:
			return 'Half Yearly';
		default:
			return '赔偿';
	}
};

const PlanPriceTable: FC<PlanChargesTableProps> = ({ plan, onPriceUpdate, onEditPrice }) => {
	const navigate = useNavigate();
	const [showTerminateModal, setShowTerminateModal] = useState(false);
	const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);

	// ===== MUTATIONS =====
	const { mutateAsync: deletePrice, isPending: isDeletingPrice } = useMutation({
		mutationFn: async ({ priceId, data }: { priceId: string; data?: DeletePriceRequest }) => {
			return await PriceApi.DeletePrice(priceId, data);
		},
		onSuccess: () => {
			toast.success('Price terminated successfully');
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error deleting price');
		},
	});

	const { mutateAsync: syncPlanCharges, isPending: isSyncing } = useMutation({
		mutationFn: () => PlanApi.synchronizePlanPricesWithSubscription(plan.id),
		onSuccess: () => {
			toast.success('Sync has been started and will take up to 1 hour to complete.');
		},
		onError: (error: ServerError) => {
			toast.error(error?.error?.message || 'Error synchronizing charges with subscriptions');
		},
	});

	const isPending = isDeletingPrice || isSyncing;

	// ===== HANDLERS =====
	const handleTerminatePrice = useCallback(
		(priceId: string) => {
			const price = plan.prices?.find((p) => p.id === priceId);
			if (!price) return;

			setSelectedPrice(price);
			setShowTerminateModal(true);
		},
		[plan.prices],
	);

	const handleTerminateConfirm = useCallback(
		async (endDate: string | undefined, syncOption?: SyncOption) => {
			if (!selectedPrice) return;

			setShowTerminateModal(false);

			try {
				// Prepare delete request with end_date if provided
				const deleteRequest: DeletePriceRequest | undefined = endDate ? { end_date: endDate } : undefined;

				// Delete the price
				await deletePrice({ priceId: selectedPrice.id, data: deleteRequest });

				// If user selected to sync with existing subscriptions
				if (syncOption === SyncOption.EXISTING_ALSO) {
					await syncPlanCharges();
				}

				// Refresh data
				onPriceUpdate?.();
				setSelectedPrice(null);
			} catch (error) {
				console.error('Error terminating price:', error);
			}
		},
		[selectedPrice, deletePrice, syncPlanCharges, onPriceUpdate],
	);

	const handleTerminateCancel = useCallback(() => {
		setShowTerminateModal(false);
		setSelectedPrice(null);
	}, []);

	// ===== TABLE COLUMNS =====
	const chargeColumns: ColumnData<Price>[] = [
		{
			title: 'Charge Type',
			render: (row) => {
				return <span>{getPriceTypeLabel(row.type)}</span>;
			},
		},
		{
			title: 'Feature',
			render(rowData) {
				return <span>{rowData.meter?.name ?? '--'}</span>;
			},
		},
		{
			title: 'Billing Timing',
			render(rowData) {
				return <span>{formatInvoiceCadence(rowData.invoice_cadence as string)}</span>;
			},
		},
		{
			title: 'Billing Period',
			render(rowData) {
				return <span>{formatBillingPeriod(rowData.billing_period as string)}</span>;
			},
		},
		{
			title: 'Value',
			render(rowData) {
				return <ChargeValueCell data={rowData} />;
			},
		},
		{
			fieldVariant: 'interactive',
			width: '30px',
			hideOnEmpty: true,
			render(row) {
				return (
					<DropdownMenu
						options={[
							{
								label: 'Edit Price',
								icon: <Pencil />,
								onSelect: () => onEditPrice?.(row),
							},
							{
								label: 'Terminate Price',
								icon: <Trash2 />,
								onSelect: () => handleTerminatePrice(row.id),
							},
						]}
					/>
				);
			},
		},
	];

	// ===== RENDER =====
	return (
		<>
			{/* Terminate Price Modal */}
			<Dialog open={showTerminateModal} onOpenChange={setShowTerminateModal}>
				{selectedPrice && (
					<TerminatePriceModal
						planId={plan.id}
						onCancel={handleTerminateCancel}
						onConfirm={handleTerminateConfirm}
						isLoading={isPending}
						showSyncOption={true}
					/>
				)}
			</Dialog>

			{/* Charges Table */}
			{(plan?.prices?.length ?? 0) > 0 ? (
				<Card variant='notched'>
					<CardHeader
						title='Charges'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${plan.id}/add-charges`)}>
								Add
							</Button>
						}
					/>
					<FlexpriceTable columns={chargeColumns} data={plan?.prices ?? []} />
				</Card>
			) : (
				<NoDataCard
					title='Charges'
					subtitle='No charges added to the plan yet'
					cta={
						<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.plan}/${plan.id}/add-charges`)}>
							Add
						</Button>
					}
				/>
			)}
		</>
	);
};

export default PlanPriceTable;
