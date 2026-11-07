import { ClipboardCheck, Eye, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportItemForm } from '@/features/lost-found/items/ReportItemForm';

export function ReportItemPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lost & Found"
        title="Report a lost or found item"
        description="Create a public listing and give the Lost & Found Office the private details needed to verify ownership."
        actions={
          <Button asChild variant="outline">
            <Link to="/lost-found">Back to browse</Link>
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Report details</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Public fields help people recognise the item. Private details are only used to verify a
              claim.
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
                Protect identifying details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-xs leading-relaxed text-amber-950">
              <p>
                Never put serial numbers, full names, phone numbers or unique hidden marks in the
                public title or description.
              </p>
              <p>
                Put them in <strong>Private identification details</strong>. Only the reporter, a
                Lost &amp; Found Officer and the Admin can view that field.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                What everyone sees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-5 text-xs leading-relaxed text-muted-foreground">
              <p>Report number, type, title, public description and category.</p>
              <p>Colour, brand, campus location, occurrence date and photos.</p>
              <p>Current status. Reporter contact details are never included.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                After you submit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-5 text-xs leading-relaxed text-muted-foreground">
              <p>
                Your report becomes searchable immediately. The Lost &amp; Found Office reviews
                possible matches and manages claims.
              </p>
              <p>
                You can close your own lost report from its detail page while it remains open.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
