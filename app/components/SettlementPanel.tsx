import { Settlement } from '@/lib/types';

export default function SettlementPanel({
  settlements,
}: {
  settlements: Settlement[];
}) {
  if (settlements.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="text-green-700 font-medium">Todo liquidado</p>
        <p className="text-green-600 text-sm mt-1">No hay deudas pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {settlements.map((s, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-3"
        >
          <div className="text-sm">
            <span className="font-semibold text-orange-800">{s.from}</span>
            <span className="text-orange-600 mx-2">debe pagar a</span>
            <span className="font-semibold text-orange-800">{s.to}</span>
          </div>
          <span className="font-bold text-orange-900">
            {s.amount.toFixed(2)} &euro;
          </span>
        </div>
      ))}
    </div>
  );
}
