import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { parseISO, subDays, subMonths, subYears, startOfDay, differenceInDays } from 'date-fns';
//import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown} from 'lucide-react'; // Importamos iconos

// --- Componente de Filtro de Período (Reutilizado) ---
const PeriodFilterBar = ({ period, setPeriod }) => (
    <div className="period-filter-bar">
        <button onClick={() => setPeriod('7d')} className={period === '7d' ? 'active' : ''}>7 Días</button>
        <button onClick={() => setPeriod('30d')} className={period === '30d' ? 'active' : ''}>30 Días</button>
        <button onClick={() => setPeriod('6m')} className={period === '6m' ? 'active' : ''}>6 Meses</button>
        <button onClick={() => setPeriod('1a')} className={period === '1a' ? 'active' : ''}>1 Año</button>
        <button onClick={() => setPeriod('all')} className={period === 'all' ? 'active' : ''}>Todo</button>
    </div>
);
const formatCurrency = (value, sign = '') => {
    const formatted = Math.abs(value).toFixed(2);
    if (value < 0) return `-Q${formatted}`;
    return `${sign}Q${formatted}`;
};

// --- Funciones de Ayuda (fuera del componente para limpieza) ---

// Calcula las fechas de inicio/fin para el período actual y el anterior
function getPeriodDates(period) {
    const today = startOfDay(new Date());
    let currentStart, prevStart, prevEnd, numDays;

    switch (period) {
        case '7d':
            numDays = 7;
            currentStart = subDays(today, numDays - 1);
            prevEnd = subDays(currentStart, 1);
            prevStart = subDays(prevEnd, numDays - 1);
            break;
        case '6m':
            currentStart = subMonths(today, 6);
            prevEnd = subDays(currentStart, 1);
            prevStart = subMonths(prevEnd, 6);
            numDays = differenceInDays(today, currentStart) + 1;
            break;
        case '1a':
            currentStart = subYears(today, 1);
            prevEnd = subDays(currentStart, 1);
            prevStart = subYears(prevEnd, 1);
            numDays = differenceInDays(today, currentStart) + 1;
            break;
        case 'all':
            currentStart = new Date(0); // Epoch
            prevStart = new Date(0); // No hay período anterior
            prevEnd = new Date(0);
            numDays = differenceInDays(today, currentStart) + 1;
            break;
        case '30d':
        default:
            numDays = 30;
            currentStart = subDays(today, numDays - 1);
            prevEnd = subDays(currentStart, 1);
            prevStart = subDays(prevEnd, numDays - 1);
            break;
    }
    return { currentStart, currentEnd: today, prevStart, prevEnd, numDays };
}

// Procesa una lista de transacciones y devuelve un resumen
function processTransactions(txList, categories) {
    const data = {
        totalIngresos: 0,
        totalGastos: 0,
        countIngresos: 0,
        countGastos: 0,
        byCategory: {} // { 'catId': { name, color, total, type } }
    };

    for (const tx of txList) {
        const amount = parseFloat(tx.amount);
        const category = categories.find(c => c.id === tx.category_id);
        const catId = category?.id || (tx.type === 'Ingreso' ? 'ingreso-default' : 'gasto-default');
        const catName = category?.name || (tx.type === 'Ingreso' ? 'Ingreso (Sin Categoría)' : 'Gasto (Sin Categoría)');
        const catColor = category?.color || '#8884d8';
        
        if (!data.byCategory[catId]) {
            data.byCategory[catId] = { name: catName, color: catColor, total: 0, type: tx.type };
        }
        data.byCategory[catId].total += amount;

        if (tx.type === 'Ingreso') {
            data.totalIngresos += amount;
            data.countIngresos++;
        } else {
            data.totalGastos += amount;
            data.countGastos++;
        }
    }
    return data;
}

// Calcula el cambio porcentual de forma segura
function calculatePctChange(current, previous) {
    if (previous === 0) {
        return (current > 0) ? 100.0 : 0.0; // Evita división por cero
    }
    return ((current - previous) / Math.abs(previous)) * 100;
}


