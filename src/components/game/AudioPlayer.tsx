import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Music, Repeat2, Square } from 'lucide-react'
import { useAppStore } from '@/store/AppStore'
import { cn } from '@/lib/cn'
import { logError } from '@/lib/logger'

export function AudioPlayer() {
  const { state, playTrack, pauseTrack, resumeTrack, stopTrack, setVolume, toggleMute, toggleLoop } = useAppStore()
  const { currentTrackUrl, isPlaying, volume, isMuted } = state.audio
  const loop = state.audio.loop ?? true
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
                logError('audio:playback', err, { currentTrackUrl })
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
    <div className="sticky bottom-0 z-50 border-t border-white/10 bg-[#121111]/95 p-4 backdrop-blur">
      <audio ref={audioRef} loop={loop} onEnded={() => { if (!loop) stopTrack() }} />
      
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-4">
        {/* Track Info / Input */}
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#a65c61]/20 text-[#d39a9e]">
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
                  className="flex-1 rounded border border-white/10 bg-black/40 px-3 py-1 text-sm outline-none focus:border-[#a65c61]"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlayUrl()}
                />
                <label className="flex cursor-pointer items-center rounded bg-white/10 px-3 py-1 text-sm text-text-muted transition-colors hover:bg-white/15">
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
             type="button"
             onClick={toggleLoop}
             aria-label={loop ? 'Desativar repetição' : 'Ativar repetição'}
             aria-pressed={loop}
             className={cn('rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30', loop ? 'bg-[#a65c61]/20 text-[#e2b3b6]' : 'text-text-muted hover:bg-white/5')}
             title="Repetir faixa"
           >
             <Repeat2 size={18} />
           </button>

           <button 
             onClick={() => isPlaying ? pauseTrack() : (currentTrackUrl ? resumeTrack() : handlePlayUrl())}
             disabled={!currentTrackUrl && !inputUrl}
             aria-label={isPlaying ? "Pausar" : "Tocar"}
             aria-disabled={!currentTrackUrl && !inputUrl}
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg",
               !currentTrackUrl && !inputUrl ? "bg-white/10 text-text-muted opacity-50 cursor-not-allowed" : "bg-[#a65c61] hover:bg-[#b66c71] text-white hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#d39a9e]"
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
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 focus:outline-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b86b70]"
          />
        </div>
      </div>
    </div>
  )
}
