import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, Square } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { cn } from '@/lib/cn'

export function AudioPlayer() {
  const { state, playTrack, pauseTrack, resumeTrack, stopTrack, setVolume, toggleMute } = useAppStore()
  const { currentTrackUrl, isPlaying, volume, isMuted } = state.audio
  const audioRef = useRef<HTMLAudioElement>(null)
  const [inputUrl, setInputUrl] = useState('')

  // Sync audio element with store state
  useEffect(() => {
    if (!audioRef.current) return

    if (currentTrackUrl) {
        if (audioRef.current.src !== currentTrackUrl) {
            audioRef.current.src = currentTrackUrl
        }
        
        if (isPlaying) {
            const r = audioRef.current.play()
            if (r && typeof (r as any).catch === 'function') {
              ;(r as any).catch((err: unknown) => {
                console.error("Audio playback failed:", err)
                if (isPlaying) pauseTrack()
              })
            }
        } else {
            audioRef.current.pause()
        }
    } else {
        audioRef.current.pause()
        audioRef.current.src = ''
    }
  }, [currentTrackUrl, isPlaying, pauseTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  const handlePlayUrl = () => {
    if (inputUrl.trim()) {
      playTrack(inputUrl.trim())
      setInputUrl('')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      playTrack(url)
    }
  }

  return (
    <div className="bg-surface-900/90 backdrop-blur border-t border-white/10 p-4 sticky bottom-0 z-50">
      <audio ref={audioRef} loop onEnded={() => {}} />
      
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-4">
        {/* Track Info / Input */}
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Music size={20} />
          </div>
          
          <div className="flex-1 min-w-0">
            {currentTrackUrl ? (
               <div className="flex flex-col">
                 <span className="text-sm font-medium truncate text-white">
                   {decodeURIComponent(currentTrackUrl.split('/').pop() || 'Faixa de Áudio')}
                 </span>
                 <span className="text-xs text-text-muted">Tocando agora...</span>
               </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Cole uma URL de áudio (mp3/wav)..."
                  className="flex-1 bg-surface-950 border border-white/10 rounded px-3 py-1 text-sm focus:border-brand-500 outline-none"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlayUrl()}
                />
                <label className="cursor-pointer px-3 py-1 bg-surface-800 hover:bg-surface-700 rounded text-sm text-text-muted transition-colors flex items-center">
                  Arquivo
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
           {currentTrackUrl && (
             <button 
               onClick={stopTrack}
               aria-label="Parar"
               className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
               title="Parar"
             >
               <Square size={18} fill="currentColor" />
             </button>
           )}

           <button 
             onClick={() => isPlaying ? pauseTrack() : (currentTrackUrl ? resumeTrack() : handlePlayUrl())}
             disabled={!currentTrackUrl && !inputUrl}
             aria-label={isPlaying ? "Pausar" : "Tocar"}
             aria-disabled={!currentTrackUrl && !inputUrl}
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
               !currentTrackUrl && !inputUrl ? "bg-surface-800 text-text-muted opacity-50 cursor-not-allowed" : "bg-brand-500 hover:bg-brand-400 text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400"
             )}
           >
             {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
           </button>
        </div>

        {/* Volume */}
        <div className="w-full md:w-48 flex items-center gap-2 group">
          <button onClick={toggleMute} aria-label={isMuted || volume === 0 ? "Desmutar" : "Mutar"} aria-pressed={isMuted} className="text-text-muted hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/30">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="flex-1 h-1 bg-surface-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 cursor-pointer focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
