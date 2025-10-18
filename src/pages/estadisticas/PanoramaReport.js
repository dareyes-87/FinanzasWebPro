import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
// 1. Quité 'startOfDay' y 'endOfDay' que no se usaban
import { subDays, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- COMPONENTE DEL REPORTE PANORAMA ---
const PanoramaReport = () => {
    const { transactions, scheduledTransactions, loading } = useData();

    // 2. CORRECCIÓN: Asegúrate de recibir las nuevas variables aquí
    const { 
        proximosPagos, 
        proximosIngresos, 
        gastosPasados,
        ingresosPasados,
        pronosticoData 
    } = useMemo(() => {
        const now = new Date();
        const endDate = addDays(now, 30);
        
        // Pagos/Ingresos Planificados en los próximos 30 días
        const pagos = scheduledTransactions.filter(st => {
            const dueDate = new Date(st.next_due_date);
            return st.is_active && dueDate >= now && dueDate <= endDate;
        });
        
        const totalPagos = pagos
            .filter(p => p.type === 'Gasto')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);
            
        const totalIngresosProgramados = pagos
            .filter(p => p.type === 'Ingreso')
            .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        // Para "Gastos/Ingresos Esperados" (NO planificados)
        const pastStartDate = subDays(now, 30);
        const scheduledCategoryIds = new Set(pagos.map(p => p.category_id));

        const gastosPasados = transactions
            .filter(tx => 
                tx.type === 'Gasto' && 
                new Date(tx.date) >= pastStartDate &&
                !scheduledCategoryIds.has(tx.category_id)
            )
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        const ingresosPasados = transactions
            .filter(tx => 
                tx.type === 'Ingreso' && 
                new Date(tx.date) >= pastStartDate &&
                !scheduledCategoryIds.has(tx.category_id)
            )
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

        const data = [
            { name: 'Pagos Prog.', Negativo: totalPagos },
            { name: 'Gasto Esperado', Negativo: gastosPasados },
            { name: 'Ingresos Esp.', Positivo: ingresosPasados + totalIngresosProgramados },
        ];
        
        // 3. CORRECCIÓN: Retorna las variables que faltaban
        return { 
            proximosPagos: totalPagos, 
            proximosIngresos: totalIngresosProgramados,
            gastosPasados: gastosPasados,
            ingresosPasados: ingresosPasados,
            pronosticoData: data,
        };
    }, [transactions, scheduledTransactions]);

    if (loading) {
        return <div className="stats-card"><p>Calculando panorama...</p></div>;
    }

    return (
        <>
            {/* --- Tarjeta 1: Pagos planificados por categoría --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Pagos planificados por categoría</h4>
                    <p>¿Cuáles son mis facturas/pagos principales en el próximo período?</p>
                </div>
                <p className="stats-label">PRÓXIMOS 30 DÍAS</p>
                <p className="stats-big-number">Q{proximosPagos.toFixed(2)}</p>
                {/* Aquí iría una lista/gráfica de pastel de 'proximosPagos' por categoría */}
            </div>

            {/* --- Tarjeta 2: Cronograma de pagos planificados --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Cronograma de pagos planificados</h4>
                    <p>¿Cuándo y cuánto debo pagar en el próximo período?</p>
                </div>
                <p className="stats-label">PRÓXIMOS 30 DÍAS</p>
                <p className="stats-big-number">Q{proximosPagos.toFixed(2)}</p>
                {/* Aquí iría una lista de 'proximosPagos' por fecha */}
            </div>
            
            {/* --- Tarjeta 3: Pronóstico de saldo --- */}
            <div className="stats-card">
                <div className="stats-header">
                    <h4>Pronóstico de saldo</h4>
                    <p>¿Tendré suficiente dinero para pagar mis cuentas?</p>
                </div>
                <p className="stats-label">PRÓXIMOS 30 DÍAS</p>
                
                {/* 4. CORRECCIÓN: Arreglé el typo </Lp> por </p> */}
                <p className="stats-big-number">Q{( (proximosIngresos + ingresosPasados) - (proximosPagos + gastosPasados) ).toFixed(2)}</p>
                
                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={pronosticoData} stackOffset="sign">
                             <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                             <YAxis hide />
                             <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'var(--surface-dark)', 
                                    border: 'none', 
                                    borderRadius: '8px'
                                }}
                                formatter={(value) => `Q${Math.abs(value).toFixed(2)}`}
                            />
                            <Legend />
                            <Bar dataKey="Positivo" fill="var(--green-accent)" stackId="stack" />
                            <Bar dataKey="Negativo" fill="var(--red-accent)" stackId="stack" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
};

export default PanoramaReport;