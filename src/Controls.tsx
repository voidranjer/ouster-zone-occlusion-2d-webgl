import { useEffect, useState } from "react";
import { toast } from "sonner"

import type { AppState, AppMode, ExtendedWindow } from "@/lib/types";
import { resetZone, highlighter } from "@/World3D";
import { Toaster } from "@/components/ui/sonner";

export default function Controls() {
  const [appState, setAppState] = useState<AppState>({ mode: "normal" });

  useEffect(() => {
    (window as ExtendedWindow).setAppState = setAppState;
  }, []);

  useEffect(() => {
    (window as ExtendedWindow).appState = appState;
    highlighter.setVisible(appState.mode.startsWith("highlight"));

    /* Toaster */
    if (appState.mode === "highlight") toast.info("Double click to highlight!")
    else if (appState.mode === "highlight-freeze") toast.success("Highlight point set.");
  }, [appState]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, appMode: AppMode) {
    e.stopPropagation();
    resetZone();
    setAppState(oldAppState => {
      const mode = oldAppState.mode.startsWith(appMode) ? "normal" : appMode;
      return { ...oldAppState, mode };
    });
  }

  return (
    <>
      <Toaster position="bottom-center" richColors />
      <div className="flex absolute bottom-0 translate-y-1/2 transform self-center space-x-3">
        <button
          className="bg-blue-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-blue-400"
          onClick={(e) => handleClick(e, "edit")}
        >
          {appState.mode === "edit" ? "Cancel" : "Zone"}
        </button>
        <button
          className="bg-red-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-red-400"
          onClick={(e) => handleClick(e, "highlight")}
        >
          {appState.mode.startsWith("highlight") ? "Cancel" : "Highlight"}
        </button>
      </div>
    </>
  );
}
