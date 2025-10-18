import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext'; // <-- 1. Importa el Hook
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import './DashboardPage.css';

// Componente para una tarjeta de KPI (Sin cambios)
const KpiCard = ({ title, amount, type, icon: Icon }) => {
    const formattedAmount = `Q${parseFloat(amount).toFixed(2)}`;
    return (
        <div className="kpi-card">
            <div className="kpi-card-header">
                <h4 className="kpi-card-title">{title}</h4>
                <Icon className={`kpi-icon ${type}`} size={24} />
            </div>
            <p className={`kpi-card-amount ${type}`}>{formattedAmount}</p>
        </div>
    );
};

const DashboardPage = () => {
    // 2. Obtén TODOS los datos necesarios del contexto
    const { transactions, categories, loading } = useData();
    
    // Los filtros se quedan como estado local
    const [period, setPeriod] = useState('30');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // 3. QUITA todo el 'useEffect' para 'fetchDashboardData'. Ya no es necesario.

    // 4. 'useMemo' recalcula el resumen CADA VEZ que los datos del contexto (o los filtros) cambian.
    const { summary, expensesByCategory, recentTransactions } = useMemo(() => {
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - parseInt(period));

        // Filtra las transacciones según el período y la categoría
        const filteredTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const inPeriod = txDate >= startDate;
            const inCategory = (categoryFilter === 'all') || (tx.category_id === categoryFilter);
            return inPeriod && inCategory;
        });

        let totalIngresos = 0;
        let totalGastos = 0;
        const expensesByCat = {};

        for (const tx of filteredTransactions) {
            if (tx.type === 'Ingreso') {
                totalIngresos += parseFloat(tx.amount);
            } else if (tx.type === 'Gasto') {
                totalGastos += parseFloat(tx.amount);
                
                const catName = tx.categories?.name || 'Sin Categoría';
                const catColor = tx.categories?.color || '#94a3b8';
                
                if (!expensesByCat[catName]) {
                    expensesByCat[catName] = { name: catName, value: 0, color: catColor };
                }
                expensesByCat[catName].value += parseFloat(tx.amount);
            }
        }
        
        const balance = totalIngresos - totalGastos;
        
        return {
            summary: { ingresos: totalIngresos, gastos: totalGastos, balance: balance },
            expensesByCategory: Object.values(expensesByCat),
            recentTransactions: filteredTransactions.slice(0, 6)
        };
    }, [transactions, period, categoryFilter]); // Dependencias: datos del contexto y filtros locales


    // El 'renderCustomLabel' para el gráfico se queda igual
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        // ... (Tu código de 'renderCustomLabel' sin cambios)
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Cargando resumen...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>Resumen Financiero</h2>
                <div className="filters">
                    <div className="filter-group">
                        <label>Período</label>
                        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="90">Últimos 90 días</option>
                            <option value="365">Último año</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Categoría</label>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                            <option value="all">Todas</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="kpi-grid">
                <KpiCard 
                    title="Ingresos" 
                    amount={summary.ingresos} 
                    type="income" 
                    icon={TrendingUp}
                />
                <KpiCard 
                    title="Gastos" 
                    amount={summary.gastos} 
                    type="expense" 
                    icon={TrendingDown}
                />
                <KpiCard 
                    title="Balance" 
                    amount={summary.balance} 
                    type={summary.balance >= 0 ? 'balance-positive' : 'balance-negative'}
                    icon={DollarSign}
                />
            </div>

            {/* Distribución de Gastos (Gráfica de Pastel) */}
            {expensesByCategory.length > 0 && (
                <div className="dashboard-section chart-section">
                    <h3>Distribución de Gastos</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={expensesByCategory}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expensesByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value) => `Q${parseFloat(value).toFixed(2)}`}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#e5e7eb'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value) => (
                                        <span style={{ color: '#e5e7eb', fontSize: '14px' }}>
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Transacciones Recientes */}
            <div className="dashboard-section">
                <h3>Transacciones Recientes</h3>
                <div className="transaction-list">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map(tx => (
                            <div key={tx.id} className="transaction-item">
                                <div className="transaction-item-main">
                                    <span 
                                        className="category-color-dot" 
                                        style={{ backgroundColor: tx.categories?.color || '#94a3b8' }}
                                    ></span>
                                    <div className="transaction-info">
                                        <h4>{tx.type}</h4>
                                        <p className="transaction-date">
                                            {new Date(tx.date).toLocaleDateString('es-GT', {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`transaction-amount ${tx.type === 'Ingreso' ? 'income' : 'expense'}`}>
                                    {tx.type === 'Gasto' ? '-' : '+'}Q{parseFloat(tx.amount).toFixed(2)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No hay transacciones en este período.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;