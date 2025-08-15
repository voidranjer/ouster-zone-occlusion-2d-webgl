export default function Controls() {
  return (
    <div className="flex absolute bottom-0 translate-y-1/2 transform self-center space-x-3">
      <button className="bg-blue-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-blue-400">Zone</button>
      <button className="bg-red-500 px-3 rounded-lg border-2 border-white cursor-pointer hover:bg-red-400">Highlight</button>
    </div>
  )
}
