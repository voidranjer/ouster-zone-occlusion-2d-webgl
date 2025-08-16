import { useEffect, useState } from "react";

import type { AppMode } from "@src/lib/types";
import { appState } from "@src/World3D";

export default function Controls() {
  const [appMode, setAppMode] = useState<AppMode>("normal");

  useEffect(() => {
      appState.mode = appMode;
  }, [appMode]);

  return (
    <div className="flex absolute bottom-0 translate-y-1/2 transform self-center space-x-3">
      <button className="bg-blue-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-blue-400">
        Zone
      </button>
      <button
        className="bg-red-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-red-400"
        onClick={() => setAppMode(appMode === "highlight" ? "normal" : "highlight")}
      >
        { appMode === "highlight" ? "Cancel" : "Highlight" }
      </button>
    </div>
  );
}
