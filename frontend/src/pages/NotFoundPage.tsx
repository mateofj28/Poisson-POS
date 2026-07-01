import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <div className="text-center max-w-md">
                <p className="text-8xl font-bold text-zinc-800 mb-4">404</p>
                <h1 className="text-2xl font-bold text-white mb-2">Página no encontrada</h1>
                <p className="text-sm text-zinc-500 mb-8">La página que buscas no existe o fue movida.</p>
                <Button color="primary" size="lg" className="cursor-pointer" onPress={() => navigate('/dashboard')}>
                    Volver al inicio
                </Button>
            </div>
        </div>
    );
};

export default NotFoundPage;
