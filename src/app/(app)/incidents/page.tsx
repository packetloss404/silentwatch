import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { IncidentsView } from './IncidentsView';

export const dynamic = 'force-static';

export default async function IncidentsPage() {
  const [incidents, evidence, alerts, users] = await Promise.all([
    adapter.listIncidents(),
    adapter.listEvidence(),
    adapter.listAlerts(),
    adapter.listUsers(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operations"
        title="Incidents"
        description="Working queue. Each incident bundles related alerts, evidence, and operator notes for end-to-end investigation."
        meta={
          <>
            <Badge tone="amber" dot size="sm">{incidents.filter((i) => i.status === 'open').length} open</Badge>
            <Badge tone="cyan" dot size="sm">{incidents.filter((i) => i.status === 'investigating').length} investigating</Badge>
            <Badge tone="green" dot size="sm">{incidents.filter((i) => i.status === 'resolved').length} resolved</Badge>
          </>
        }
        actions={<Button variant="primary" iconLeft={<Plus size={13} />}>New incident</Button>}
      />

      <IncidentsView incidents={incidents} evidence={evidence} alerts={alerts} users={users} />
    </PageContainer>
  );
}
