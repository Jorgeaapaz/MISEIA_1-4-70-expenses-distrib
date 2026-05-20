import CreateGroupForm from '@/app/components/CreateGroupForm';
import NavigateToGroup from '@/app/components/NavigateToGroup';

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Reparto de Gastos</h1>
          <p className="mt-2 text-gray-600">
            Comparte gastos con tus amigos de forma sencilla
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Crear nuevo grupo
            </h2>
            <CreateGroupForm />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Acceder a un grupo existente
            </h2>
            <NavigateToGroup />
          </div>
        </div>
      </div>
    </div>
  );
}
