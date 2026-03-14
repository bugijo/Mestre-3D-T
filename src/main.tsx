import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { AppStoreProvider } from '@/store/AppStore'
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary'
import { AdminAccessProvider } from '@/admin/AdminAccessContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AdminAccessProvider>
        <AppStoreProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AppStoreProvider>
      </AdminAccessProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
)
