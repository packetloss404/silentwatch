import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { MapWorkspace } from '@/components/map/MapWorkspace';

export const dynamic = 'force-static';

export default async function MapPage() {
  const [site, zones, assets, signals, alerts] = await Promise.all([
    adapter.getSite(),
    adapter.listZones(),
    adapter.listAssets(),
    adapter.listSignals(),
    adapter.listAlerts(),
  ]);

  return (
    <PageContainer variant="fluid">
      <MapWorkspace site={site} zones={zones} assets={assets} signals={signals} alerts={alerts} />
    </PageContainer>
  );
}
