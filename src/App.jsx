import { lazy, Suspense, useRef } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from "framer-motion";
import { getNavDirection } from "@/lib/tabStack";
import TabStackSync from "@/components/TabStackSync";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/AppLayout';
import ThemeSync from '@/components/ThemeSync';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';

// Heavy screens are lazy-loaded so the native shell boots fast and each screen bundles separately.
const PreOpChecklist = lazy(() => import('@/pages/PreOpChecklist'));
const Home = lazy(() => import('@/pages/Home'));
const NavigationScreen = lazy(() => import('@/pages/Navigation'));
const StopDetail = lazy(() => import('@/pages/StopDetail'));
const ConfirmDelivery = lazy(() => import('@/pages/ConfirmDelivery'));
const RegisterInsucesso = lazy(() => import('@/pages/RegisterInsucesso'));
const RouteCompletion = lazy(() => import('@/pages/RouteCompletion'));
const TurnClosing = lazy(() => import('@/pages/TurnClosing'));
const RouteHistory = lazy(() => import('@/pages/RouteHistory'));
const RouteDetail = lazy(() => import('@/pages/RouteDetail'));
const Receipts = lazy(() => import('@/pages/Receipts'));
const ReceiptDetail = lazy(() => import('@/pages/ReceiptDetail'));
const Profile = lazy(() => import('@/pages/Profile'));
const ProfileEdit = lazy(() => import('@/pages/ProfileEdit'));
const OfflineMaps = lazy(() => import('@/pages/OfflineMaps'));
const Support = lazy(() => import('@/pages/Support'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Analysis = lazy(() => import('@/pages/Analysis'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

// Transição estilo iOS: "push" entra da direita, "pop" sai para a direita
// revelando a tela de baixo, "tab" faz fade entre abas.
const screenVariants = {
  enter: (d) => ({
    x: d === "pop" ? "-32%" : d === "tab" ? 0 : "100%",
    opacity: d === "tab" ? 0 : 1,
    zIndex: d === "push" ? 2 : 0,
  }),
  center: { x: 0, opacity: 1, zIndex: 0 },
  exit: (d) => ({
    x: d === "pop" ? "100%" : d === "tab" ? 0 : "-32%",
    opacity: d === "tab" ? 0 : 1,
    zIndex: d === "pop" ? 2 : 0,
  }),
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const prevPath = useRef(null);
  const direction = getNavDirection(prevPath.current, location.pathname);
  prevPath.current = location.pathname;

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <ThemeSync />
      <TabStackSync />
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={location.pathname}
          custom={direction}
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="min-h-screen"
        >
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/checklist" element={<PreOpChecklist />} />
          <Route path="/navigation" element={<NavigationScreen />} />
          <Route path="/stop/:id" element={<StopDetail />} />
          <Route path="/stop/:id/navigate" element={<NavigationScreen />} />
          <Route path="/stop/:id/confirm" element={<ConfirmDelivery />} />
          <Route path="/stop/:id/failure" element={<RegisterInsucesso />} />
          <Route path="/stop/:id/insucesso" element={<RegisterInsucesso />} />
          <Route path="/route-complete" element={<RouteCompletion />} />
          <Route path="/turn-closing" element={<TurnClosing />} />
          <Route path="/history/:id" element={<RouteDetail />} />
          <Route path="/receipts/:id" element={<ReceiptDetail />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/profile/offline-maps" element={<OfflineMaps />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<RouteHistory />} />
            <Route path="/receipts" element={<Receipts />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/analysis" element={<Analysis />} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App