import React, { useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { format, parseISO, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

// Colores para cada naturaleza (puedes cambiarlos)
const NATURE_COLORS = {
    Deber: '#f44336',     // Rojo
    Necesidad: '#ff9800', // Naranja
    Deseo: '#4caf50',     // Verde
    'Sin Asignar': '#9e9e9e' // Gris
};

// Formateador de moneda
const formatCurrency = (value) => `Q${value.toFixed(2)}`;

// --- COMPONENTE DEL REPORTE GASTO POR NATURALEZA ---
// Acepta el 'period' como prop del componente padre (GastoReport)
const GastoPorNaturalezaReport = ({ period }) => {
    const { transactions, categories, loading } = useData();
    
    // Estado para el filtro de naturaleza: 'Todos', 'Deber', 'Necesidad', 'Deseo'
    const [natureFilter, setNatureFilter] = useState('Todos');

    const { kpiTotal, barChartData, categoryListData } = useMemo(() => {
        const today = startOfDay(new Date());
        let startDate;

        switch (period) {
            case '7d': startDate = subDays(today, 6); break;
            case '30d': startDate = subDays(today, 29); break;
            case '6m': startDate = subMonths(today, 6); break;
            case '1a': startDate = subYears(today, 1); break;
            default: startDate = new Date(0);
        }

        if (!transactions || !categories) {
            return { kpiTotal: 0, barChartData: [], categoryListData: [] };
        }

        // 1. Filtrar GASTOS del período y añadirles su 'naturaleza'
        const gastosConNaturaleza = transactions
            .filter(tx => {
                const txDate = parseISO(tx.date);
                return tx.type === 'Gasto' && txDate >= startDate && txDate <= today;
            })
            .map(tx => {
                const category = categories.find(c => c.id === tx.category_id);
                const nature = category?.nature || 'Sin Asignar'; // Default si no tiene
                return { ...tx, nature, categoryName: category?.name || 'Sin Categoría', categoryColor: category?.color || NATURE_COLORS['Sin Asignar'] };
            });

        // 2. Filtrar por la 'naturaleza' seleccionada (Deber, Deseo, etc.)
        const gastosFiltrados = gastosConNaturaleza.filter(tx => {
            if (natureFilter === 'Todos') return true;
            return tx.nature === natureFilter;
        });

        // 3. Calcular KPI Total
        const kpiTotal = gastosFiltrados.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
        // 4. Agrupar para el Gráfico de Barras Apiladas (usamos TODOS los gastos del período)
        const aggregateBy = (period === '7d' || period === '30d') ? 'day' : 'month';
        const groupedForBarChart = gastosConNaturaleza.reduce((acc, tx) => {
            let key;
            if (aggregateBy === 'day') {
                key = format(parseISO(tx.date), 'yyyy-MM-dd');
            } else {
                key = format(parseISO(tx.date), 'yyyy-MM');
            }
            
            if (!acc[key]) {
                acc[key] = { Deber: 0, Necesidad: 0, Deseo: 0, 'Sin Asignar': 0 };
            }
            acc[key][tx.nature] += parseFloat(tx.amount);
            return acc;
        }, {});
        
        const barChartData = Object.keys(groupedForBarChart).sort().map(key => {
            const name = (aggregateBy === 'day') 
                ? format(parseISO(key), 'd MMM', { locale: es })
                : format(parseISO(`${key}-01`), 'MMM yy', { locale: es });
            return { name, ...groupedForBarChart[key] };
        });

        // 5. Agrupar para la Lista de Categorías (usamos los gastos FILTRADOS)
        const groupedForList = gastosFiltrados.reduce((acc, tx) => {
            if (!acc[tx.categoryName]) {
                acc[tx.categoryName] = { name: tx.categoryName, value: 0, color: tx.categoryColor };
            }
            acc[tx.categoryName].value += parseFloat(tx.amount);
            return acc;
        }, {});

        const categoryListData = Object.values(groupedForList)
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Tomamos el Top 5
        
        // Calcular el porcentaje para la barra de progreso
        const maxCategoryValue = categoryListData[0]?.value || kpiTotal;
        const categoryListWithPercentage = categoryListData.map(item => ({
            ...item,
            percentage: (item.value / (natureFilter === 'Todos' ? kpiTotal : maxCategoryValue)) * 100
        }));


        return { kpiTotal, barChartData, categoryListData: categoryListWithPercentage };

    }, [transactions, categories, period, natureFilter]); // Recalcula si cambia el período O el filtro de naturaleza

    if (loading) {
        return <div className="stats-card"><p>Calculando gastos por naturaleza...</p></div>;
    }

    return (
        <div className="stats-card">
            <div className="stats-header">
                <h4>Gasto por naturaleza</h4>
                <p>¿Cuánto debo pagar, necesito pagar o solo quiero gastar?</p>
            </div>

            {/* --- KPI Total --- */}
            <div className="kpi-center">
                <span className="kpi-label-center">Gasto Total ({natureFilter})</span>
                <span className="kpi-value-center expense">
                    {formatCurrency(kpiTotal)}
                </span>
            </div>

            {/* --- Filtros de Naturaleza --- */}
            <div className="nature-filter-bar">
                <button onClick={() => setNatureFilter('Todos')} className={natureFilter === 'Todos' ? 'active' : ''}>Todos</button>
                <button onClick={() => setNatureFilter('Deber')} className={natureFilter === 'Deber' ? 'active' : ''}>Deber</button>
                <button onClick={() => setNatureFilter('Necesidad')} className={natureFilter === 'Necesidad' ? 'active' : ''}>Necesidad</button>
                <button onClick={() => setNatureFilter('Deseo')} className={natureFilter === 'Deseo' ? 'active' : ''}>Deseo</button>
            </div>

            {/* --- Gráfico de Barras Apiladas --- */}
            <div className="chart-wrapper" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--text-muted-dark)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--surface-dark)',
                                border: 'none',
                                borderRadius: '8px'
                            }}
                            formatter={formatCurrency}
                        />
                        <Legend wrapperStyle={{ fontSize: '13px' }}/>
                        
                        {/* Filtramos las barras que mostramos */}
                        {(natureFilter === 'Todos' || natureFilter === 'Deber') && 
                            <Bar dataKey="Deber" stackId="a" fill={NATURE_COLORS.Deber} />}
                        
                        {(natureFilter === 'Todos' || natureFilter === 'Necesidad') && 
                            <Bar dataKey="Necesidad" stackId="a" fill={NATURE_COLORS.Necesidad} />}
                        
                        {(natureFilter === 'Todos' || natureFilter === 'Deseo') && 
                            <Bar dataKey="Deseo" stackId="a" fill={NATURE_COLORS.Deseo} />}
                            
                        {(natureFilter === 'Todos' || natureFilter === 'Sin Asignar') && 
                            <Bar dataKey="Sin Asignar" stackId="a" fill={NATURE_COLORS['Sin Asignar']} />}
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            {/* --- Lista de Categorías Principales --- */}
            <h4 className="list-header">Categorías Principales ({natureFilter})</h4>
            <div className="category-bar-list">
                {categoryListData.length === 0 ? (
                    <p>No hay gastos de esta naturaleza en el período.</p>
                ) : (
                    categoryListData.map(item => (
                        <div key={item.name} className="category-bar-item">
                            <div className="category-bar-header">
                                <span>{item.name}</span>
                                <span>{formatCurrency(item.value)}</span>
                            </div>
                            <div className="category-bar-container">
                                <div 
                                    className="category-bar-fill"
                                    style={{ 
                                        width: `${item.percentage}%`,
                                        // Usamos el color de la categoría si 'Todos' está activo,
                                        // o el color de la naturaleza si se está filtrando
                                        backgroundColor: natureFilter === 'Todos' 
                                            ? item.color 
                                            : NATURE_COLORS[natureFilter]
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GastoPorNaturalezaReport;