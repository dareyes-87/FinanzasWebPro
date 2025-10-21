import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell, // Importante para colores y 'onClick'
    Tooltip,
    Legend
} from 'recharts';

import GastoPorNaturalezaReport from './GastoPorNaturalezaReport';

// Componente reutilizable para los filtros de período
// (Podrías moverlo a un archivo separado, ej: components/PeriodFilterBar.js)
const PeriodFilterBar = ({ period, setPeriod }) => (
    <div className="period-filter-bar">
        <button onClick={() => setPeriod('7d')} className={period === '7d' ? 'active' : ''}>7 Días</button>
        <button onClick={() => setPeriod('30d')} className={period === '30d' ? 'active' : ''}>30 Días</button>
        <button onClick={() => setPeriod('6m')} className={period === '6m' ? 'active' : ''}>6 Meses</button>
        <button onClick={() => setPeriod('1a')} className={period === '1a' ? 'active' : ''}>1 Año</button>
        <button onClick={() => setPeriod('all')} className={period === 'all' ? 'active' : ''}>Todo</button>
    </div>
);

// Formateador de moneda
const formatCurrency = (value) => `Q${value.toFixed(2)}`;

// --- COMPONENTE DEL REPORTE GASTO ---
const GastoReport = () => {
    const { transactions, categories, loading } = useData();
    const [period, setPeriod] = useState('30d'); // Default a 30 días
    
    // Estado para la categoría seleccionada en el gráfico
    const [selectedCategory, setSelectedCategory] = useState(null); // ej: 'Comida y Bebida'

    const { kpiTotal, pieData, transactionList } = useMemo(() => {
        const today = startOfDay(new Date());
        let startDate;

        switch (period) {
            case '7d': startDate = subDays(today, 6); break;
            case '30d': startDate = subDays(today, 29); break;
            case '6m': startDate = subMonths(today, 6); break;
            case '1a': startDate = subYears(today, 1); break;
            default: startDate = new Date(0);
        }

        if (!transactions || transactions.length === 0) {
            return { kpiTotal: 0, pieData: [], transactionList: [] };
        }

        // 1. Filtrar solo GASTOS y por PERÍODO
        const gastos = transactions.filter(tx => {
            const txDate = parseISO(tx.date);
            return tx.type === 'Gasto' && txDate >= startDate && txDate <= today;
        });

        // 2. Calcular KPI Total
        const kpiTotal = gastos.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        // 3. Agrupar para el Gráfico de Pastel
        const grouped = gastos.reduce((acc, tx) => {
            const category = categories.find(c => c.id === tx.category_id);
            const catName = category?.name || 'Sin Categoría';
            const catColor = category?.color || '#8884d8'; // Un color por defecto

            if (!acc[catName]) {
                acc[catName] = { name: catName, value: 0, color: catColor };
            }
            acc[catName].value += parseFloat(tx.amount);
            return acc;
        }, {});

        // Convertir a array y ordenar de mayor a menor
        const pieData = Object.values(grouped).sort((a, b) => b.value - a.value);

        // 4. Preparar la Lista de Transacciones (filtrada o no)
        let filteredGastos = gastos;
        
        if (selectedCategory) {
            // Si hay una categoría seleccionada, filtramos las transacciones
            filteredGastos = gastos.filter(tx => {
                const category = categories.find(c => c.id === tx.category_id);
                const catName = category?.name || 'Sin Categoría';
                return catName === selectedCategory;
            });
        }
        
        // Ordenar por fecha (más recientes primero) y tomar ej. los 20 principales
        const transactionList = filteredGastos
            .sort((a, b) => parseISO(b.date) - parseISO(a.date))
            .slice(0, 20); // Limitar la lista

        return { kpiTotal, pieData, transactionList };

    }, [transactions, categories, period, selectedCategory]); // Recalcula si cambia el período O la categoría seleccionada

    if (loading) {
        return <div className="stats-card"><p>Calculando gastos...</p></div>;
    }
    
    // Función para manejar el clic en el gráfico
    const handlePieClick = (data) => {
        // Si vuelve a presionar la misma, la deselecciona
        setSelectedCategory(prev => prev === data.name ? null : data.name);
    };

    return (
        <>
            <PeriodFilterBar period={period} setPeriod={setPeriod} />

            {/* --- Tarjeta KPI Total Gasto --- */}
            <div className="stats-card kpi-card" style={{ justifyContent: 'center' }}>
                <div className="kpi-item net-flow">
                    <span className="kpi-label">Gasto Total ({period})</span>
                    <span className="kpi-value expense">
                        {formatCurrency(kpiTotal)}
                    </span>
                </div>
                {/* Aquí podrías añadir el KPI de "+11% vs período anterior" */}
            </div>

            {/* --- Tarjeta Gráfico de Pastel --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Desglose por Categoría</h4>
                    <p>{selectedCategory ? `Mostrando: ${selectedCategory}` : 'Haz clic en una sección para filtrar'}</p>
                </div>
                {pieData.length === 0 ? (
                    <p>No hay gastos en este período.</p>
                ) : (
                    <div className="chart-wrapper" style={{ height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80} // Esto lo hace un Gráfico de Dona
                                    outerRadius={130}
                                    fill="#8884d8"
                                    paddingAngle={2}
                                    dataKey="value"
                                    onClick={handlePieClick}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.color}
                                            // Aumenta la opacidad si está seleccionada
                                            opacity={!selectedCategory || selectedCategory === entry.name ? 1.0 : 0.3}
                                            style={{ cursor: 'pointer', outline: 'none' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip formatter={formatCurrency} />
                                <Legend 
                                    layout="horizontal" 
                                    verticalAlign="bottom" 
                                    align="center" 
                                    wrapperStyle={{ fontSize: '12px', overflow: 'auto', maxHeight: '50px' }}
                                />
                                
                                {/* Texto en el centro del gráfico */}
                                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize="16px" fill="var(--text-muted)">
                                    {selectedCategory ? selectedCategory : 'Todos'}
                                </text>
                                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontSize="20px" fontWeight="bold" fill="var(--text-light)">
                                    {formatCurrency(selectedCategory ? pieData.find(d => d.name === selectedCategory)?.value || 0 : kpiTotal)}
                                </text>

                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
            
            {/* --- Tarjeta Lista de Gastos Principales --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Principales Gastos</h4>
                    <p>
                        {selectedCategory 
                            ? `Transacciones de "${selectedCategory}"` 
                            : 'Últimos gastos registrados'}
                    </p>
                </div>
                <div className="transaction-list-report">
                    {transactionList.length === 0 ? (
                        <p>No hay transacciones para mostrar.</p>
                    ) : (
                        transactionList.map(tx => {
                            const category = categories.find(c => c.id === tx.category_id);
                            const catName = category?.name || 'Sin Categoría';
                            const catColor = category?.color || '#8884d8';
                            
                            return (
                                <div key={tx.id} className="transaction-item-report">
                                    <div className="transaction-icon" style={{ backgroundColor: catColor, opacity: 0.2, border: `2px solid ${catColor}` }}>
                                        {/* Aquí iría un ícono si lo tuvieras */}
                                        <span style={{ color: catColor, fontSize: '18px', fontWeight: 'bold' }}>{catName.charAt(0)}</span>
                                    </div>
                                    <div className="transaction-details">
                                        <span>{tx.note || catName}</span>
                                        <span className="transaction-date">
                                            {format(parseISO(tx.date), 'd MMMM yyyy', { locale: es })}
                                        </span>
                                    </div>
                                    <span className="transaction-amount expense">
                                        -{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            <GastoPorNaturalezaReport period={period} />
        </>
    );
};

export default GastoReport;