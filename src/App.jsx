import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { GenerationProgressProvider } from './contexts/GenerationProgressContext'
import { HowToGuideProvider } from './contexts/HowToGuideContext'
import { ToastProvider } from './components/ui/toast'
import FloatingProgressWindow from './components/ui/FloatingProgressWindow'
import { queryClient } from './lib/queryClient'

// Pages
import Dashboard from './pages/Dashboard'
import ArticleEditor from './pages/ArticleEditor'
import ContentIdeas from './pages/ContentIdeas'
import ContentLibrary from './pages/ContentLibrary'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ReviewQueue from './pages/ReviewQueue'
import ArticleReview from './pages/ArticleReview'
import SiteCatalog from './pages/SiteCatalog'
import CatalogArticleDetail from './pages/CatalogArticleDetail'
import Keywords from './pages/Keywords'
import Automation from './pages/Automation'
import Integrations from './pages/Integrations'
import Contributors from './pages/Contributors'
import ContributorDetail from './pages/ContributorDetail'
import AITraining from './pages/AITraining'
import SecretJosh from './pages/SecretJosh'
import BatchProgress from './pages/BatchProgress'
import ReleaseHistory from './pages/ReleaseHistory'
import DevFeedbackQueue from './pages/DevFeedbackQueue'

// Layout
import MainLayout from './components/layout/MainLayout'

// Wrapper component to force Dashboard remount on navigation
// Fixes B-05: Dashboard navigation bug where clicking Dashboard link doesn't navigate properly
function DashboardWithKey() {
  const location = useLocation()
  // Use location.key to force remount when navigating to the Dashboard
  return <Dashboard key={location.key} />
}

// Wrapper component to force ArticleEditor remount on navigation
// Fixes navigation bug where navigating away from editor doesn't unmount the component
function ArticleEditorWithKey() {
  const location = useLocation()
  // Use location.key to force remount when navigating to/from the editor
  return <ArticleEditor key={location.key} />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GenerationProgressProvider>
        <HowToGuideProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/secret/josh" element={<SecretJosh />} />

                {/* Batch Progress - Standalone page for new tab/window */}
                <Route path="/batch-progress" element={<BatchProgress />} />

                {/* Main App Routes - No Auth Required */}
                <Route path="/" element={<MainLayout />}>
                  {/* Key prop forces Dashboard remount when navigating to it */}
                  <Route index element={<DashboardWithKey />} />
                  <Route path="ideas" element={<ContentIdeas />} />
                  <Route path="editor/:articleId" element={<ArticleEditorWithKey />} />
                  <Route path="editor" element={<ArticleEditorWithKey />} />
                  <Route path="library" element={<ContentLibrary />} />
                  <Route path="review" element={<ReviewQueue />} />
                  <Route path="review/:articleId" element={<ArticleReview />} />
                  <Route path="catalog" element={<SiteCatalog />} />
                  <Route path="catalog/:articleId" element={<CatalogArticleDetail />} />
                  <Route path="keywords" element={<Keywords />} />
                  <Route path="automation" element={<Automation />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="contributors" element={<Contributors />} />
                  <Route path="contributors/:contributorId" element={<ContributorDetail />} />
                  <Route path="ai-training" element={<AITraining />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="releases" element={<ReleaseHistory />} />
                  <Route path="dev-feedback" element={<DevFeedbackQueue />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            {/* Global Floating Progress Window - persists across page navigation */}
            <FloatingProgressWindow />
            </BrowserRouter>
          </ToastProvider>
        </HowToGuideProvider>
      </GenerationProgressProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
