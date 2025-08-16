import { useEffect, useState } from "react";

import type { AppMode } from "@src/lib/types";
import { appState, resetZone, highlighter } from "@src/World3D";

export default function Controls() {
  const [appMode, setAppMode] = useState<AppMode>("normal");

  useEffect(() => {
    appState.mode = appMode;
    highlighter.setVisible(appMode === "highlight");
  }, [appMode]);

  return (
    <div className="flex absolute bottom-0 translate-y-1/2 transform self-center space-x-3">
      <button
        className="bg-blue-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-blue-400"
        onClick={(e) => {
          e.stopPropagation();
          resetZone();
          setAppMode(appMode === "edit" ? "normal" : "edit");
        }}
      >
        {appMode === "edit" ? "Cancel" : "Zone"}
      </button>
      <button
        className="bg-red-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-red-400"
        onClick={(e) => {
          e.stopPropagation();
          resetZone();
          setAppMode(appMode === "highlight" ? "normal" : "highlight");
        }}
      >
        {appMode === "highlight" ? "Cancel" : "Highlight"}
      </button>
    </div>
  );
}
