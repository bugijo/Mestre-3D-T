import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/ui/NavBar'

export default function App() {
  return (
    <div className="min-h-screen bg-background font-inter text-foreground">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
