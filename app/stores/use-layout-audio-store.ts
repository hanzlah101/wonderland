import { create } from "zustand"

interface LayoutAudioStore {
  playingId: string | null
  play: (id: string) => void
  pause: () => void
  toggle: (id: string) => void
  cleanup: () => void
}

export const useLayoutAudioStore = create<LayoutAudioStore>((set) => ({
  playingId: null,
  play: (id) => set({ playingId: id }),
  pause: () => set({ playingId: null }),
  toggle: (id) =>
    set((state) => ({ playingId: state.playingId === id ? null : id })),
  cleanup: () => set({ playingId: null })
}))
