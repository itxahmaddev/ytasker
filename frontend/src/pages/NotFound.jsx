import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function NotFound() {
  return (
    <main className="page-loading" id="main">
      <EmptyState
        icon={Compass}
        title="Page not found"
        action={<Link to="/" className="btn btn--primary">Back to Ytasker</Link>}
      >
        The page you’re looking for doesn’t exist or has moved.
      </EmptyState>
    </main>
  );
}
