import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { subDays, format, eachDayOfInterval, startOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { es } from 'date-fns/locale';

// --- COMPONENTE DEL REPORTE DE SALDO ---
const SaldoReport = () => {
    const { accounts, transactions, transfers, loading } = useData();

    // 1. CALCULAR SALDO ACTUAL POR CUENTA (Lógica de AccountsPage)
    const accountsWithBalance = useMemo(() => {
        return accounts.map(account => {
            let balance = parseFloat(account.opening_balance);
            for (const tx of transactions) {
                if (tx.account_id === account.id) {
                    balance += (tx.type === 'Ingreso' ? 1 : -1) * parseFloat(tx.amount);
                }
            }
            for (const tr of transfers) {
                if (tr.to_account_id === account.id) balance += parseFloat(tr.amount);
                if (tr.from_account_id === account.id) balance -= parseFloat(tr.amount);
            }
            return { ...account, current_balance: balance };
        });
    }, [accounts, transactions, transfers]);

    // 2. CALCULAR SALDO TOTAL
    const totalBalance = useMemo(() => {
        return accountsWithBalance.reduce((sum, acc) => sum + acc.current_balance, 0);
    }, [accountsWithBalance]);

    // 3. CALCULAR DATOS PARA LA GRÁFICA DE LÍNEA (Últimos 30 días)
    const { chartData, percentChange } = useMemo(() => {
        const periodDays = 30;
        const now = new Date();
        const startDate = startOfDay(subDays(now, periodDays - 1)); // -29 para incluir hoy (30 días)
        
        // a. Calcular el balance inicial (hace 30 días)
        let balanceAtStartDate = accounts.reduce((sum, acc) => sum + parseFloat(acc.opening_balance), 0);
        
        const relevantTxs = transactions.filter(tx => new Date(tx.date) < startDate);
        const relevantTransfers = transfers.filter(tr => new Date(tr.date) < startDate);

        for (const tx of relevantTxs) {
            balanceAtStartDate += (tx.type === 'Ingreso' ? 1 : -1) * parseFloat(tx.amount);
        }
        for (const tr of relevantTransfers) {
            // Este cálculo es complejo, lo simplificamos asumiendo que las transferencias solo afectan cuentas
            // (lo cual es correcto, no afectan el *net worth* total, pero sí el balance individual)
            // Para "Tendencia del Saldo" (net worth total), las transferencias son irrelevantes.
        }

        // b. Generar un array de los últimos 30 días
        const dateInterval = eachDayOfInterval({ start: startDate, end: now });
        
        // c. Mapear transacciones por día para consulta rápida
        const txsByDay = {};
        transactions.filter(tx => new Date(tx.date) >= startDate).forEach(tx => {
            const day = format(startOfDay(new Date(tx.date)), 'yyyy-MM-dd');
            if (!txsByDay[day]) txsByDay[day] = [];
            txsByDay[day].push(tx);
        });

        // d. Calcular el balance acumulado para cada día
        let currentBalance = balanceAtStartDate;
        const data = dateInterval.map(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayTxs = txsByDay[dayKey] || [];
            
            const dailyNetChange = dayTxs.reduce((sum, tx) => {
                return sum + (tx.type === 'Ingreso' ? 1 : -1) * parseFloat(tx.amount);
            }, 0);
            
            currentBalance += dailyNetChange;
            
            return {
                date: format(day, 'dd MMM', { locale: es }),
                balance: currentBalance,
            };
        });
        
        // e. Calcular % de cambio
        const change = totalBalance - balanceAtStartDate;
        const pc = (balanceAtStartDate === 0) ? 0 : (change / Math.abs(balanceAtStartDate)) * 100;

        return { chartData: data, percentChange: pc };

    }, [accounts, transactions, transfers, totalBalance]);


    if (loading) {
        return <div className="stats-card"><p>Calculando estadísticas...</p></div>;
    }

    return (
        <>
            {/* --- Tarjeta 1: TENDENCIA DEL SALDO --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Tendencia del saldo</h4>
                    <p>¿Tengo más dinero que antes?</p>
                </div>
                <div className="stats-main-content">
                    <div>
                        <p className="stats-label">HOY</p>
                        <p className="stats-big-number">Q{totalBalance.toFixed(2)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p className="stats-label">frente al período anterior</p>
                        <p className={`stats-comparison ${percentChange >= 0 ? 'income' : 'expense'}`}>
                            {percentChange.toFixed(0)}%
                        </p>
                    </div>
                </div>
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'var(--surface-dark)', 
                                    border: 'none', 
                                    borderRadius: '8px'
                                }}
                                formatter={(value) => [`Q${value.toFixed(2)}`, 'Balance']}
                            />
                            <XAxis 
                                dataKey="date" 
                                stroke="var(--text-muted)" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                interval='preserveStartEnd'
                            />
                            <YAxis 
                                hide 
                                domain={['dataMin - 50', 'dataMax + 50']}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="balance" 
                                stroke="var(--blue-accent)" 
                                strokeWidth={2} 
                                dot={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- Tarjeta 2: SALDO POR CUENTAS --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Saldo por cuentas</h4>
                    <p>¿En qué cuentas tengo la mayor parte de mi dinero?</p>
                </div>
                <p className="stats-big-number">Q{totalBalance.toFixed(2)}</p>
                <div className="account-balance-list">
                    {accountsWithBalance.map(account => {
                        const percentage = totalBalance > 0 ? (account.current_balance / totalBalance) * 100 : 0;
                        return (
                            <div key={account.id} className="account-balance-item">
                                <div className="account-balance-header">
                                    <span>{account.name}</span>
                                    <span>Q{account.current_balance.toFixed(2)}</span>
                                </div>
                                <div className="bar-container">
                                    <div 
                                        className="bar-fill" 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default SaldoReport;