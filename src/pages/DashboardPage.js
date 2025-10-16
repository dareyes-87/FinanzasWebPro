import React from 'react';

const DashboardPage = () => {
    return (
        <div>
            <div className="header">
                <h2>Resumen Financiero</h2>
            </div>
            <div className="card">
                <p>Aquí se mostrarán los ingresos, gastos y el balance. [cite: 193]</p>
            </div>
            <div className="card">
                <h3>Transacciones Recientes</h3>
                <p>Aquí irá la lista de transacciones recientes.</p>
            </div>
        </div>
    );
};

export default DashboardPage;