import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Page, Loader, Select } from '@/components/atoms';
import EventsApi from '@/api/EventsApi';
import toast from 'react-hot-toast';
import { GetMonitoringDataRequest } from '@/types';
import { WindowSize } from '@/models';
import { EventsMonitoringChart } from '@/components/molecules';

enum TimePeriod {
	LAST_HOUR = 'last-hour',
	LAST_DAY = 'last-day',
	LAST_WEEK = 'last-week',
	LAST_30_DAYS = 'last-30-days',
}

const timePeriodOptions = [
	{ value: TimePeriod.LAST_HOUR, label: 'Last hour' },
	{ value: TimePeriod.LAST_DAY, label: 'Last day' },
	{ value: TimePeriod.LAST_WEEK, label: 'Last week' },
	{ value: TimePeriod.LAST_30_DAYS, label: 'Last 30 days' },
];

const windowSizeOptions = [
	{ value: WindowSize.MINUTE, label: 'Minute' },
	{ value: WindowSize.FIFTEEN_MIN, label: '15 Minutes' },
	{ value: WindowSize.THIRTY_MIN, label: '30 Minutes' },
	{ value: WindowSize.HOUR, label: 'Hour' },
	{ value: WindowSize.THREE_HOUR, label: '3 Hours' },
	{ value: WindowSize.SIX_HOUR, label: '6 Hours' },
	{ value: WindowSize.TWELVE_HOUR, label: '12 Hours' },
	{ value: WindowSize.DAY, label: 'Day' },
	{ value: WindowSize.WEEK, label: 'Week' },
	{ value: WindowSize.MONTH, label: 'Month' },
];

const getTimeRangeForPeriod = (period: TimePeriod): { startDate: Date; endDate: Date } => {
	const endDate = new Date();
	let startDate = new Date();

	switch (period) {
		case TimePeriod.LAST_HOUR:
			startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_DAY:
			startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_WEEK:
			startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case TimePeriod.LAST_30_DAYS:
			startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
	}

	return { startDate, endDate };
};

const DashboardPage = () => {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>(TimePeriod.LAST_WEEK);
	const [windowSize, setWindowSize] = useState<WindowSize>(WindowSize.HOUR);

	// Calculate date range based on selected time period
	const { startDate, endDate } = useMemo(() => {
		return getTimeRangeForPeriod(timePeriod);
	}, [timePeriod]);

	// Prepare Monitoring API parameters
	const monitoringApiParams: GetMonitoringDataRequest = useMemo(() => {
		const params: GetMonitoringDataRequest = {
			window_size: windowSize,
		};
		if (startDate) params.start_time = startDate.toISOString();
		if (endDate) params.end_time = endDate.toISOString();
		return params;
	}, [startDate, endDate, windowSize]);

	// Debounced API parameters with 300ms delay
	const [debouncedMonitoringParams, setDebouncedMonitoringParams] = useState<GetMonitoringDataRequest | null>(null);

	useEffect(() => {
		const timeoutId = setTimeout(() => {
			setDebouncedMonitoringParams(monitoringApiParams);
		}, 300);

		return () => clearTimeout(timeoutId);
	}, [monitoringApiParams]);

	const {
		data: monitoringData,
		isLoading: monitoringLoading,
		error: monitoringError,
	} = useQuery({
		queryKey: ['monitoring', 'dashboard', debouncedMonitoringParams],
		queryFn: async () => {
			if (!debouncedMonitoringParams) {
				throw new Error('Monitoring API parameters not available');
			}
			return await EventsApi.getMonitoringData(debouncedMonitoringParams);
		},
		enabled: !!debouncedMonitoringParams,
		refetchInterval: 30000, // Refetch every 30 seconds for real-time monitoring
	});

	useEffect(() => {
		if (monitoringError) {
			toast.error('Error fetching monitoring data');
		}
	}, [monitoringError]);

	// Format "Updated just now" timestamp
	const getUpdatedTime = () => {
		return 'Updated just now';
	};

	return (
		<Page heading='Home'>
			<div className='space-y-6'>
				{/* Controls */}
				<div className='flex flex-col sm:flex-row gap-4 sm:justify-end mb-6'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<div className='flex flex-col gap-1'>
							<label className='text-xs font-medium text-gray-600'>Time Period</label>
							<Select
								value={timePeriod}
								options={timePeriodOptions}
								onChange={(value) => setTimePeriod(value as TimePeriod)}
								className='min-w-[150px]'
							/>
						</div>
						<div className='flex flex-col gap-1'>
							<label className='text-xs font-medium text-gray-600'>Window Size</label>
							<Select
								value={windowSize}
								options={windowSizeOptions}
								onChange={(value) => setWindowSize(value as WindowSize)}
								className='min-w-[150px]'
							/>
						</div>
					</div>
				</div>

				{/* Events Monitoring Chart */}
				<div>
					{monitoringLoading ? (
						<div className='flex items-center justify-center py-12 border rounded-lg'>
							<Loader />
						</div>
					) : (
						monitoringData && <EventsMonitoringChart data={monitoringData} title='Events Monitoring' description={getUpdatedTime()} />
					)}
				</div>
			</div>
		</Page>
	);
};

export default DashboardPage;
