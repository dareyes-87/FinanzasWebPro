import React from 'react';
import { useLocation } from 'react-router-dom';
import SaldoReport from './estadisticas/SaldoReport'; // <-- 1. Importa el nuevo reporte
import './estadisticas/Estadisticas.css'; // <-- 2. Importa el nuevo CSS

const EstadisticasPage = () => {
    const location = useLocation();
    
    // Obtiene el nombre de la sub-página, ej: "saldo"
    const subPagina = location.pathname.split('/')[2] || 'general';

    // 3. Renderiza el componente de reporte apropiado
    const renderReport = () => {
        switch (subPagina) {
            case 'saldo':
                return <SaldoReport />;
            case 'panorama':
            case 'flujo':
            case 'gasto':
            // ... etc.
            default:
                return (
                    <div className="stats-card">
                        <p>¡Página de "{subPagina}" en construcción!</p>
                        <p>Selecciona un reporte del menú lateral.</p>
                    </div>
                );
        }
    };

    return (
        <div className="stats-page-container">
            <div className="header">
                <h2>Estadísticas: {subPagina.charAt(0).toUpperCase() + subPagina.slice(1)}</h2>
            </div>
            {renderReport()}
        </div>
    );
};

export default EstadisticasPage;