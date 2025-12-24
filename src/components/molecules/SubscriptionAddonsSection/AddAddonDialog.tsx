import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Select } from '@/components/atoms';
import Dialog from '@/components/atoms/Dialog';
import AddonApi from '@/api/AddonApi';
import SubscriptionApi from '@/api/SubscriptionApi';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { ADDON_TYPE } from '@/models/Addon';
import { AddAddonRequest } from '@/types/dto/Subscription';
import { AddonResponse } from '@/types/dto/Addon';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';

interface Props {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	existingAddons: AddonResponse[];
}

interface FormErrors {
	addon_id?: string;
}

const AddAddonDialog: React.FC<Props> = ({ isOpen, onOpenChange, subscriptionId, existingAddons }) => {
	const [formData, setFormData] = useState<Partial<AddAddonRequest>>({});
	const [errors, setErrors] = useState<FormErrors>({});

	// Fetch available addons
	const { data: addonsResponse } = useQuery({
		queryKey: ['subaddons', subscriptionId],
		queryFn: async () => {
			return await AddonApi.List({ limit: 1000, offset: 0 });
		},
	});

	const existingAddonIds = useMemo(() => existingAddons.map((addon) => addon.id), [existingAddons]);

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({});
			setErrors({});
		}
	}, [isOpen]);

	const validateForm = useCallback((): { isValid: boolean; errors: FormErrors } => {
		const newErrors: FormErrors = {};

		if (!formData.addon_id) {
			newErrors.addon_id = 'Addon is required';
		}

		return {
			isValid: Object.keys(newErrors).length === 0,
			errors: newErrors,
		};
	}, [formData]);

	// Add addon mutation
	const { mutate: addAddon, isPending: isAddingAddon } = useMutation({
		mutationFn: async (payload: AddAddonRequest) => {
			return await SubscriptionApi.addAddonToSubscription(payload);
		},
		onSuccess: () => {
			toast.success('Addon added successfully');
			refetchQueries(['subscriptionActiveAddons', subscriptionId]);
			refetchQueries(['subscriptionDetails', subscriptionId]);
			setFormData({});
			setErrors({});
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error?.error?.message || 'Failed to add addon');
		},
	});

	const handleSave = useCallback(() => {
		const validation = validateForm();

		if (!validation.isValid) {
			setErrors(validation.errors);
			return;
		}

		setErrors({});
		const addonData: AddAddonRequest = {
			subscription_id: subscriptionId,
			addon_id: formData.addon_id!,
		};

		addAddon(addonData);
	}, [formData, validateForm, subscriptionId, addAddon]);

	const handleCancel = useCallback(() => {
		setFormData({});
		setErrors({});
		onOpenChange(false);
	}, [onOpenChange]);

	const handleAddonSelect = useCallback(
		(addonId: string) => {
			setFormData((prev) => ({ ...prev, addon_id: addonId }));
			// Clear error for this field when user selects
			if (errors.addon_id) {
				setErrors((prev) => ({ ...prev, addon_id: undefined }));
			}
		},
		[errors.addon_id],
	);

	// Filter addon options based on existing addons and addon type
	const filteredAddonOptions = useMemo(() => {
		// Filter out addons that are already added to the subscription
		const filteredAddons =
			addonsResponse?.items?.filter((addon) => {
				if (addon.type === ADDON_TYPE.ONETIME) {
					return !existingAddonIds.includes(addon.id);
				}
				return true;
			}) || [];

		return filteredAddons.map((addon: AddonResponse) => ({
			label: addon.name,
			value: addon.id,
			description: `${toSentenceCase(addon.type)} - ${addon.description || 'No description'}`,
		}));
	}, [addonsResponse, existingAddonIds]);

	return (
		<Dialog isOpen={isOpen} showCloseButton={false} onOpenChange={onOpenChange} title='Add Addon' className='sm:max-w-[600px]'>
			<div className='grid gap-4 mt-3'>
				<div className='space-y-2'>
					<Select
						label='Addon'
						placeholder='Select addon'
						options={filteredAddonOptions}
						value={formData.addon_id || ''}
						onChange={handleAddonSelect}
						error={errors.addon_id}
					/>
				</div>
			</div>

			<div className='flex justify-end gap-2 mt-6'>
				<Button variant='outline' onClick={handleCancel} disabled={isAddingAddon}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isAddingAddon}>
					{isAddingAddon ? 'Adding...' : 'Add Addon'}
				</Button>
			</div>
		</Dialog>
	);
};

export default AddAddonDialog;
