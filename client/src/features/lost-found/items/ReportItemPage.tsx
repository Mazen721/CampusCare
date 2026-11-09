import { ClipboardCheck, Eye, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportItemForm } from '@/features/lost-found/items/ReportItemForm';

export function ReportItemPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('lostFound.reportItemEyebrow')}
        title={t('lostFound.reportItemTitle')}
        description={t('lostFound.reportItemDescription')}
        actions={
          <Button asChild variant="outline">
            <Link to="/lost-found">{t('lostFound.backToBrowse')}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t('lostFound.reportDetails')}</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('lostFound.reportDetailsDesc')}
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <ReportItemForm onCancel={() => navigate('/lost-found')} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-amber-300/70 bg-amber-50/60">
            <CardHeader className="border-b border-amber-200/70">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-amber-700" aria-hidden="true" />
                {t('lostFound.protectDetailsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-xs leading-relaxed text-amber-950">
              <p>{t('lostFound.protectDetailsDesc')}</p>
              <p>{t('lostFound.protectDetailsHint')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('lostFound.whatEveryoneSeesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-5 text-xs leading-relaxed text-muted-foreground">
              <p>{t('lostFound.whatEveryoneSeesDesc')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('lostFound.afterSubmitTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-5 text-xs leading-relaxed text-muted-foreground">
              <p>{t('lostFound.afterSubmitDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
