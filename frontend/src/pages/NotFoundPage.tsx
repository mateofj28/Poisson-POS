import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative text-center max-w-lg">
                {/* 404 Number */}
                <div className="relative mb-8">
                    <p className="text-[180px] sm:text-[220px] font-black text-transparent bg-clip-text bg-gradient-to-b from-zinc-700 to-zinc-900 leading-none select-none">
                        404
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-3xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-4xl">🐟</span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Página no encontrada
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
                    La página que buscas no existe, fue movida o no tienes permisos para acceder a ella.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        color="primary"
                        size="lg"
                        className="cursor-pointer font-semibold"
                        onPress={() => navigate('/dashboard')}
                    >
                        ← Volver al Dashboard
                    </Button>
                    <Button
                        variant="flat"
                        size="lg"
                        className="cursor-pointer"
                        onPress={() => navigate(-1)}
                    >
                        Página anterior
                    </Button>
                </div>

                {/* Help text */}
                <p className="text-zinc-600 text-xs mt-10">
                    Si crees que esto es un error, contacta al administrador del sistema.
                </p>
            </div>
        </div>
    );
};

export default NotFoundPage;
