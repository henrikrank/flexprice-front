import { useParams } from 'react-router';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { ApiDocsContent } from '@/components/molecules';
import { EntityChargesPage, ENTITY_TYPE } from '@/components/organisms';

const CostSheetChargesPage = () => {
	const { costSheetId } = useParams<{ costSheetId: string }>();

	return (
		<>
			<ApiDocsContent tags={[...API_DOCS_TAGS.Costs]} />
			<EntityChargesPage entityType={ENTITY_TYPE.COST_SHEET} entityId={costSheetId!} entityName='Cost Sheet' />
		</>
	);
};

export default CostSheetChargesPage;
