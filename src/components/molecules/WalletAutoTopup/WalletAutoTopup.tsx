import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Toggle } from '@/components/atoms';
import { toast } from 'react-hot-toast';

export interface AutoTopupConfig {
	enabled: boolean;
	threshold: string;
	amount: string;
	invoicing: boolean;
}

interface WalletAutoTopupProps {
	open: boolean;
	autoTopupConfig: AutoTopupConfig | undefined;
	onSave: (config: AutoTopupConfig) => void;
	onClose: () => void;
}

const WalletAutoTopup: React.FC<WalletAutoTopupProps> = ({ open, autoTopupConfig, onSave, onClose }) => {
	const [localConfig, setLocalConfig] = useState<AutoTopupConfig>(
		autoTopupConfig || {
			enabled: false,
			threshold: '0.00',
			amount: '0.00',
			invoicing: false,
		},
	);

	// Sync local state with props
	useEffect(() => {
		setLocalConfig(
			autoTopupConfig || {
				enabled: false,
				threshold: '0.00',
				amount: '0.00',
				invoicing: false,
			},
		);
	}, [autoTopupConfig, open]);

	const handleSave = () => {
		if (localConfig.enabled) {
			if (!localConfig.threshold || isNaN(parseFloat(localConfig.threshold))) {
				toast.error('Please enter a valid threshold value');
				return;
			}
			if (!localConfig.amount || isNaN(parseFloat(localConfig.amount)) || parseFloat(localConfig.amount) <= 0) {
				toast.error('Please enter a valid amount value greater than 0');
				return;
			}
		}

		onSave(localConfig);
	};

	const handleClose = () => {
		// Reset to original values
		setLocalConfig(
			autoTopupConfig || {
				enabled: false,
				threshold: '0.00',
				amount: '0.00',
				invoicing: false,
			},
		);
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title='Auto Top-Up Settings'
			showCloseButton>
			<div className='flex flex-col gap-6 min-w-[500px]'>
				{/* Enable Auto Top-Up Toggle */}
				<Toggle
					title='Enable Auto Top-Up'
					label='Automatically add credits when ongoing balance falls below threshold'
					description='When enabled, credits will be automatically added to the wallet when the ongoing balance drops below the specified threshold'
					checked={localConfig.enabled}
					onChange={(enabled) => setLocalConfig({ ...localConfig, enabled })}
				/>

				{/* Auto Top-Up Configuration */}
				{localConfig.enabled && (
					<div className='space-y-4'>
						{/* Threshold Input */}
						<div className='space-y-2'>
							<Input
								label='Threshold (Credits)'
								placeholder='0.00'
								value={localConfig.threshold}
								onChange={(value) => setLocalConfig({ ...localConfig, threshold: value })}
								type='number'
								step='0.01'
								description='Minimum ongoing balance (in credits) that triggers auto top-up. When ongoing balance falls below this value, auto top-up will be triggered.'
							/>
						</div>

						{/* Amount Input */}
						<div className='space-y-2'>
							<Input
								label='Top-Up Amount (Credits)'
								placeholder='0.00'
								value={localConfig.amount}
								onChange={(value) => setLocalConfig({ ...localConfig, amount: value })}
								type='number'
								step='0.01'
								min='0'
								description='Number of credits to add when auto top-up is triggered'
							/>
						</div>

						{/* Invoicing Toggle */}
						<Toggle
							title='Require Invoice Payment'
							label='Create invoice for auto top-up (requires payment before credits are added)'
							description={
								localConfig.invoicing
									? 'Credits will be added only after the invoice is paid. An invoice will be created in PENDING state when auto top-up is triggered.'
									: 'Credits will be added immediately when auto top-up is triggered.'
							}
							checked={localConfig.invoicing}
							onChange={(invoicing) => setLocalConfig({ ...localConfig, invoicing })}
						/>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end gap-2 mt-6'>
					<Button variant='outline' onClick={handleClose}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAutoTopup;
