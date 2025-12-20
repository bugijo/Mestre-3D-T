import { useState } from 'react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Dashboard } from '@/components/Dashboard'

export function Playground() {
  const [cover, setCover] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col gap-8">
      <h1 className="text-4xl font-rajdhani font-bold text-neon-cyan mb-8">
        Playground de Componentes
      </h1>

      <section className="bg-surface/50 p-6 rounded-xl border border-white/10 backdrop-blur-sm">
        <h2 className="text-2xl font-rajdhani text-neon-purple mb-4">Teste de Upload de Imagens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl mb-4 text-white">Capa de Campanha (Max 5MB)</h3>
            <ImageUpload 
              label="Capa da Campanha" 
              currentImage={cover}
              onImageSelected={setCover}
              className="w-full"
            />
            <div className="mt-4">
              <p className="text-sm text-gray-400">Data URL Length: {cover.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl mb-4 text-white">Avatar (Comprimido 50%)</h3>
            <ImageUpload 
              label="Avatar do Personagem" 
              currentImage={avatar}
              onImageSelected={setAvatar}
              config={{ compressionQuality: 0.5, maxSizeInBytes: 1024 * 1024 }}
              className="w-48"
            />
            <div className="mt-4">
              <p className="text-sm text-gray-400">Data URL Length: {avatar.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-rajdhani text-neon-green mb-4">Preview do Dashboard</h2>
        <div className="border border-white/10 rounded-xl overflow-hidden h-[600px] relative">
            <Dashboard />
        </div>
      </section>
    </div>
  )
}
