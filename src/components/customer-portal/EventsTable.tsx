import { FC, useState } from 'react';
import FlexpriceTable, { ColumnData, TooltipCell } from '@/components/molecules/Table';
import { formatDateWithMilliseconds } from '@/utils/common/format_date';
import EventPropertiesDrawer from '@/components/molecules/Events/EventPropertiesDrawer';
import { Event } from '@/models/Event';

interface Props {
	data: Event[];
}

const EventsTable: FC<Props> = ({ data }) => {
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	const columns: ColumnData[] = [
		{
			title: 'Event Name',
			render(rowData) {
				return <span>{rowData.event_name || '--'}</span>;
			},
		},
		{
			title: 'Timestamp',
			render(rowData) {
				return <span>{formatDateWithMilliseconds(rowData.timestamp)}</span>;
			},
		},
		{
			title: 'Event ID',
			render(rowData) {
				return <TooltipCell tooltipContent={rowData.id} tooltipText={rowData.id} />;
			},
		},
		{
			title: 'Properties',
			render(rowData) {
				const propertyCount = rowData.properties ? Object.keys(rowData.properties).length : 0;
				return (
					<span className='text-zinc-600'>
						{propertyCount > 0 ? `${propertyCount} ${propertyCount === 1 ? 'property' : 'properties'}` : 'No properties'}
					</span>
				);
			},
		},
	];

	const handleRowClick = (event: Event) => {
		setSelectedEvent(event);
		setIsDrawerOpen(true);
	};

	return (
		<div>
			<FlexpriceTable showEmptyRow columns={columns} data={data} onRowClick={handleRowClick} />
			<EventPropertiesDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} event={selectedEvent} />
		</div>
	);
};

export default EventsTable;
