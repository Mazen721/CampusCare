import { Link } from 'react-router-dom';

interface PortalViewAllLinkProps {
  to: string;
  label: string;
}

/**
 * Accessible header link for MNU portal ledger cards with a 32px minimum tap target.
 */
export function PortalViewAllLink({ to, label }: PortalViewAllLinkProps) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-8 items-center rounded-md px-1.5 text-xs font-semibold text-primary hover:underline"
    >
      {label}
    </Link>
  );
}
