export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl p-4 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <div className="h-8 w-48 bg-gray-200 rounded mt-2" />
        </div>
        <div className="text-right">
          <div className="h-4 w-24 bg-gray-200 rounded ml-auto" />
          <div className="h-8 w-28 bg-gray-200 rounded mt-2 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200 h-48" />
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200 h-48" />
      </div>
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-200 h-64" />
    </div>
  );
}
