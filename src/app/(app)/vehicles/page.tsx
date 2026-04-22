import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, Plus } from 'lucide-react';
import { VehiclesView } from './VehiclesView';

export const dynamic = 'force-static';

export default async function VehiclesPage() {
  const [vehicles, watchlist, assets] = await Promise.all([
    adapter.listVehicles(),
    adapter.listWatchlist(),
    adapter.listAssets(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Awareness · LPR"
        title="Vehicles"
        description="Plate observations from operator-owned LPR cameras. Plates are masked in the UI; SilentWatch never resolves plates to owners and never builds identity dossiers."
        meta={
          <>
            <Badge tone="green" dot size="sm">{vehicles.filter((v) => v.classification === 'expected').length} expected</Badge>
            <Badge tone="cyan" dot size="sm">{vehicles.filter((v) => v.classification === 'repeat').length} repeat</Badge>
            <Badge tone="amber" dot size="sm">{vehicles.filter((v) => v.classification === 'flagged').length} flagged</Badge>
            <Badge tone="neutral" dot size="sm">{vehicles.filter((v) => v.classification === 'unknown').length} unknown</Badge>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<Download size={13} />}>Export 7-day log</Button>
            <Button variant="primary" iconLeft={<Plus size={13} />}>Watchlist entry</Button>
          </>
        }
      />

      <VehiclesView vehicles={vehicles} watchlist={watchlist} assets={assets} />
    </PageContainer>
  );
}
