import { lazy, Suspense, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { BrowserRouter, Navigate, useLocation, Routes, Route, useNavigate } from 'react-router-dom';
import { useDeviceType } from './hooks/useDeviceType';
import { ThemeProvider } from './context/ThemeContext';
import { AgentAuthPage } from './pages/auth/AgentAuthPage';
import { ManagerAuthPage } from './pages/auth/ManagerAuthPage';
import SessaoFamilias from './features/mapa/SessaoFamilias';
import PaginaCadastroEquipe from './pages/PaginaCadastroEquipe';
import './App.css';

const VisaoMapa = lazy(() => import('./features/mapa/components/visao-mapa'));

// Placeholder para futura página de cadastro de pessoas (pós-login agente)
const CadastroPessoas = lazy(() => import('./pages/CadastroPessoas').catch(() => ({
  default: function CadastroPessoasPlaceholder() {
    return (
      <div className="placeholder-page">
        <h1>Cadastro de Pessoas</h1>
        <p>Em desenvolvimento — integração futura com repositório de cadastro social.</p>
      </div>
    );
  }
})));

/**
 * Auth context for sharing login state across components
 */
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Auth route component that selects the appropriate auth page based on device type.
 * Mobile/Tablet → AgentAuthPage (field agents)
 * Desktop → ManagerAuthPage (managers)
 */
function AuthRoute() {
  const deviceType = useDeviceType();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSkipToMap = useCallback(() => {
    login();
    navigate('/');
  }, [login, navigate]);

  const handleSkipToPeople = useCallback(() => {
    login();
    navigate('/cadastro-pessoas');
  }, [login, navigate]);

  // Render appropriate auth page based on device type
  const AuthPage = deviceType === 'desktop' ? ManagerAuthPage : AgentAuthPage;

  return (
    <AuthPage
      onLoginSuccess={login}
      onSkipToMap={handleSkipToMap}
      onSkipToPeopleRegistration={handleSkipToPeople}
    />
  );
}

/**
 * Header component with theme toggle for desktop
 */
function AppHeader() {
  return null;
}

/**
 * Main map pages (protected routes - after login)
 */
function PaginasMapa() {
  const { pathname } = useLocation();

  if (pathname !== '/' && pathname !== '/cadastro-equipe' && pathname !== '/cadastro-pessoas') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <AppHeader />
      <main className="app-main">
        <div hidden={pathname !== '/'}>
          <VisaoMapa />
        </div>
        <div hidden={pathname !== '/cadastro-equipe'}>
          <PaginaCadastroEquipe />
        </div>
        <div hidden={pathname !== '/cadastro-pessoas'}>
          <Suspense fallback={<p className="estado-aplicacao" role="status">Carregando cadastro…</p>}>
            <CadastroPessoas />
          </Suspense>
        </div>
      </main>
    </>
  );
}

/**
 * Main App component with routing
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <SessaoFamilias>
            <Suspense
              fallback={
                <p className="estado-aplicacao" role="status">
                  Preparando o mapa de Goiana…
                </p>
              }
            >
              <Routes>
                {/* Public auth routes - device-dependent */}
                <Route path="/login" element={<AuthRoute />} />
                <Route path="/register" element={<AuthRoute />} />

                {/* Protected routes - require login */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <PaginasMapa />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </SessaoFamilias>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

export default App;