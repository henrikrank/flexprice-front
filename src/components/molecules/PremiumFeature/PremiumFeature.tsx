import { Button, Dialog, Tooltip } from '@/components/atoms';
import { cn } from '@/lib/utils';
import { Sparkles, Star } from 'lucide-react';
import { useState } from 'react';

const PREMIUM_FEATURE_TOOLTIP_MESSAGE = 'This is a premium feature.';

export const PremiumFeatureIcon: React.FC<{ className?: string }> = ({ className }) => (
	<Tooltip content={PREMIUM_FEATURE_TOOLTIP_MESSAGE} delayDuration={0} sideOffset={6}>
		<button
			type='button'
			className='inline-flex shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded'
			aria-label={PREMIUM_FEATURE_TOOLTIP_MESSAGE}>
			<Star className={cn('size-4 text-[#ffbf76] fill-[#ffbf76]', className)} aria-hidden />
		</button>
	</Tooltip>
);

export const PremiumFeatureTag = () => {
	return (
		<div className='flex gap-2 top-2 right-2 items-center justify-center  text-[#ffbf76] text-xs !font-semibold px-2 py-1 rounded-2xl !opacity-80'>
			<Sparkles fill='#ffbf76' className='size-4 text-xs !font-bold' />
		</div>
	);
};

interface Props {
	children?: React.ReactNode;
	isPremiumFeature?: boolean;
}
const PremiumFeature: React.FC<Props> = ({ children, isPremiumFeature = false }) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div>
			<Dialog
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				title='Premium Feature'
				description='This is a premium feature. You need to upgrade to a premium plan to use this feature.'
				descriptionClassName='text-sm w-[90%]'>
				<div className='flex gap-2  justify-end items-center'>
					<Button>
						<a href='mailto:manish@flexprice.com'>Contact Us</a>
					</Button>
				</div>
			</Dialog>
			{isPremiumFeature ? (
				<div
					onClick={(e) => {
						if (isPremiumFeature) {
							e.preventDefault();
							e.stopPropagation();
							setIsOpen(true);
						}
					}}
					style={{
						pointerEvents: isPremiumFeature ? 'auto' : 'none',
						cursor: isPremiumFeature ? 'pointer' : 'not-allowed',
					}}>
					<div className={cn(isPremiumFeature && 'pointer-events-none cursor-not-allowed')}>{children}</div>
				</div>
			) : (
				children
			)}
		</div>
	);
};

export default PremiumFeature;
