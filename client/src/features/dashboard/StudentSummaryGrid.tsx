import {
  PackagePlus,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StudentDashboard as StudentDashboardData } from '@/types/dashboard';
import type { RequestStatus } from '@/types/meta';

const ACTIVE_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'IN_PROGRESS',
  'REOPENED',
];

type CardTone = 'navy' | 'gold' | 'emerald';

interface SelfServiceCardSpec {
  key: string;
  tone: CardTone;
  icon: LucideIcon;
  statusPill: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaIcon: LucideIcon;
  to: string;
  primaryCta?: boolean;
}

const TONE_STYLES: Record<CardTone, { iconChip: string; statusPill: string }> = {
  navy: {
    iconChip: 'bg-primary/[0.08] text-primary',
    statusPill: 'border-primary/15 bg-secondary/70 text-foreground',
  },
  gold: {
    iconChip: 'bg-amber-500/[0.12] text-amber-800',
    statusPill: 'border-amber-500/30 bg-amber-500/[0.12] text-amber-800',
  },
  emerald: {
    iconChip: 'bg-emerald-500/10 text-emerald-700',
    statusPill: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  },
};

interface StudentSummaryGridProps {
  data: StudentDashboardData;
}

/**
 * Row 1 of the Student / Employee self-service portal: three spacious action cards
 * for reporting maintenance issues, logging lost/found items, and browsing claims.
 */
export function StudentSummaryGrid({ data }: StudentSummaryGridProps) {
  const { t } = useTranslation();

  const activeRequests = ACTIVE_STATUSES.reduce(
    (sum, status) => sum + (data.requests.byStatus[status] ?? 0),
    0,
  );

  const cards: SelfServiceCardSpec[] = [
    {
      key: 'report-maintenance',
      tone: 'navy',
      icon: Wrench,
      statusPill: t('dashboard.studentActiveRequestsCount', {
        count: activeRequests,
      }),
      title: t('dashboard.studentCardMaintenanceTitle'),
      description: t('dashboard.studentCardMaintenanceDesc'),
      ctaLabel: t('dashboard.studentCardMaintenanceCta'),
      ctaIcon: Plus,
      to: '/maintenance/requests/new',
      primaryCta: true,
    },
    {
      key: 'report-lost-found',
      tone: 'gold',
      icon: PackageSearch,
      statusPill: t('dashboard.studentSubmittedReportsCount', {
        count: data.reports.total,
      }),
      title: t('dashboard.studentCardReportTitle'),
      description: t('dashboard.studentCardReportDesc'),
      ctaLabel: t('dashboard.studentCardReportCta'),
      ctaIcon: PackagePlus,
      to: '/lost-found/report',
    },
    {
      key: 'browse-claims',
      tone: 'emerald',
      icon: ShieldCheck,
      statusPill: t('dashboard.studentClaimsCount', {
        count: data.claims.total,
      }),
      title: t('dashboard.studentCardClaimsTitle'),
      description: t('dashboard.studentCardClaimsDesc'),
      ctaLabel: t('dashboard.studentCardClaimsCta'),
      ctaIcon: Search,
      to: '/lost-found',
    },
  ];

  return (
    <section aria-label={t('nav.groupOverview')} className="grid gap-5 lg:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const CtaIcon = card.ctaIcon;
        const style = TONE_STYLES[card.tone];

        return (
          <article
            key={card.key}
            className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 transition-colors hover:border-primary/35"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    style.iconChip,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>

                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold tabular-nums',
                    style.statusPill,
                  )}
                >
                  {card.statusPill}
                </span>
              </div>

              <h2 className="pt-1 text-base font-bold text-foreground">{card.title}</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {card.description}
              </p>
            </div>

            <div className="mt-5 pt-2">
              <Button
                asChild
                variant={card.primaryCta ? 'default' : 'outline'}
                className={cn(
                  'h-10 w-full gap-1.5 rounded-xl text-xs font-bold',
                  card.primaryCta
                    ? 'bg-primary text-primary-foreground hover:bg-[hsl(var(--mnu-navy-hover))] active:bg-[hsl(var(--mnu-navy-active))]'
                    : 'border-border/80 bg-card text-foreground hover:bg-secondary/60',
                )}
              >
                <Link to={card.to}>
                  <CtaIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{card.ctaLabel}</span>
                </Link>
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
