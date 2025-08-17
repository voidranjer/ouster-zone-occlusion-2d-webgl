export type AppMode = "normal" | "edit" | "highlight" | "highlight-freeze";

export type AppState = {
  mode: AppMode;
};

export type Extrinsics = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

export type ExtendedWindow = typeof window & {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
};
