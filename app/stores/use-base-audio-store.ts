import { create } from "zustand"

interface BaseAudioStore {
  playingId: string | null
  play: (id: string) => void
  pause: () => void
  toggle: (id: string) => void
  cleanup: () => void
}

export const useBaseAudioStore = create<BaseAudioStore>((set) => ({
  playingId: null,
  play: (id) => set({ playingId: id }),
  pause: () => set({ playingId: null }),
  toggle: (id) =>
    set((state) => ({ playingId: state.playingId === id ? null : id })),
  cleanup: () => set({ playingId: null })
}))
