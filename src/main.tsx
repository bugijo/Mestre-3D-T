import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { AppStoreProvider } from '@/store/AppStore'
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary'
import { AdminAccessProvider } from '@/admin/AdminAccessContext'
import { LiveSessionProvider } from '@/realtime/LiveSessionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AdminAccessProvider>
        <AppStoreProvider>
          <LiveSessionProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </LiveSessionProvider>
        </AppStoreProvider>
      </AdminAccessProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
