import { useEffect, useRef } from "react";

import { resize } from './eventHandlers.ts';

type Props = {
  setGl: React.Dispatch<React.SetStateAction<WebGL2RenderingContext | null>>;
}

export default function Image2D({ setGl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleResize() {
    const canvas = canvasRef.current!;
    const gl = canvas.getContext('webgl2')!;
    resize(gl, canvas);
  }

  useEffect(() => {
    const canvas = canvasRef.current!;

    setGl(canvas.getContext('webgl2')!);

    handleResize(); // Initial resize to set canvas size
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="block w-full h-[150px] border-b-2 border-white">
    </canvas>
  )
}
