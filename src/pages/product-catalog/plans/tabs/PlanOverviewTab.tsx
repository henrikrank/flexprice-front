import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { PlanPriceTable } from '@/components/organisms';
import { PlanApi } from '@/api';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { Loader } from '@/components/atoms';
import toast from 'react-hot-toast';

const PlanOverviewTab = () => {
	const { planId } = useParams<{ planId: string }>();

	const {
		data: planData,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['fetchPlan', planId],
		queryFn: async () => {
			return await PlanApi.getPlanById(planId!);
		},
		enabled: !!planId,
	});

	if (isLoading) {
		return <Loader />;
	}

	if (isError || !planData) {
		toast.error('Error loading plan data');
		return null;
	}

	return (
		<div className='space-y-6'>
			{/* Plan Prices Table */}
			<PlanPriceTable plan={planData as any} onPriceUpdate={() => refetchQueries(['fetchPlan', planId!])} />
		</div>
	);
};

export default PlanOverviewTab;
