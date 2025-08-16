import { useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

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
        <TransformWrapper
          limitToBounds={true}
          centerOnInit={true}
          minScale={1}
          maxScale={3}
        >
          <TransformComponent 
            wrapperClass="border-b-2 border-white overflow-hidden" 
            wrapperStyle={{ height: "250px", width: "100vw" }}
            contentClass="flex justify-center"
          >
            <canvas
              id="image2d-canvas"
              className="block"
              width={2000} /* height x 8 */
              height={250}
            ></canvas>
          </TransformComponent>
        </TransformWrapper>
        <Controls />
      </div>
      <ExtrinsicsControls />
    </>
  );
}
