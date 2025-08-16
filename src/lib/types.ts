export type AppMode = "normal" | "edit" | "highlight";

export type AppState = {
  mode: AppMode;
};

export type Extrinsics = {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};
