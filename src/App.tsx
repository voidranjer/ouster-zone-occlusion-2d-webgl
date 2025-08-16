import { useEffect } from "react";
import Controls from "./Controls";
import ExtrinsicsControls from "./ExtrinsicsControls";
import { start } from "@src/Image2D";

export default function App() {
  useEffect(() => {
    start();
  }, []);

  return (
    <>
      <div className="relative flex flex-col">
        <canvas id="image2d-canvas" className="block w-full h-[150px] border-b-2 border-white"></canvas>
        <Controls />
      </div>
      <ExtrinsicsControls />
    </>
  );
}
