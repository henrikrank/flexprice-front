import { Button, Card, CardHeader, Chip, Loader, Page, Spacer } from '@/components/atoms';
import { ApiDocsContent, ColumnData, DetailsCard, FlexpriceTable, TooltipCell } from '@/components/molecules';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import WorkflowApi from '@/api/WorkflowApi';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { WORKFLOW_TYPE_DISPLAY_NAMES } from '@/constants/workflow';
import type { WorkflowDetailsResponse, WorkflowActivityDTO } from '@/types/dto';

const WorkflowDetailsPage = () => {
	const { workflowId, runId } = useParams<{ workflowId: string; runId: string }>();
	const navigate = useNavigate();

	const { data, isLoading, isError } = useQuery({
		queryKey: ['workflowDetails', workflowId, runId],
		queryFn: () => WorkflowApi.getDetails(workflowId!, runId!),
		enabled: !!workflowId && !!runId,
	});

	if (isLoading) return <Loader />;
	if (isError || !data) {
		return (
			<Page heading='Workflow'>
				<div className='text-center py-12'>
					<h3 className='text-lg font-medium text-gray-900 mb-2'>Workflow not found</h3>
					<p className='text-muted-foreground mb-4'>Failed to load workflow or it may have been removed.</p>
					<Button variant='outline' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}>
						Back to Workflows
					</Button>
				</div>
			</Page>
		);
	}

	const wf = data as WorkflowDetailsResponse;

	const summaryData = [
		{ label: 'Workflow ID', value: <TooltipCell tooltipContent={wf.workflow_id} tooltipText={wf.workflow_id} /> },
		{ label: 'Run ID', value: <TooltipCell tooltipContent={wf.run_id} tooltipText={wf.run_id} /> },
		{
			label: 'Workflow type',
			value: WORKFLOW_TYPE_DISPLAY_NAMES[wf.workflow_type] ?? wf.workflow_type,
		},
		{ label: 'Task queue', value: wf.task_queue },
		{
			label: 'Status',
			value: <Chip variant={wf.status === 'Completed' ? 'success' : wf.status === 'Failed' ? 'failed' : 'default'} label={wf.status} />,
		},
		{
			label: 'Duration',
			value: wf.total_duration ?? (wf.duration_ms != null ? `${wf.duration_ms}ms` : '—'),
		},
		{
			label: 'Start time',
			value: <span title={wf.start_time}>{formatDate(wf.start_time)}</span>,
		},
		{
			label: 'Close time',
			value: wf.close_time ? <span title={wf.close_time}>{formatDate(wf.close_time)}</span> : '—',
		},
	];

	const activityColumns: ColumnData<WorkflowActivityDTO>[] = [
		{ fieldName: 'activity_id', title: 'Activity ID' },
		{ fieldName: 'activity_type', title: 'Activity type' },
		{
			title: 'Status',
			render: (row) => (
				<Chip variant={row.status === 'COMPLETED' ? 'success' : row.status === 'FAILED' ? 'failed' : 'default'} label={row.status} />
			),
		},
		{
			title: 'Start',
			render: (row) => (row.start_time ? <span title={row.start_time}>{formatDate(row.start_time)}</span> : '—'),
		},
		{
			title: 'Close',
			render: (row) => (row.close_time ? <span title={row.close_time}>{formatDate(row.close_time)}</span> : '—'),
		},
		{ fieldName: 'retry_attempt', title: 'Retries' },
		{
			title: 'Error',
			render: (row) => (row.error ? <span className='text-destructive text-sm'>{row.error.message}</span> : '—'),
		},
	];

	return (
		<Page heading='Workflow details'>
			<div className='mb-6'>
				<Button variant='outline' size='sm' prefixIcon={<ArrowLeft className='h-4 w-4' />} onClick={() => navigate(RouteNames.workflows)}>
					Back to Workflows
				</Button>
			</div>

			<ApiDocsContent tags={['Workflows']} />

			<div className='space-y-6'>
				<DetailsCard variant='stacked' title='Summary' data={summaryData} />

				<Card variant='notched'>
					<CardHeader title='Activities' />
					{wf.activities?.length ? (
						<FlexpriceTable columns={activityColumns} data={wf.activities} showEmptyRow={false} />
					) : (
						<p className='text-sm text-muted-foreground'>No activities recorded.</p>
					)}
				</Card>

				{wf.metadata && Object.keys(wf.metadata).length > 0 && (
					<Card variant='notched'>
						<CardHeader title='Metadata' />
						<div className='p-4'>
							<pre className='text-sm bg-gray-50 p-3 rounded overflow-auto max-h-48'>{JSON.stringify(wf.metadata, null, 2)}</pre>
						</div>
					</Card>
				)}

				<Spacer className='!h-20' />
			</div>
		</Page>
	);
};

export default WorkflowDetailsPage;
