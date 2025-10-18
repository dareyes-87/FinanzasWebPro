import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { format, getWeek, startOfWeek, subDays, subWeeks, subMonths, subYears, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Utensils, Bus, Briefcase, FileText, Gift, Home, ShoppingCart, HeartPulse, GraduationCap } from 'lucide-react';
import './RegistrosPage.css';

// Mapeo de iconos (puedes expandir esto)
const ICONS = {
    default: <FileText size={20} />,
    comida: <Utensils size={20} />,
    transporte: <Bus size={20} />,
    sueldo: <Briefcase size={20} />,
    regalos: <Gift size={20} />,
    hogar: <Home size={20} />,
    compras: <ShoppingCart size={20} />,
    salud: <HeartPulse size={20} />,
    universidad: <GraduationCap size={20} />,
};

const getCategoryIcon = (categoryName) => {
    if (!categoryName) return ICONS.default;
    const name = categoryName.toLowerCase();
    if (name.includes('comida')) return ICONS.comida;
    if (name.includes('transporte')) return ICONS.transporte;
    if (name.includes('sueldo')) return ICONS.sueldo;
    if (name.includes('universidad')) return ICONS.universidad;
    if (name.includes('salud')) return ICONS.salud;
    return ICONS.default;
};

// Componente de la barra de filtros inferior
const PeriodFilterBar = ({ period, setPeriod }) => {
    const filters = [
        { key: '7d', label: '7 Días' },
        { key: '30d', label: '30 Días' },
        { key: '12w', label: '12 Semanas' },
        { key: '6m', label: '6 Meses' },
        { key: '1y', label: '1 Año' },
    ];
    return (
        <div className="period-filter-bar">
            {filters.map(f => (
                <button
                    key={f.key}
                    className={`filter-button ${period === f.key ? 'active' : ''}`}
                    onClick={() => setPeriod(f.key)}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
};

const RegistrosPage = () => {
    const { transactions, accounts, loading } = useData();
    const [period, setPeriod] = useState('30d'); // 7d, 30d, 12w, 6m, 1y

    const accountMap = useMemo(() => {
        return accounts.reduce((map, acc) => {
            map[acc.id] = acc.name;
            return map;
        }, {});
    }, [accounts]);

    const groupedTransactions = useMemo(() => {
        const now = new Date();
        let startDate;

        // 1. Calcular fecha de inicio según el filtro
        switch (period) {
            case '7d': startDate = subDays(now, 7); break;
            case '12w': startDate = subWeeks(now, 12); break;
            case '6m': startDate = subMonths(now, 6); break;
            case '1y': startDate = subYears(now, 1); break;
            case '30d':
            default: startDate = subDays(now, 30);
        }
        startDate = startOfDay(startDate);

        // 2. Filtrar transacciones
        const filtered = transactions.filter(tx => new Date(tx.date) >= startDate);

        // 3. Agrupar por semana (como en el boceto)
        const groups = {};

        for (const tx of filtered) {
            const txDate = new Date(tx.date);
            const weekNumber = getWeek(txDate, { locale: es });
            const weekStart = startOfWeek(txDate, { locale: es });
            const year = txDate.getFullYear();
            
            const key = `${year}-W${weekNumber}`;
            
            if (!groups[key]) {
                groups[key] = {
                    key,
                    weekLabel: `Semana ${weekNumber}`,
                    weekStartDate: weekStart,
                    transactions: [],
                    totalGasto: 0,
                    totalIngreso: 0,
                };
            }
            
            groups[key].transactions.push(tx);
            if (tx.type === 'Gasto') {
                groups[key].totalGasto += parseFloat(tx.amount);
            } else if (tx.type === 'Ingreso') {
                groups[key].totalIngreso += parseFloat(tx.amount);
            }
        }

        // 4. Convertir a Array y ordenar por fecha de inicio de semana (más nueva primero)
        return Object.values(groups).sort((a, b) => b.weekStartDate - a.weekStartDate);

    }, [transactions, period]);

    if (loading) {
        return <div>Cargando registros...</div>;
    }

    return (
        <div className="registros-page">
            <div className="header">
                <h2>Registros</h2>
                {/* Aquí puedes agregar un título dinámico como "ÚLTIMOS 30 DÍAS" */}
            </div>

            <div className="registros-list">
                {groupedTransactions.length === 0 && (
                    <p className="empty-state">No hay registros en este período.</p>
                )}

                {groupedTransactions.map(group => (
                    <div key={group.key} className="week-group">
                        <div className="week-header">
                            <span>{group.weekLabel.toUpperCase()}</span>
                            <span>
                                {group.totalIngreso > 0 && `+Q${group.totalIngreso.toFixed(2)} `}
                                {group.totalGasto > 0 && `-Q${group.totalGasto.toFixed(2)}`}
                            </span>
                        </div>
                        
                        {group.transactions.map(tx => (
                            <div key={tx.id} className="registro-item">
                                <div className="registro-icon" style={{ backgroundColor: tx.categories?.color || '#3a3c53' }}>
                                    {getCategoryIcon(tx.categories?.name)}
                                </div>
                                <div className="registro-info">
                                    <h4>{tx.categories?.name || 'Sin Categoría'}</h4>
                                    <p>{accountMap[tx.account_id] || 'Cuenta borrada'}</p>
                                </div>
                                <div className="registro-amount">
                                    <span className={tx.type === 'Ingreso' ? 'income' : 'expense'}>
                                        {tx.type === 'Gasto' ? '-' : '+'}Q{parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                    <p>{format(new Date(tx.date), 'dd MMM', { locale: es })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <PeriodFilterBar period={period} setPeriod={setPeriod} />
        </div>
    );
};

export default RegistrosPage;