import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useBreadcrumbsStore } from '@/store/useBreadcrumbsStore';
import { Card, Loader, DateRangePicker, FeatureMultiSelect } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import toast from 'react-hot-toast';
import CostSheetApi from '@/api/CostSheetApi';
import { GetCostAnalyticsRequest } from '@/types/dto/Cost';
import Feature from '@/models/Feature';
import { formatNumber } from '@/utils/common';
import { CostDataTable } from '@/components/molecules/CostDataTable';
import { getCurrencySymbol } from '@/utils/common/helper_functions';

const CustomerCostTab = () => {
	const { id: customerId } = useParams();
	const { updateBreadcrumb } = useBreadcrumbsStore();

	// Filter states
	const [selectedFeatures, setSelectedFeatures] = useState<Feature[]>([]);
	const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
	const [endDate, setEndDate] = useState<Date>(new Date());

	const {
		data: customer,
		isLoading: customerLoading,
		error: customerError,
	} = useQuery({
		queryKey: ['customer', customerId],
		queryFn: async () => {
			if (!customerId) throw new Error('Customer ID is required');
			return await CustomerApi.getCustomerById(customerId);
		},
		enabled: !!customerId,
	});

	// Prepare API parameters
	const apiParams: GetCostAnalyticsRequest | null = useMemo(() => {
		if (!customer?.external_id) {
			return null;
		}

		const params: GetCostAnalyticsRequest = {
			external_customer_id: customer.external_id,
			expand: ['meter', 'price'],
		};

		if (selectedFeatures.length > 0) {
			params.meter_ids = selectedFeatures.map((feature) => feature.meter_id);
		}

		if (startDate) {
			params.start_time = startDate.toISOString();
		}

		if (endDate) {
			params.end_time = endDate.toISOString();
		}

		return params;
	}, [customer?.external_id, selectedFeatures, startDate, endDate]);

	// Debounced API parameters with 300ms delay
	const [debouncedApiParams, setDebouncedApiParams] = useState<GetCostAnalyticsRequest | null>(null);

	useEffect(() => {
		if (apiParams) {
			const timeoutId = setTimeout(() => {
				setDebouncedApiParams(apiParams);
			}, 300);

			return () => clearTimeout(timeoutId);
		} else {
			setDebouncedApiParams(null);
		}
	}, [apiParams]);

	const {
		data: costData,
		isLoading: costLoading,
		error: costError,
	} = useQuery({
		queryKey: ['cost-analytics', customerId, debouncedApiParams],
		queryFn: async () => {
			return await CostSheetApi.GetCostAnalytics(debouncedApiParams ?? {});
		},
		enabled: !!debouncedApiParams,
	});

	useEffect(() => {
		updateBreadcrumb(4, 'Cost Analytics');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (customerLoading) {
		return <Loader />;
	}

	if (customerError) {
		toast.error('Error fetching customer data');
	}

	if (costError) {
		toast.error('Error fetching cost data');
	}

	const handleDateRangeChange = ({ startDate: newStartDate, endDate: newEndDate }: { startDate?: Date; endDate?: Date }) => {
		if (newStartDate) {
			setStartDate(newStartDate);
		}
		if (newEndDate) {
			setEndDate(newEndDate);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Filters Section */}
			<div className='flex flex-wrap items-end gap-3'>
				<div className='flex-1 min-w-[200px] max-w-md'>
					<FeatureMultiSelect
						label='Features'
						placeholder='Select features'
						values={selectedFeatures.map((f) => f.id)}
						onChange={setSelectedFeatures}
						className='text-sm'
					/>
				</div>
				<DateRangePicker
					startDate={startDate}
					endDate={endDate}
					onChange={handleDateRangeChange}
					placeholder='Select date range'
					title='Date Range'
				/>
			</div>

			{/* Summary Metrics */}
			<div className='pt-9'>
				{costLoading ? (
					<div className='flex items-center justify-center py-12'>
						<Loader />
					</div>
				) : (
					costData &&
					(() => {
						const totalRevenue = parseFloat(costData.total_revenue || '0');
						const totalCost = parseFloat(costData.total_cost || '0');
						const margin = parseFloat(costData.margin || '0');
						const marginPercent = parseFloat(costData.margin_percent || '0');
						const roi = parseFloat(costData.roi || '0');
						const roiPercent = parseFloat(costData.roi_percent || '0');

						return (
							<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
								{/* Revenue Card */}
								<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 relative' style={{ isolation: 'isolate' }}>
									<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal' style={{ fontFamily: 'Inter' }}>
										Revenue
									</p>
									<p className='text-[24px] leading-[28px] text-[#111827] font-medium' style={{ fontFamily: 'Inter' }}>
										{getCurrencySymbol(costData.currency)} {formatNumber(totalRevenue, 2)}
									</p>
								</div>

								{/* Cost Card */}
								<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 relative' style={{ isolation: 'isolate' }}>
									<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal' style={{ fontFamily: 'Inter' }}>
										Cost
									</p>
									<p className='text-[24px] leading-[28px] text-[#111827] font-medium' style={{ fontFamily: 'Inter' }}>
										{getCurrencySymbol(costData.currency)} {formatNumber(totalCost, 2)}
									</p>
								</div>

								{/* Margin Card */}
								<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 relative' style={{ isolation: 'isolate' }}>
									<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal' style={{ fontFamily: 'Inter' }}>
										Margin
									</p>
									<p
										className={`text-[24px] leading-[28px] font-medium ${margin >= 0 ? 'text-[#111827]' : 'text-[#DC2626]'}`}
										style={{ fontFamily: 'Inter' }}>
										{getCurrencySymbol(costData.currency)} {formatNumber(margin, 2)}
									</p>
									<div className='absolute right-[13.46px] top-[13px] flex items-center px-2 py-1 gap-[3.99px] z-10'>
										<span
											className={`text-[12px] leading-[18px] font-medium ${margin >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
											style={{ fontFamily: 'Inter' }}>
											{margin >= 0 ? '↑' : '↓'}
										</span>
										<span
											className={`text-[12px] leading-[18px] font-medium ${margin >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
											style={{ fontFamily: 'Inter' }}>
											{formatNumber(Math.abs(marginPercent), 2)}%
										</span>
									</div>
								</div>

								{/* ROI Card */}
								<div className='bg-white border border-[#E5E7EB] p-[25px] flex flex-col gap-3 relative' style={{ isolation: 'isolate' }}>
									<p className='text-[14px] leading-[21px] text-[#4B5563] font-normal' style={{ fontFamily: 'Inter' }}>
										ROI
									</p>
									<p
										className={`text-[24px] leading-[28px] font-medium ${roi >= 0 ? 'text-[#111827]' : 'text-[#DC2626]'}`}
										style={{ fontFamily: 'Inter' }}>
										{getCurrencySymbol(costData.currency)} {formatNumber(roi, 2)}
									</p>
									<div className='absolute right-[12.74px] top-[13px] flex items-center px-2 py-1 gap-[3.99px] z-10'>
										<span
											className={`text-[12px] leading-[18px] font-medium ${roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
											style={{ fontFamily: 'Inter' }}>
											{roi >= 0 ? '↑' : '↓'}
										</span>
										<span
											className={`text-[12px] leading-[18px] font-medium ${roi >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}
											style={{ fontFamily: 'Inter' }}>
											{formatNumber(Math.abs(roiPercent), 2)}%
										</span>
									</div>
								</div>
							</div>
						);
					})()
				)}
			</div>

			{/* Cost Data Table */}
			<div className='pt-9'>
				{costLoading ? (
					<div className='mt-6'>
						<h1 className='text-lg font-medium text-gray-900 mb-4'>Cost Breakdown</h1>
						<Card>
							<div className='p-12'>
								<div className='flex items-center justify-center'>
									<Loader />
								</div>
							</div>
						</Card>
					</div>
				) : (
					costData && (
						<div className='mt-6'>
							<CostDataTable items={costData.cost_analytics} />
						</div>
					)
				)}
			</div>
		</div>
	);
};

export default CustomerCostTab;
