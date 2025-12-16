import { FC, useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, Chip, Dialog, AddButton } from '@/components/atoms';
import { FlexpriceTable, ColumnData } from '@/components/molecules';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDotsVertical } from 'react-icons/bs';
import SubscriptionApi from '@/api/SubscriptionApi';
import AddonApi from '@/api/AddonApi';
import { ADDON_TYPE } from '@/models/Addon';
import { AddonAssociationResponse } from '@/types/dto/Subscription';
import { AddonResponse } from '@/types/dto/Addon';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { Price, PRICE_TYPE } from '@/models/Price';
import { getCurrentPriceAmount } from '@/utils/common/price_override_helpers';
import { getTotalPayableTextWithCoupons } from '@/utils/common/helper_functions';
import toast from 'react-hot-toast';
import AddAddonDialog from './AddAddonDialog';

interface SubscriptionAddonsSectionProps {
	subscriptionId: string;
}

interface AddonWithDetails extends AddonAssociationResponse {
	addon?: AddonResponse;
}

const getAddonTypeChip = (type: string) => {
	switch (type.toLowerCase()) {
		case ADDON_TYPE.ONETIME:
			return <Chip textColor='#4B5563' bgColor='#F3F4F6' label={toSentenceCase(type)} className='text-xs' />;
		case ADDON_TYPE.MULTIPLE:
			return <Chip textColor='#1E40AF' bgColor='#DBEAFE' label={toSentenceCase(type)} className='text-xs' />;
		default:
			return <Chip textColor='#6B7280' bgColor='#F9FAFB' label={toSentenceCase(type)} className='text-xs' />;
	}
};

const formatAddonCharges = (prices: Price[] = []): string => {
	if (!prices || prices.length === 0) return '--';

	const recurringPrices = prices.filter((p) => p.type === PRICE_TYPE.FIXED);
	const usagePrices = prices.filter((p) => p.type === PRICE_TYPE.USAGE);

	const hasUsage = usagePrices.length > 0;

	if (recurringPrices.length === 0) {
		return hasUsage ? 'Depends on usage' : '--';
	}

	// Calculate total recurring amount
	const recurringTotal = recurringPrices.reduce((acc, charge) => {
		const currentAmount = getCurrentPriceAmount(charge, {});
		return acc + parseFloat(currentAmount);
	}, 0);

	// Use the same helper as Preview component for consistent display
	return getTotalPayableTextWithCoupons(recurringPrices, usagePrices, recurringTotal, []);
};

const SubscriptionAddonsSection: FC<SubscriptionAddonsSectionProps> = ({ subscriptionId }) => {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [addonToDelete, setAddonToDelete] = useState<AddonAssociationResponse | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const queryClient = useQueryClient();

	// Fetch active addons
	const {
		data: addonAssociations = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['subscriptionActiveAddons', subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.getActiveAddons(subscriptionId);
		},
		enabled: !!subscriptionId,
		retry: false,
		refetchOnWindowFocus: false,
	});

	// Fetch addon details for each association
	const { data: allAddons = [] } = useQuery({
		queryKey: ['addons'],
		queryFn: async () => {
			const response = await AddonApi.List({ limit: 1000, offset: 0 });
			return response.items;
		},
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	});

	// Combine addon associations with their details
	const addonsWithDetails: AddonWithDetails[] = useMemo(() => {
		return addonAssociations.map((association) => {
			const addonDetails = allAddons.find((addon) => addon.id === association.addon_id);
			return {
				...association,
				addon: addonDetails,
			};
		});
	}, [addonAssociations, allAddons]);

	// Delete addon mutation
	const { mutate: deleteAddon, isPending: isDeletingAddon } = useMutation({
		mutationFn: async (addonAssociationId: string) => {
			return await SubscriptionApi.removeAddonFromSubscription({
				addon_association_id: addonAssociationId,
			});
		},
		onSuccess: () => {
			toast.success('Addon removed successfully');
			queryClient.invalidateQueries({ queryKey: ['subscriptionActiveAddons', subscriptionId] });
			queryClient.invalidateQueries({ queryKey: ['subscriptionDetails', subscriptionId] });
			setIsDeleteDialogOpen(false);
			setAddonToDelete(null);
		},
		onError: (error: any) => {
			toast.error(error?.error?.message || 'Failed to remove addon');
		},
	});

	const handleDelete = (addon: AddonAssociationResponse) => {
		setDropdownOpen(null);
		setAddonToDelete(addon);
		setIsDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (addonToDelete) {
			deleteAddon(addonToDelete.id);
		}
	};

	const cancelDelete = () => {
		setIsDeleteDialogOpen(false);
		setAddonToDelete(null);
	};

	const columns: ColumnData<AddonWithDetails>[] = [
		{
			title: 'Name',
			render: (row) => {
				return <span>{row.addon?.name || row.addon_id}</span>;
			},
		},
		{
			title: 'Type',
			render: (row) => {
				return row.addon ? getAddonTypeChip(row.addon.type) : '--';
			},
		},
		{
			title: 'Charges',
			render: (row) => {
				const prices = row.addon?.prices || [];
				return <span>{formatAddonCharges(prices)}</span>;
			},
		},
		{
			title: '',
			width: '30px',
			fieldVariant: 'interactive',
			hideOnEmpty: true,
			render: (row) => {
				return (
					<div
						data-interactive='true'
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<DropdownMenu open={dropdownOpen === row.id} onOpenChange={(open) => setDropdownOpen(open ? row.id : null)}>
							<DropdownMenuTrigger asChild>
								<button className='focus:outline-none'>
									<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleDelete(row);
									}}
									className='flex gap-2 items-center cursor-pointer text-red-600'>
									<Trash2 className='h-4 w-4' />
									<span>Delete</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	if (isLoading) {
		return (
			<Card variant='notched'>
				<CardHeader title='Addons' cta={<AddButton onClick={() => setIsAddDialogOpen(true)} label='Add Addon' />} />
				<div className='flex justify-center items-center py-8'>
					<span className='text-gray-500'>Loading addons...</span>
				</div>
			</Card>
		);
	}

	if (isError) {
		return null;
	}

	return (
		<>
			<Card variant='notched'>
				<CardHeader title='Addons' cta={<AddButton onClick={() => setIsAddDialogOpen(true)} label='Add Addon' />} />
				{addonsWithDetails.length > 0 ? (
					<FlexpriceTable showEmptyRow data={addonsWithDetails} columns={columns} variant='no-bordered' />
				) : (
					<div className='flex flex-col items-center justify-center py-12 text-center'>
						<p className='text-gray-500 text-sm'>No addons added to this subscription yet</p>
					</div>
				)}
			</Card>

			{/* Add Addon Dialog */}
			<AddAddonDialog
				isOpen={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				subscriptionId={subscriptionId}
				existingAddonIds={addonsWithDetails.map((a) => a.addon_id)}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog
				title={`Are you sure you want to delete the addon "${
					addonToDelete ? addonsWithDetails.find((a) => a.id === addonToDelete.id)?.addon?.name || 'this addon' : 'this addon'
				}"?`}
				description='This action cannot be undone.'
				titleClassName='text-lg font-normal text-gray-800'
				isOpen={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				showCloseButton={false}>
				<div className='flex flex-col gap-4 items-end justify-center'>
					<div className='flex gap-4'>
						<Button variant='outline' onClick={cancelDelete} disabled={isDeletingAddon}>
							Cancel
						</Button>
						<Button variant='destructive' onClick={confirmDelete} disabled={isDeletingAddon}>
							{isDeletingAddon ? 'Deleting...' : 'Delete'}
						</Button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default SubscriptionAddonsSection;
