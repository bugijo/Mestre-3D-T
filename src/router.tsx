import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom'
import App from '@/App'
import { Dashboard } from '@/components/Dashboard'
import { Playground } from '@/pages/Playground'
import { CampaignList } from '@/pages/CampaignList'
import { CampaignForm } from '@/pages/CampaignForm'
import { CampaignDetails } from '@/pages/CampaignDetails'
import { CharacterList } from '@/pages/CharacterList'
import { CharacterForm } from '@/pages/CharacterForm'
import { SessionRunner } from '@/pages/SessionRunner'
import { Catalog } from '@/pages/Catalog'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Dashboard />} />
      <Route path="playground" element={<Playground />} />
      <Route path="campaigns" element={<CampaignList />} />
      <Route path="campaigns/new" element={<CampaignForm />} />
      <Route path="campaigns/:id" element={<CampaignDetails />} />
      <Route path="campaigns/:id/edit" element={<CampaignForm />} />
      <Route path="characters" element={<CharacterList />} />
      <Route path="characters/new" element={<CharacterForm />} />
      <Route path="characters/:id" element={<CharacterForm />} />
      <Route path="catalog" element={<Catalog />} />
      <Route path="session" element={<SessionRunner />} />
    </Route>
  )
)
