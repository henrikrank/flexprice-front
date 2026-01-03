import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Card } from '@/components/atoms';
import { Event } from '@/models/Event';
import EventsApi from '@/api/EventsApi';
import CustomerApi from '@/api/CustomerApi';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/utils/common/Logger';
import { cn } from '@/lib/utils';
import EmptyState from './EmptyState';
import EventsTable from './EventsTable';

interface UsageEventsTabProps {
	customerId: string;
}

type TimePeriod = '1d' | '7d' | '30d';

const UsageEventsTab = ({ customerId }: UsageEventsTabProps) => {
	const [events, setEvents] = useState<Event[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [iterLastKey, setIterLastKey] = useState<string | undefined>(undefined);
	const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('7d');
	const observer = useRef<IntersectionObserver | null>(null);
	const loadingRef = useRef(false);

	// Fetch customer to get external_id
	const { data: customer, isLoading: customerLoading } = useQuery({
		queryKey: ['portal-customer-events', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId),
		enabled: !!customerId,
	});

	// Calculate time range based on selected period
	const timeRange = useMemo(() => {
		const endDate = new Date();
		const startDate = new Date();

		const daysMap: Record<TimePeriod, number> = {
			'1d': 1,
			'7d': 7,
			'30d': 30,
		};

		startDate.setDate(startDate.getDate() - daysMap[selectedPeriod]);
		return {
			start_time: startDate.toISOString(),
			end_time: endDate.toISOString(),
		};
	}, [selectedPeriod]);

	// Fetch events from API
	const fetchEvents = useCallback(
		async (iterLastKey?: string) => {
			if (loadingRef.current || !customer?.external_id) return;

			loadingRef.current = true;
			setLoading(true);
			try {
				const response = await EventsApi.getRawEvents({
					iter_last_key: iterLastKey,
					page_size: 20,
					external_customer_id: customer.external_id,
					start_time: timeRange.start_time,
					end_time: timeRange.end_time,
				});

				if (response.events) {
					setEvents((prevEvents) => (iterLastKey ? [...prevEvents, ...response.events] : response.events));
					setIterLastKey(response.iter_last_key);
					setHasMore(response.has_more);
				}
			} catch (error) {
				logger.error('Error fetching events:', error);
				toast.error('Failed to load events');
			} finally {
				loadingRef.current = false;
				setLoading(false);
			}
		},
		[customer?.external_id, timeRange.start_time, timeRange.end_time],
	);

	const lastElementRef = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(node: any) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore && !loading) {
					fetchEvents(iterLastKey);
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore, iterLastKey, fetchEvents],
	);

	// Refetch events when customer is loaded or time range changes
	useEffect(() => {
		if (!customer?.external_id) return;

		// Reset state
		setEvents([]);
		setIterLastKey(undefined);
		setHasMore(true);
		loadingRef.current = false;
		setLoading(false);

		// Fetch events directly
		const loadEvents = async () => {
			if (loadingRef.current) return;
			loadingRef.current = true;
			setLoading(true);
			try {
				const response = await EventsApi.getRawEvents({
					iter_last_key: undefined,
					page_size: 20,
					external_customer_id: customer.external_id,
					start_time: timeRange.start_time,
					end_time: timeRange.end_time,
				});

				if (response.events) {
					setEvents(response.events);
					setIterLastKey(response.iter_last_key);
					setHasMore(response.has_more);
				}
			} catch (error) {
				logger.error('Error fetching events:', error);
				toast.error('Failed to load events');
			} finally {
				loadingRef.current = false;
				setLoading(false);
			}
		};

		loadEvents();
	}, [customer?.external_id, timeRange.start_time, timeRange.end_time]);

	if (customerLoading) {
		return (
			<div className='space-y-6'>
				<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
					<div className='animate-pulse space-y-4'>
						<div className='h-10 bg-zinc-100 rounded'></div>
						<div className='h-12 bg-zinc-100 rounded'></div>
						<div className='h-12 bg-zinc-100 rounded'></div>
					</div>
				</Card>
			</div>
		);
	}

	if (!customer?.external_id) {
		return (
			<Card className='bg-white border border-[#E9E9E9] rounded-xl p-6'>
				<EmptyState title='Unable to load events' description='Customer information is missing' />
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Events Table */}
			<Card className='bg-white border border-[#E9E9E9] rounded-xl overflow-hidden'>
				<div className='flex items-center justify-between p-6 border-b border-[#E9E9E9]'>
					<h3 className='text-base font-medium text-zinc-950'>Usage</h3>
					<div className='flex items-center gap-1 bg-zinc-50 rounded-lg p-1'>
						{(['1d', '7d', '30d'] as TimePeriod[]).map((period) => (
							<button
								key={period}
								onClick={() => setSelectedPeriod(period)}
								className={cn(
									'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
									selectedPeriod === period ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
								)}>
								{period}
							</button>
						))}
					</div>
				</div>
				{events.length > 0 ? (
					<>
						<EventsTable data={events} />
						<div ref={lastElementRef} />
						{loading && (
							<div className='space-y-4 p-4'>
								<Skeleton className='h-8 w-full' />
								<Skeleton className='h-8 w-full' />
								<Skeleton className='h-8 w-full' />
							</div>
						)}
					</>
				) : !loading ? (
					<div className='py-8'>
						<EmptyState title='No events found' description={`Your events from the last ${selectedPeriod} will appear here`} />
					</div>
				) : (
					<div className='space-y-4 p-4'>
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
						<Skeleton className='h-8 w-full' />
					</div>
				)}
			</Card>
		</div>
	);
};

export default UsageEventsTab;
