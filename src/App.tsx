import Controls from "./Controls";
import Image2D from "./Image2D";
import World3D from "./World3D";

export default function App() {

  return (
    <>
      <div className="relative flex flex-col">
        <Image2D />
        <Controls />
      </div>

      <World3D />
    </>
  )
}

