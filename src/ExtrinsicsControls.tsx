import { useEffect, useState } from 'react';

import { updateExtrinsics } from '@src/World3D';

export default function ExtrinsicsControls() {
    const [extrinsics, _] = useState({
    translation: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: -2.5, z: -4.5 },
  });

  useEffect(() => {
    updateExtrinsics(extrinsics);
  }, [extrinsics])

  return <>
    <div
      id="extrinsics-panel"
      className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-lg w-40 z-10 pointer-events-none opacity-50 max-h-[80vh] overflow-y-auto"
    >
      <h3 className="text-lg font-bold mb-4 text-center">Extrinsics</h3>

      <div className="space-y-4">
        <div className="border-b border-gray-600 pb-3">
          <h4 className="text-sm font-semibold mb-2">Translation</h4>

          <div className="mb-2">
            <label htmlFor="tx-input" className="block text-xs mb-1">X:</label>
            <input
              type="number"
              id="tx-input"
              min="-50"
              max="50"
              value="0"
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="ty-input" className="block text-xs mb-1">Y:</label>
            <input
              type="number"
              id="ty-input"
              min="-50"
              max="50"
              value="1"
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="tz-input" className="block text-xs mb-1">Z:</label>
            <input
              type="number"
              id="tz-input"
              min="-50"
              max="50"
              value="0"
              step="0.1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-2">Rotation (degrees)</h4>

          <div className="mb-2">
            <label htmlFor="rx-input" className="block text-xs mb-1">X:</label>
            <input
              type="number"
              id="rx-input"
              min="-180"
              max="180"
              value="0"
              step="1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="ry-input" className="block text-xs mb-1">Y:</label>
            <input
              type="number"
              id="ry-input"
              min="-180"
              max="180"
              value="-2.5"
              step="1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="rz-input" className="block text-xs mb-1">Z:</label>
            <input
              type="number"
              id="rz-input"
              min="-180"
              max="180"
              value="-4.5"
              step="1"
              className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>

        <button
          id="reset-extrinsics"
          className="w-full bg-gray-600 hover:bg-gray-500 px-3 py-2 rounded text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  </>
}
