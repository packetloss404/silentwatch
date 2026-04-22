import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, Plus, Upload } from 'lucide-react';
import { AssetsView } from './AssetsView';

export const dynamic = 'force-static';

export default async function AssetsPage() {
  const [assets, zones] = await Promise.all([adapter.listAssets(), adapter.listZones()]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Awareness"
        title="Assets"
        description="Inventory of cameras, sensors, gateways, doors and other physical infrastructure under operator stewardship."
        meta={
          <>
            <Badge tone="green" dot size="sm">{assets.filter((a) => a.status === 'online').length} online</Badge>
            <Badge tone="amber" dot size="sm">{assets.filter((a) => a.status === 'degraded').length} degraded</Badge>
            <Badge tone="red" dot size="sm">{assets.filter((a) => a.status === 'offline').length} offline</Badge>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<Upload size={13} />}>Import</Button>
            <Button variant="subtle" iconLeft={<Download size={13} />}>Export</Button>
            <Button variant="primary" iconLeft={<Plus size={13} />}>Register asset</Button>
          </>
        }
      />

      <AssetsView assets={assets} zones={zones} />
    </PageContainer>
  );
}
