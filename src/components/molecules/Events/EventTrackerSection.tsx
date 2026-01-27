import { FC } from 'react';
import { GetEventDebugResponse, DebugTrackerStatus, EventDebugStatus } from '@/types/dto';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EventTrackerStep from './EventTrackerStep';
import JsonCodeBlock from './JsonCodeBlock';
import toast from 'react-hot-toast';

interface EventTrackerSectionProps {
	debugResponse: GetEventDebugResponse;
	displayEventTimestamp?: string;
}

const EventTrackerSection: FC<EventTrackerSectionProps> = ({ debugResponse, displayEventTimestamp }) => {
	const t = debugResponse.debug_tracker;
	const overallStatus = debugResponse.status;

	const steps: Array<{
		key: 'customer_lookup' | 'meter_lookup' | 'price_lookup' | 'subscription_line_item_lookup';
		title: string;
		status?: DebugTrackerStatus | EventDebugStatus;
		value: any;
	}> = [
		{
			key: 'customer_lookup',
			title: 'Customer Lookup',
			status: t?.customer_lookup?.status ?? 'unprocessed',
			value: t?.customer_lookup ?? {},
		},
		{
			key: 'meter_lookup',
			title: 'Feature Lookup',
			status: t?.meter_matching?.status ?? 'unprocessed',
			value: t?.meter_matching ?? {},
		},
		{
			key: 'price_lookup',
			title: 'Price Lookup',
			status: t?.price_lookup?.status ?? 'unprocessed',
			value: t?.price_lookup ?? {},
		},
		{
			key: 'subscription_line_item_lookup',
			title: 'Subscription Line Item Lookup',
			status: t?.subscription_line_item_lookup?.status ?? 'unprocessed',
			value: t?.subscription_line_item_lookup ?? {},
		},
	];

	return (
		<div className='space-y-0'>
			{/* Tracker Steps - No heading, Sheet title is enough */}
			<div className='relative'>
				{/* Vertical line */}
				<div className='absolute left-3 top-2 bottom-2 w-px bg-gray-100' />

				{/* Ingested step (not expandable) */}
				<div className='mb-4'>
					<EventTrackerStep title='Ingested' stepKey='ingested' value={{}} isIngested={true} timestamp={displayEventTimestamp} />
				</div>

				<Accordion type='single' collapsible className='border-none'>
					{steps.map((s) => (
						<AccordionItem key={s.key} value={s.key} className='border-b-0'>
							<AccordionTrigger className='py-2 hover:no-underline px-0'>
								<EventTrackerStep title={s.title} status={s.status} value={s.value} stepKey={s.key} />
							</AccordionTrigger>
							<AccordionContent className='pl-0'>
								<div className='ml-[40px] relative z-10 mt-3'>
									<JsonCodeBlock
										value={s.value}
										title='Response'
										onCopy={() => {
											navigator.clipboard.writeText(JSON.stringify(s.value ?? {}, null, 2));
											toast.success('Copied to clipboard!');
										}}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>

				{/* Attributed to Customer: status row only (no dropdown) */}
				<div className='mt-4'>
					<EventTrackerStep
						title='Attributed to Customer'
						stepKey='attributed'
						value={{}}
						isAttributed={true}
						overallStatus={overallStatus}
					/>
				</div>
			</div>
		</div>
	);
};

export default EventTrackerSection;
