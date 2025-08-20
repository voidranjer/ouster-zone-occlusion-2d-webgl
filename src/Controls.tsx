import { useEffect, useState } from "react";
import { toast } from "sonner"
import { Slider } from "@/components/ui/slider";

import type { AppState, AppMode, ExtendedWindow } from "@/lib/types";
import { resetZone, highlighter, zone } from "@/World3D";
import { Toaster } from "@/components/ui/sonner";

export default function Controls() {
  const [appState, setAppState] = useState<AppState>({
    mode: "normal",
  });
  const [highlightRadius, setHighlightRadius] = useState(1.0);

  useEffect(() => {
    (window as ExtendedWindow).setAppState = setAppState;
  }, []);

  // App Mode
  useEffect(() => {
    (window as ExtendedWindow).appState = appState;

    /* Highlighter */
    highlighter.setVisible(appState.mode.startsWith("highlight"));

    /* Toaster */
    if (appState.mode === "highlight") toast.info("Double click to highlight!")
    else if (appState.mode === "highlight-freeze") toast.success("Highlight point set.");
  }, [appState.mode]);

  // Highlight Radius
  useEffect(() => {
    highlighter.setRadius(highlightRadius);
  }, [highlightRadius]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, appMode: AppMode) {
    e.stopPropagation();
    resetZone();

    setAppState(oldAppState => {
      const mode = oldAppState.mode === appMode ? "normal" : appMode;

      // Append first vertex if entering edit mode
      if (oldAppState.mode !== "edit" && appMode === "edit") {
        zone.addVertex();
      }

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
          {appState.mode === "highlight" ? "Cancel" : "Highlight"}
        </button>

        {
          (appState.mode === "highlight") &&
          <div className="bg-white p-2 w-[200px] content-center border-2 border-black flex flex-row space-x-2">
            <label htmlFor="highlighter-slider" className="text-xs whitespace-nowrap">{`${(highlightRadius * 2).toFixed(1)} m`}</label>
            <Slider id="highlighter-slider" defaultValue={[1]} min={0.1} max={2} step={0.2}
              value={[highlightRadius]}
              onValueChange={values => setHighlightRadius(values[0])}
            />
          </div>
        }

      </div>
    </>
  );
}
