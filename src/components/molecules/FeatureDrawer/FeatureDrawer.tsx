import { Button, Input, Sheet, Spacer, Textarea } from '@/components/atoms';
import { FC, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import FeatureApi from '@/api/FeatureApi';
import toast from 'react-hot-toast';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { UpdateFeatureRequest } from '@/types/dto/Feature';
import Feature from '@/models/Feature';

interface Props {
	data: Feature; // Required - update-only drawer
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
	refetchQueryKeys?: string | string[];
}

const FeatureDrawer: FC<Props> = ({ data, open, onOpenChange, trigger, refetchQueryKeys }) => {
	const [formData, setFormData] = useState<UpdateFeatureRequest>({
		name: data?.name || '',
		description: data?.description || '',
		unit_singular: data?.unit_singular || '',
		unit_plural: data?.unit_plural || '',
	});
	const [errors, setErrors] = useState<Partial<Record<keyof UpdateFeatureRequest, string>>>({});

	const { mutate: updateFeature, isPending } = useMutation({
		mutationFn: (updateData: UpdateFeatureRequest) => {
			return FeatureApi.updateFeature(data.id, updateData);
		},
		onSuccess: () => {
			toast.success('Feature updated successfully');
			onOpenChange?.(false);
			refetchQueries(refetchQueryKeys);
		},
		onError: (error: ServerError) => {
			toast.error(error.error.message || 'Failed to update feature. Please try again.');
		},
	});

	useEffect(() => {
		if (data) {
			setFormData({
				name: data.name || '',
				description: data.description || '',
				unit_singular: data.unit_singular || '',
				unit_plural: data.unit_plural || '',
			});
		}
		setErrors({});
	}, [data, open]);

	const validateForm = () => {
		const newErrors: Partial<Record<keyof UpdateFeatureRequest, string>> = {};

		if (!formData.name?.trim()) {
			newErrors.name = 'Name is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) {
			return;
		}

		const updateDto: UpdateFeatureRequest = {
			name: formData.name?.trim(),
			description: formData.description?.trim() || undefined,
			unit_singular: formData.unit_singular?.trim() || undefined,
			unit_plural: formData.unit_plural?.trim() || undefined,
		};

		updateFeature(updateDto);
	};

	const isCtaDisabled = !formData.name?.trim() || isPending;

	return (
		<Sheet isOpen={open} onOpenChange={onOpenChange} title='Edit Feature' description='Update feature details.' trigger={trigger}>
			<div className='space-y-8 mt-4'>
				<Input
					label='Name'
					placeholder='Enter feature name'
					value={formData.name || ''}
					error={errors.name}
					onChange={(e) => {
						setFormData({ ...formData, name: e });
					}}
				/>

				<Textarea
					label='Description'
					placeholder='Enter description'
					value={formData.description || ''}
					onChange={(e) => {
						setFormData({ ...formData, description: e });
					}}
					className='min-h-[100px]'
				/>

				<Input
					label='Unit Singular'
					placeholder='e.g., unit'
					value={formData.unit_singular || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_singular: e });
					}}
				/>

				<Input
					label='Unit Plural'
					placeholder='e.g., units'
					value={formData.unit_plural || ''}
					onChange={(e) => {
						setFormData({ ...formData, unit_plural: e });
					}}
				/>

				<Spacer className='!h-4' />
				<Button isLoading={isPending} disabled={isCtaDisabled} onClick={handleSave}>
					Save Feature
				</Button>
			</div>
		</Sheet>
	);
};

export default FeatureDrawer;
