import { PortalLedgerCard, type PortalLedgerCardProps } from '@/features/dashboard/PortalLedgerCard';

export type StudentLedgerCardProps = PortalLedgerCardProps;

/**
 * Single-elevation status ledger card shared across the 2x2 student dashboard grid.
 */
export function StudentLedgerCard(props: StudentLedgerCardProps) {
  return <PortalLedgerCard {...props} />;
}
