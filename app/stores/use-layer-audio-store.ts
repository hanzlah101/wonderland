import { create } from "zustand"

interface LayerAudioStore {
  playingId: string | null
  play: (id: string) => void
  pause: () => void
  toggle: (id: string) => void
  cleanup: () => void
}

export const useLayerAudioStore = create<LayerAudioStore>((set) => ({
  playingId: null,
  play: (id) => set({ playingId: id }),
  pause: () => set({ playingId: null }),
  toggle: (id) =>
    set((state) => ({ playingId: state.playingId === id ? null : id })),
  cleanup: () => set({ playingId: null })
}))
