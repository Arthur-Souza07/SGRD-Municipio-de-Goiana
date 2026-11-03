import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, useLocation } from 'react-router-dom';
import SessaoFamilias from './features/mapa/SessaoFamilias';
import PaginaCadastroEquipe from './pages/PaginaCadastroEquipe';
import './App.css';

const VisaoMapa = lazy(() => import('./features/mapa/components/visao-mapa'));

function Paginas() {
  const { pathname } = useLocation();
  if (pathname !== '/' && pathname !== '/cadastro-equipe')
    return <Navigate to="/" replace />;
  // Mantém os rascunhos em memória ao alternar entre mapa e ficha da equipe.
  return (
    <>
      <div hidden={pathname !== '/'}>
        <VisaoMapa />
      </div>
      <div hidden={pathname !== '/cadastro-equipe'}>
        <PaginaCadastroEquipe />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessaoFamilias>
        <Suspense
          fallback={
            <p className="estado-aplicacao" role="status">
              Preparando o mapa de Goiana…
            </p>
          }
        >
          <Paginas />
        </Suspense>
      </SessaoFamilias>
    </BrowserRouter>
  );
}
