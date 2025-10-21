// 1. IMPORTA 'useState' y las funciones de 'date-fns' que necesitamos
import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import {
    ResponsiveContainer,
    BarChart,
    LineChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

// --- COMPONENTE DEL REPORTE FLUJO DE FONDOS ---
const FlujoDeFondosReport = () => {
    const { transactions, loading } = useData();
    
    // 2. AÑADIMOS ESTADO PARA EL PERÍODO
    // '30d' = 30 días, '6m' = 6 meses, '1a' = 1 año, 'all' = todo
    const [period, setPeriod] = useState('6m'); // Default a 6 meses

    const { kpis, chartData } = useMemo(() => {
        const today = startOfDay(new Date());
        let startDate;
        let aggregateBy = 'month'; // Agrupar por 'month' o 'day'

        // 3. DEFINIMOS LA FECHA DE INICIO SEGÚN EL PERÍODO
        switch (period) {
            case '7d':
                startDate = subDays(today, 6); // Hoy + 6 días atrás
                aggregateBy = 'day';
                break;
            case '30d':
                startDate = subDays(today, 29);
                aggregateBy = 'day';
                break;
            case '6m':
                startDate = subMonths(today, 6);
                aggregateBy = 'month';
                break;
            case '1a':
                startDate = subYears(today, 1);
                aggregateBy = 'month';
                break;
            default: // 'all'
                startDate = new Date(0); // Epoch (inicio de los tiempos)
                aggregateBy = 'month';
        }

        if (!transactions || transactions.length === 0) {
            return { kpis: { totalIncome: 0, totalExpense: 0, netFlow: 0 }, chartData: [] };
        }
        
        // 4. FILTRAMOS TRANSACCIONES POR EL PERÍODO SELECCIONADO
        const filteredTransactions = transactions.filter(tx => {
            const txDate = parseISO(tx.date);
            return txDate >= startDate && txDate <= today;
        });

        // 5. CALCULAMOS LOS KPIs TOTALES (para la tarjeta superior)
        const kpis = filteredTransactions.reduce((acc, tx) => {
            const amount = parseFloat(tx.amount);
            if (tx.type === 'Ingreso') {
                acc.totalIncome += amount;
            } else {
                acc.totalExpense += amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });
        kpis.netFlow = kpis.totalIncome - kpis.totalExpense;


        // 6. AGRUPAMOS PARA LOS GRÁFICOS (por día o por mes)
        const aggregatedData = filteredTransactions.reduce((acc, tx) => {
            let key;
            if (aggregateBy === 'day') {
                key = format(parseISO(tx.date), 'yyyy-MM-dd'); // '2023-10-21'
            } else {
                key = format(parseISO(tx.date), 'yyyy-MM'); // '2023-10'
            }
            
            if (!acc[key]) {
                acc[key] = { income: 0, expense: 0 };
            }

            if (tx.type === 'Ingreso') {
                acc[key].income += parseFloat(tx.amount);
            } else if (tx.type === 'Gasto') {
                acc[key].expense += parseFloat(tx.amount);
            }
            return acc;
        }, {});

        // 7. ORDENAMOS Y FORMATEAMOS LOS DATOS PARA RECHARTS
        const sortedKeys = Object.keys(aggregatedData).sort();
        let runningBalance = 0;
        const finalChartData = sortedKeys.map(key => {
            const { income, expense } = aggregatedData[key];
            const netBalance = income - expense;
            runningBalance += netBalance;

            let name;
            if (aggregateBy === 'day') {
                name = format(parseISO(key), 'd MMM', { locale: es }); // '21 Oct'
            } else {
                name = format(parseISO(`${key}-01`), 'MMM yyyy', { locale: es }); // 'Oct 2023'
            }

            return {
                name,
                Ingreso: income,
                Gasto: expense,
                BalanceAcumulado: runningBalance
            };
        });

        return { kpis, chartData: finalChartData };

    }, [transactions, period]); // Se recalcula si cambian las transacciones O el período

    if (loading) {
        return <div className="stats-card"><p>Calculando flujo de fondos...</p></div>;
    }

    const formatCurrency = (value) => `Q${value.toFixed(2)}`;

    return (
        <>
            {/* 8. BARRA DE FILTROS DE PERÍODO */}
            <div className="period-filter-bar">
                <button onClick={() => setPeriod('7d')} className={period === '7d' ? 'active' : ''}>7 Días</button>
                <button onClick={() => setPeriod('30d')} className={period === '30d' ? 'active' : ''}>30 Días</button>
                <button onClick={() => setPeriod('6m')} className={period === '6m' ? 'active' : ''}>6 Meses</button>
                <button onClick={() => setPeriod('1a')} className={period === '1a' ? 'active' : ''}>1 Año</button>
                <button onClick={() => setPeriod('all')} className={period === 'all' ? 'active' : ''}>Todo</button>
            </div>

            {/* 9. TARJETA DE KPIs */}
            <div className="stats-card kpi-card">
                <div className="kpi-item">
                    <span className="kpi-label">Total Ingresos</span>
                    <span className="kpi-value income">
                        {formatCurrency(kpis.totalIncome)}
                    </span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Total Gastos</span>
                    <span className="kpi-value expense">
                        -{formatCurrency(kpis.totalExpense)}
                    </span>
                </div>
                <div className="kpi-item net-flow">
                    <span className="kpi-label">Flujo Neto</span>
                    <span className={`kpi-value ${kpis.netFlow >= 0 ? 'income' : 'expense'}`}>
                        {formatCurrency(kpis.netFlow)}
                    </span>
                </div>
            </div>

            {/* 10. GRÁFICOS (con comprobación de datos) */}
            {chartData.length === 0 ? (
                <div className="stats-card">
                    <div className="stats-header">
                        <h4>Sin Datos</h4>
                        <p>No hay transacciones en el período seleccionado.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* --- Tarjeta 1: Flujo Mensual (Ingresos vs Gastos) --- */}
                    <div className="stats-card">
                        <div className="stats-header">
                            <h4>Flujo de Fondos</h4>
                            <p>Comparación de ingresos y gastos en el período.</p>
                        </div>
                        <div className="chart-wrapper" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted-dark)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" tickFormatter={formatCurrency} fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface-dark)',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                        formatter={formatCurrency}
                                    />
                                    <Legend />
                                    <Bar dataKey="Ingreso" fill="var(--green-accent)" />
                                    <Bar dataKey="Gasto" fill="var(--red-accent)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- Tarjeta 2: Balance Acumulado --- */}
                    <div className="stats-card">
                        <div className="stats-header">
                            <h4>Balance Acumulado</h4>
                            <p>Evolución de tu patrimonio neto en el período.</p>
                        </div>
                        <div className="chart-wrapper" style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted-dark)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--text-muted)" tickFormatter={formatCurrency} fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--surface-dark)',
                                            border: 'none',
                                            borderRadius: '8px'
                                        }}
                                        formatter={formatCurrency}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="BalanceAcumulado" 
                                        name="Balance Acumulado"
                                        stroke="var(--blue-accent)" 
                                        strokeWidth={2} 
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default FlujoDeFondosReport;