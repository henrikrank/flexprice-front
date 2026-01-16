import React from 'react';
import Dialog from '@/components/atoms/Dialog/Dialog';
import { Check } from 'lucide-react';

interface RegionInfoDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
}

const RegionInfoDialog: React.FC<RegionInfoDialogProps> = ({ isOpen, onOpenChange }) => {
	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title='Which region would you like to choose?'
			description='Please choose your region carefully. While migration to another region is possible, it requires manual intervention and cannot be changed automatically.'
			className='max-w-2xl'>
			<div className='space-y-6'>
				{/* US Hosting Section */}
				<div>
					<h3 className='font-semibold text-base mb-3'>US hosting</h3>
					<ul className='space-y-2'>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>Faster if you and your users are based in the US</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>Easier to comply with some US regulations</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>Hosted in Oregon, USA (us-west-2)</span>
						</li>
					</ul>
				</div>

				{/* India Hosting Section */}
				<div>
					<h3 className='font-semibold text-base mb-3'>India hosting</h3>
					<ul className='space-y-2'>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>Faster if you and your users are based in India</span>
						</li>
						<li className='flex items-start gap-2'>
							<Check className='h-5 w-5 text-green-600 mt-0.5 flex-shrink-0' />
							<span className='text-sm text-gray-700'>Hosted in Mumbai, India (ap-south-1)</span>
						</li>
					</ul>
				</div>
			</div>
		</Dialog>
	);
};

export default RegionInfoDialog;
