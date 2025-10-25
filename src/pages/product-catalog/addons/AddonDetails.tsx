import { Button, CardHeader, Chip, Loader, Page, Spacer, NoDataCard } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, AddonDrawer } from '@/components/molecules';
import { DetailsCard } from '@/components/molecules';
import { RouteNames } from '@/core/routes/Routes';
import { Price } from '@/models/Price';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import AddonApi from '@/api/AddonApi';
import { getPriceTypeLabel } from '@/utils/common/helper_functions';
import { useMutation, useQuery } from '@tanstack/react-query';
import { EyeOff, Plus, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@/components/atoms';
import formatChips from '@/utils/common/format_chips';
import { ChargeValueCell } from '@/components/molecules';
import { BILLING_PERIOD } from '@/constants/constants';
import { ADDON_TYPE } from '@/models/Addon';

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
			return '--';
	}
};

const formatInvoiceCadence = (cadence: string): string => {
	switch (cadence.toUpperCase()) {
		case 'ADVANCE':
			return 'Advance';
		case 'ARREAR':
			return 'Arrear';
		default:
			return '';
	}
};

type Params = {
	id: string;
};

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
];

const AddonDetails = () => {
	const navigate = useNavigate();
	const { id } = useParams<Params>();
	const [addonDrawerOpen, setAddonDrawerOpen] = useState(false);

	const {
		data: addonData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchAddon', id],
		queryFn: async () => {
			return await AddonApi.GetAddonById(id!);
		},
		enabled: !!id,
	});

	const { mutate: archiveAddon } = useMutation({
		mutationFn: async () => {
			return await AddonApi.DeleteAddon(id!);
		},
		onSuccess: () => {
			toast.success('Addon archived successfully');
			navigate(RouteNames.addons);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to archive addon');
		},
	});

	const { updateBreadcrumb } = useBreadcrumbsStore();

	useEffect(() => {
		if (addonData?.name) {
			updateBreadcrumb(2, addonData.name);
		}
	}, [addonData, updateBreadcrumb]);

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error('Error loading addon data');
		return null;
	}

	if (!addonData) {
		toast.error('No addon data available');
		return null;
	}

	const addonDetails = [
		{ label: 'Addon Name', value: addonData?.name },
		{ label: 'Lookup Key', value: addonData?.lookup_key },
		{ label: 'Type', value: addonData?.type === ADDON_TYPE.ONETIME ? 'One Time' : 'Multiple' },
		{
			label: 'Status',
			value: <Chip label={formatChips(addonData?.status)} variant={addonData?.status === 'published' ? 'success' : 'default'} />,
		},
		{ label: 'Description', value: addonData?.description || '--' },
	];

	return (
		<Page
			heading={addonData?.name}
			headingCTA={
				<>
					<Button onClick={() => setAddonDrawerOpen(true)} variant={'outline'} className='flex gap-2'>
						<Pencil />
						Edit
					</Button>

					<Button onClick={() => archiveAddon()} disabled={addonData?.status !== 'published'} variant={'outline'} className='flex gap-2'>
						<EyeOff />
						Archive
					</Button>
				</>
			}>
			<AddonDrawer data={addonData} open={addonDrawerOpen} onOpenChange={setAddonDrawerOpen} refetchQueryKeys={['fetchAddon']} />
			<ApiDocsContent tags={['Addons']} />
			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Addon Details' data={addonDetails} />

				{/* addon charges table */}
				{(addonData?.prices?.length ?? 0) > 0 ? (
					<Card variant='notched'>
						<CardHeader
							title='Charges'
							cta={
								<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}>
									Add
								</Button>
							}
						/>
						<FlexpriceTable columns={chargeColumns} data={addonData?.prices ?? []} />
					</Card>
				) : (
					<NoDataCard
						title='Charges'
						subtitle='No charges added to the addon yet'
						cta={
							<Button prefixIcon={<Plus />} onClick={() => navigate(`${RouteNames.addonCharges.replace(':addonId', id!)}`)}>
								Add
							</Button>
						}
					/>
				)}

				{addonData.metadata && Object.keys(addonData.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title='Metadata' />
						<div className='p-4'>
							<pre className='text-sm bg-gray-50 p-3 rounded overflow-auto'>{JSON.stringify(addonData.metadata, null, 2)}</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default AddonDetails;