// --- COMPONENTE DEL REPORTE INFORMES ---
const InformesReport = () => {
    const { transactions, categories, loading } = useData();
    const [period, setPeriod] = useState('30d');

    const { summary, breakdown } = useMemo(() => {
        if (!transactions || !categories) return { summary: {}, breakdown: { incomes: [], expenses: [] } };

        const dates = getPeriodDates(period);

        // 1. Filtrar transacciones por período
        const currentTransactions = transactions.filter(tx => {
            const txDate = parseISO(tx.date);
            return txDate >= dates.currentStart && txDate <= dates.currentEnd;
        });
        const prevTransactions = transactions.filter(tx => {
            const txDate = parseISO(tx.date);
            return txDate >= dates.prevStart && txDate <= dates.prevEnd;
        });

        // 2. Procesar los datos de cada período
        const currentData = processTransactions(currentTransactions, categories);
        const prevData = processTransactions(prevTransactions, categories);

        // 3. Preparar el "Resumen Rápido" (Tabla)
        const numDays = dates.numDays;
        const summary = {
            countIngresos: currentData.countIngresos,
            countGastos: currentData.countGastos,
            totalIngresos: currentData.totalIngresos,
            totalGastos: currentData.totalGastos,
            flujoNeto: currentData.totalIngresos - currentData.totalGastos,
            avgDiarioIngresos: currentData.totalIngresos / numDays,
            avgDiarioGastos: currentData.totalGastos / numDays,
            avgRegistroIngresos: currentData.countIngresos > 0 ? currentData.totalIngresos / currentData.countIngresos : 0,
            avgRegistroGastos: currentData.countGastos > 0 ? currentData.totalGastos / currentData.countGastos : 0,
        };

        // 4. Preparar el "Desglose por Categoría" (Lista)
        const flujoNetoAnterior = prevData.totalIngresos - prevData.totalGastos;
        const allCategoryIds = new Set([
            ...Object.keys(currentData.byCategory), 
            ...Object.keys(prevData.byCategory)
        ]);

        let incomeList = [];
        let expenseList = [];

        allCategoryIds.forEach(catId => {
            const current = currentData.byCategory[catId];
            const prev = prevData.byCategory[catId];

            const currentTotal = current?.total || 0;
            const prevTotal = prev?.total || 0;
            
            // Solo mostrar si hay movimiento en el período actual
            if (currentTotal > 0) {
                const item = {
                    name: current.name,
                    color: current.color,
                    total: currentTotal,
                    pctChange: calculatePctChange(currentTotal, prevTotal)
                };
                if (current.type === 'Ingreso') {
                    incomeList.push(item);
                } else {
                    expenseList.push(item);
                }
            }
        });
        
        const breakdown = {
            flujoNeto: summary.flujoNeto,
            flujoNetoPctChange: calculatePctChange(summary.flujoNeto, flujoNetoAnterior),
            totalIngresos: summary.totalIngresos,
            totalIngresosPctChange: calculatePctChange(summary.totalIngresos, prevData.totalIngresos),
            totalGastos: summary.totalGastos,
            totalGastosPctChange: calculatePctChange(summary.totalGastos, prevData.totalGastos),
            incomes: incomeList.sort((a, b) => b.total - a.total),
            expenses: expenseList.sort((a, b) => b.total - a.total),
        };

        return { summary, breakdown };
    }, [transactions, categories, period]);

    if (loading) {
        return <div className="stats-card"><p>Calculando informes...</p></div>;
    }

    return (
        <>
            <PeriodFilterBar period={period} setPeriod={setPeriod} />

            {/* --- 1. Tabla de Flujo de Caja --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Tabla de flujo de caja</h4>
                    <p>¿Estoy gastando demasiado?</p>
                </div>
                <table className="cashflow-table">
                    <thead>
                        <tr>
                            <th>Resumen Rápido</th>
                            <th>Ingresos</th>
                            <th>Gastos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Cantidad</td>
                            <td>{summary.countIngresos}</td>
                            <td>{summary.countGastos}</td>
                        </tr>
                        <tr>
                            <td>Promedio (Diario)</td>
                            <td>{formatCurrency(summary.avgDiarioIngresos, '+')}</td>
                            <td>{formatCurrency(summary.avgDiarioGastos * -1)}</td>
                        </tr>
                        <tr>
                            <td>Promedio (Registro)</td>
                            <td>{formatCurrency(summary.avgRegistroIngresos, '+')}</td>
                            <td>{formatCurrency(summary.avgRegistroGastos * -1)}</td>
                        </tr>
                        <tr className="total-row">
                            <td>Total</td>
                            <td>{formatCurrency(summary.totalIngresos, '+')}</td>
                            <td>{formatCurrency(summary.totalGastos * -1)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="net-flow-row">
                            <td colSpan="2">Flujo de fondos</td>
                            <td className={summary.flujoNeto >= 0 ? 'income' : 'expense'}>
                                {formatCurrency(summary.flujoNeto)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* --- 2. Ingresos y Gastos (Desglose) --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Ingresos y gastos en GTQ</h4>
                    <p>¿Quieres ver a dónde va tu dinero?</p>
                </div>

                <div className="kpi-comparison">
                    <div className="kpi-comparison-main">
                        <span className="kpi-label">Flujo Neto ({period})</span>
                        <span className={`kpi-value ${breakdown.flujoNeto >= 0 ? 'income' : 'expense'}`}>
                            {formatCurrency(breakdown.flujoNeto)}
                        </span>
                    </div>
                    <div className="kpi-comparison-vs">
                        <span className="kpi-label">frente al período anterior</span>
                        <span className={`kpi-percentage ${breakdown.flujoNetoPctChange >= 0 ? 'income' : 'expense'}`}>
                            {breakdown.flujoNetoPctChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            {breakdown.flujoNetoPctChange.toFixed(0)}%
                        </span>
                    </div>
                </div>

                <div className="category-report-list">
                    {/* --- INGRESOS --- */}
                    <div className="category-report-header">
                        <h4>Ingresos</h4>
                        <div className="category-report-totals">
                            <span className={`percentage ${breakdown.totalIngresosPctChange >= 0 ? 'income' : 'expense'}`}>
                                {breakdown.totalIngresosPctChange.toFixed(0)}%
                            </span>
                            <span>{formatCurrency(breakdown.totalIngresos, '+')}</span>
                        </div>
                    </div>
                    {breakdown.incomes.length === 0 ? <p>No hay ingresos</p> : (
                        breakdown.incomes.map(item => (
                            <CategoryReportItem key={item.name} item={item} />
                        ))
                    )}

                    {/* --- GASTOS --- */}
                    <div className="category-report-header">
                        <h4>Gastos</h4>
                        <div className="category-report-totals">
                            <span className={`percentage ${breakdown.totalGastosPctChange > 0 ? 'expense' : 'income'}`}>
                                {breakdown.totalGastosPctChange.toFixed(0)}%
                            </span>
                            <span>{formatCurrency(breakdown.totalGastos * -1)}</span>
                        </div>
                    </div>
                    {breakdown.expenses.length === 0 ? <p>No hay gastos</p> : (
                        breakdown.expenses.map(item => (
                            <CategoryReportItem key={item.name} item={item} isExpense={true} />
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

// --- Componente de Item (para la lista de desglose) ---
const CategoryReportItem = ({ item, isExpense = false }) => (
    <div className="category-report-item">
        <div className="category-report-icon" style={{ backgroundColor: item.color, opacity: 0.2 }}>
            {/* Aquí podrías poner un ícono basado en el nombre, pero la inicial es más fácil */}
            <span style={{ color: item.color, fontSize: '18px', fontWeight: 'bold' }}>
                {item.name.charAt(0)}
            </span>
        </div>
        <div className="category-report-details">
            <span>{item.name}</span>
            <span className={`percentage ${item.pctChange >= 0 ? (isExpense ? 'expense' : 'income') : (isExpense ? 'income' : 'expense')}`}>
                {item.pctChange.toFixed(0)}%
            </span>
        </div>
        <span className={`category-report-amount ${isExpense ? 'expense' : 'income'}`}>
            {formatCurrency(item.total * (isExpense ? -1 : 1))}
        </span>
    </div>
);

export default InformesReport;