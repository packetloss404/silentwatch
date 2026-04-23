import { adapter } from '@/lib/mock/adapter';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Download, Filter } from 'lucide-react';
import { SignalsView } from './SignalsView';

export const dynamic = 'force-static';

export default async function SignalsPage() {
  const [signals, alerts] = await Promise.all([adapter.listSignals(), adapter.listAlerts()]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Ambient radio"
        title="RF & Wi-Fi"
        description="Wi-Fi, Bluetooth, and BLE near or at the property (what passes the line in radio terms). Complements camera and LPR feeds; it is not a server or LAN operations console. Classify as known, suspicious, or track drift over time."
        meta={
          <>
            <Badge tone="green" dot size="sm">
              {signals.filter((s) => s.classification === 'known').length} known
            </Badge>
            <Badge tone="amber" dot size="sm">
              {signals.filter((s) => s.classification === 'suspicious').length} suspicious
            </Badge>
            <Badge tone="neutral" dot size="sm">
              {signals.filter((s) => s.classification === 'unknown').length} unknown
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="ghost" iconLeft={<Filter size={13} />}>Filters</Button>
            <Button variant="subtle" iconLeft={<Download size={13} />}>Export CSV</Button>
          </>
        }
      />

      <SignalsView signals={signals} alerts={alerts} />
    </PageContainer>
  );
}
