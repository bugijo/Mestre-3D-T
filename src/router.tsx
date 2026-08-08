import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from '@/App'
import { AppShellFallback } from '@/components/ui/AppShellFallback'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { NotFound } from '@/pages/NotFound'

const Dashboard = lazy(() => import('@/components/Dashboard').then((module) => ({ default: module.Dashboard })))
const Playground = lazy(() => import('@/pages/Playground').then((module) => ({ default: module.Playground })))
const CampaignList = lazy(() => import('@/pages/CampaignList').then((module) => ({ default: module.CampaignList })))
const CampaignForm = lazy(() => import('@/pages/CampaignForm').then((module) => ({ default: module.CampaignForm })))
const CampaignDetails = lazy(() => import('@/pages/CampaignDetails').then((module) => ({ default: module.CampaignDetails })))
const CharacterList = lazy(() => import('@/pages/CharacterList').then((module) => ({ default: module.CharacterList })))
const CharacterForm = lazy(() => import('@/pages/CharacterForm').then((module) => ({ default: module.CharacterForm })))
const SessionRunner = lazy(() => import('@/pages/SessionRunner').then((module) => ({ default: module.SessionRunner })))
const Catalog = lazy(() => import('@/pages/Catalog').then((module) => ({ default: module.Catalog })))
const SessionReports = lazy(() => import('@/pages/SessionReports').then((module) => ({ default: module.SessionReports })))
const PlayerConsole = lazy(() => import('@/pages/PlayerConsole').then((module) => ({ default: module.PlayerConsole })))
const AdminPortal = lazy(() => import('@/pages/AdminPortal').then((module) => ({ default: module.AdminPortal })))
const LivePlayerPage = lazy(() => import('@/pages/LivePlayerPage').then((module) => ({ default: module.LivePlayerPage })))
const MasterStudio = lazy(() => import('@/pages/MasterStudio').then((module) => ({ default: module.MasterStudio })))
const StoryBoard = lazy(() => import('@/pages/StoryBoard').then((module) => ({ default: module.StoryBoard })))

function withFallback(node: ReactNode, label?: string) {
  return <Suspense fallback={<AppShellFallback label={label} />}>{node}</Suspense>
}

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />} errorElement={<RouteErrorPage />}>
      <Route index element={withFallback(<Dashboard />, 'Carregando dashboard...')} />
      <Route path="playground" element={withFallback(<Playground />, 'Carregando playground...')} />
      <Route path="campaigns" element={withFallback(<CampaignList />, 'Carregando campanhas...')} />
      <Route path="campaigns/new" element={withFallback(<CampaignForm />, 'Carregando formulario...')} />
      <Route path="campaigns/:id" element={withFallback(<CampaignDetails />, 'Carregando campanha...')} />
      <Route path="campaigns/:id/edit" element={withFallback(<CampaignForm />, 'Carregando formulario...')} />
      <Route path="characters" element={withFallback(<CharacterList />, 'Carregando personagens...')} />
      <Route path="characters/new" element={withFallback(<CharacterForm />, 'Carregando personagem...')} />
      <Route path="characters/:id" element={withFallback(<CharacterForm />, 'Carregando personagem...')} />
      <Route path="catalog" element={withFallback(<Catalog />, 'Carregando catalogo...')} />
      <Route path="studio" element={withFallback(<MasterStudio />, 'Carregando Estúdio do Mestre...')} />
      <Route path="story" element={withFallback(<StoryBoard />, 'Carregando quadro narrativo...')} />
      <Route path="session" element={withFallback(<SessionRunner />, 'Carregando sessao...')} />
      <Route path="reports" element={withFallback(<SessionReports />, 'Carregando relatorios...')} />
      <Route path="admin" element={withFallback(<AdminPortal />, 'Carregando painel administrativo...')} />
      <Route path="player" element={withFallback(<PlayerConsole />, 'Carregando console do jogador...')} />
      <Route path="player/:characterId" element={withFallback(<PlayerConsole />, 'Carregando console do jogador...')} />
      <Route path="join/:code" element={withFallback(<LivePlayerPage />, 'Conectando à mesa...')} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
  {
    basename: import.meta.env.BASE_URL,
  },
)
