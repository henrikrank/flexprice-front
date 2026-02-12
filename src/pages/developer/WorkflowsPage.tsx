import { Page, Chip } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules';
import { ColumnData, TooltipCell } from '@/components/molecules/Table';
import { QueryableDataArea } from '@/components/organisms';
import WorkflowApi from '@/api/WorkflowApi';
import { useMemo, useCallback } from 'react';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import { useNavigate } from 'react-router';
import { RouteNames } from '@/core/routes/Routes';
import formatDate from '@/utils/common/format_date';
import { WORKFLOW_TYPE_DISPLAY_NAMES } from '@/constants/workflow';
import type { WorkflowExecutionDTO } from '@/types/dto';
import type { SearchWorkflowsRequest } from '@/types/dto';

const FIELD_WORKFLOW_ID = 'workflow_id';
const FIELD_WORKFLOW_TYPE = 'workflow_type';
const FIELD_TASK_QUEUE = 'task_queue';
const FIELD_WORKFLOW_STATUS = 'workflow_status';
const FIELD_ENTITY = 'entity';
const FIELD_ENTITY_ID = 'entity_id';

function buildSearchPayload(params: {
	limit: number;
	offset: number;
	filters: FilterCondition[];
	sort: SortOption[];
}): SearchWorkflowsRequest {
	const payload: SearchWorkflowsRequest = {
		limit: params.limit,
		offset: params.offset,
	};
	for (const f of params.filters) {
		const str = (f.valueString ?? '').trim();
		const arr = f.valueArray ?? [];
		if (f.field === FIELD_WORKFLOW_ID && str) payload.workflow_id = str;
		else if (f.field === FIELD_WORKFLOW_TYPE && str) payload.workflow_type = str;
		else if (f.field === FIELD_TASK_QUEUE && str) payload.task_queue = str;
		else if (f.field === FIELD_WORKFLOW_STATUS && (str || arr.length > 0)) payload.workflow_status = str || arr[0];
		else if (f.field === FIELD_ENTITY && str) payload.entity = str;
		else if (f.field === FIELD_ENTITY_ID && str) payload.entity_id = str;
	}
	if (params.sort?.[0]) {
		payload.sort = params.sort[0].field;
		payload.order = params.sort[0].direction ?? SortDirection.DESC;
	}
	return payload;
}

const sortingOptions: SortOption[] = [
	{ field: 'start_time', label: 'Start time', direction: SortDirection.DESC },
	{ field: 'end_time', label: 'End time', direction: SortDirection.DESC },
	{ field: 'created_at', label: 'Created at', direction: SortDirection.DESC },
];

const filterOptions: FilterField[] = [
	{
		field: FIELD_WORKFLOW_ID,
		label: 'Workflow ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: FIELD_WORKFLOW_TYPE,
		label: 'Workflow type',
		fieldType: FilterFieldType.SELECT,
		operators: [FilterOperator.EQUAL],
		dataType: DataType.STRING,
		options: Object.entries(WORKFLOW_TYPE_DISPLAY_NAMES).map(([value, label]) => ({ value, label })),
	},
	{
		field: FIELD_TASK_QUEUE,
		label: 'Task queue',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: FIELD_WORKFLOW_STATUS,
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: 'Running', label: 'Running' },
			{ value: 'Completed', label: 'Completed' },
			{ value: 'Failed', label: 'Failed' },
			{ value: 'Canceled', label: 'Canceled' },
			{ value: 'Terminated', label: 'Terminated' },
			{ value: 'ContinuedAsNew', label: 'Continued As New' },
			{ value: 'TimedOut', label: 'Timed Out' },
		],
	},
	{
		field: FIELD_ENTITY,
		label: 'Entity',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
	{
		field: FIELD_ENTITY_ID,
		label: 'Entity ID',
		fieldType: FilterFieldType.INPUT,
		operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
		dataType: DataType.STRING,
	},
];

const initialFilters: FilterCondition[] = [];
const initialSorts: SortOption[] = [{ field: 'start_time', label: 'Start time', direction: SortDirection.DESC }];

const WorkflowsPage = () => {
	const navigate = useNavigate();

	const fetchFn = useCallback(async (params: { limit: number; offset: number; filters: FilterCondition[]; sort: SortOption[] }) => {
		return WorkflowApi.search(buildSearchPayload(params));
	}, []);

	const probeFetchFn = useCallback(async () => {
		return WorkflowApi.search(buildSearchPayload({ limit: 1, offset: 0, filters: [], sort: initialSorts }));
	}, []);

	const columns: ColumnData<WorkflowExecutionDTO>[] = useMemo(
		() => [
			{
				title: 'Workflow ID',
				width: 200,
				render: (row) => <TooltipCell tooltipContent={row.workflow_id} tooltipText={row.workflow_id} />,
			},
			{
				title: 'Run ID',
				width: 200,
				render: (row) => <TooltipCell tooltipContent={row.run_id} tooltipText={row.run_id} />,
			},
			{ fieldName: 'workflow_type', title: 'Workflow type' },
			{
				title: 'Status',
				render: (row) => {
					const status = row.status ?? '—';
					const label = status === 'Completed' ? 'Completed' : status === 'Failed' ? 'Failed' : status;
					return <Chip variant={status === 'Completed' ? 'success' : status === 'Failed' ? 'failed' : 'default'} label={label} />;
				},
			},
			{
				title: 'Start time',
				render: (row) => <TooltipCell tooltipContent={formatDate(row.start_time)} tooltipText={row.start_time || '—'} />,
			},
		],
		[],
	);

	return (
		<Page heading='Workflows'>
			<ApiDocsContent tags={['Workflows']} />
			<QueryableDataArea<WorkflowExecutionDTO>
				queryConfig={{
					filterOptions,
					sortOptions: sortingOptions,
					initialFilters,
					initialSorts,
					debounceTime: 300,
				}}
				dataConfig={{
					queryKey: 'fetchWorkflows',
					fetchFn,
					probeFetchFn,
				}}
				tableConfig={{
					columns,
					onRowClick: (row) => {
						navigate(RouteNames.workflowDetails.replace(':workflowId', row.workflow_id).replace(':runId', row.run_id));
					},
					showEmptyRow: true,
				}}
				paginationConfig={{ unit: 'Workflows' }}
				emptyStateConfig={{
					heading: 'Workflows',
					description: 'Temporal workflow executions will appear here when runs are recorded.',
				}}
			/>
		</Page>
	);
};

export default WorkflowsPage;
