import Controls from "./Controls";
import ExtrinsicsControls from "./ExtrinsicsControls";

export default function App() {
  return (
    <>
      <div className="relative flex flex-col">
        {/* <Image2D setGl={setGl} /> */}
        <Controls />
      </div>
      <ExtrinsicsControls />
    </>
  );
}
