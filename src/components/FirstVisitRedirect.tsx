import { useEffect, type PropsWithChildren } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const VISITED_KEY = 'geodaily_has_visited';

export function FirstVisitRedirect({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isPublicRoute =
      location.pathname === '/welcome' ||
      location.pathname.startsWith('/quiz');

    if (isPublicRoute) return;

    if (!localStorage.getItem(VISITED_KEY)) {
      navigate('/welcome', { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

export function markAppVisited(): void {
  localStorage.setItem(VISITED_KEY, '1');
}
