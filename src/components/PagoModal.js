import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext';
import './Modal.css';
import './TransactionModal.css';

const PagoModal = ({ closeModal }) => {
    const { accounts, categories, refreshAllData } = useData();
    const [loading, setLoading] = useState(false);

    // Estado del formulario
    const [type, setType] = useState('Gasto');
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [frequency, setFrequency] = useState('mensual');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [dayOfMonth, setDayOfMonth] = useState(1);
    const [dayOfWeek, setDayOfWeek] = useState(0); // 0 = Domingo
    const [note, setNote] = useState('');

    const filteredCategories = categories.filter(c => c.type === type);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Validar campos
        const parsedAmount = parseFloat(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            alert("El monto debe ser un número positivo.");
            setLoading(false);
            return;
        }

        // 2. Preparar el objeto para Supabase
        const newData = {
            user_id: user.id,
            account_id: accountId,
            category_id: categoryId,
            amount: parsedAmount,
            type: type,
            note: note,
            frequency: frequency,
            start_date: startDate,
            next_due_date: startDate, // Para este proyecto, la 'fecha de inicio' es la 'próxima fecha de pago'
            day_of_month: null,
            day_of_week: null,
        };

        // 3. Asignar día condicionalmente
        if (frequency === 'semanal') {
            newData.day_of_week = parseInt(dayOfWeek);
        } else if (frequency === 'mensual' || frequency === 'quincenal' || frequency === 'anual') {
            const dom = parseInt(dayOfMonth);
            if (dom < 1 || dom > 31) {
                alert("El día del mes debe estar entre 1 y 31.");
                setLoading(false);
                return;
            }
            newData.day_of_month = dom;
        }
        
        // 4. Enviar a Supabase
        const { error } = await supabase.from('scheduled_transactions').insert(newData);

        if (error) {
            alert(error.message);
        } else {
            alert('¡Pago planificado guardado con éxito!');
            await refreshAllData();
            closeModal();
        }
        setLoading(false);
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Planificar {type === 'Gasto' ? 'Gasto' : 'Ingreso'}</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>

                {/* Pestañas de Gasto/Ingreso */}
                <div className="modal-tabs">
                    <button 
                        className={`tab-button ${type === 'Gasto' ? 'active' : ''}`} 
                        onClick={() => setType('Gasto')}>
                        Gasto
                    </button>
                    <button 
                        className={`tab-button ${type === 'Ingreso' ? 'active' : ''}`} 
                        onClick={() => setType('Ingreso')}>
                        Ingreso
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Monto</label>
                        <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Categoría</label>
                        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                            <option value="">Seleccionar...</option>
                            {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Cuenta</label>
                        <select value={accountId} onChange={e => setAccountId(e.target.value)} required>
                            <option value="">Seleccionar...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Frecuencia</label>
                        <select value={frequency} onChange={e => setFrequency(e.target.value)}>
                            <option value="mensual">Mensual</option>
                            <option value="quincenal">Quincenal</option>
                            <option value="semanal">Semanal</option>
                            <option value="anual">Anual</option>
                            <option value="diario">Diario</option>
                        </select>
                    </div>

                    {/* --- Campos Condicionales --- */}
                    {frequency === 'semanal' && (
                        <div className="form-group">
                            <label>Día de la semana</label>
                            <select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                                <option value="0">Domingo</option>
                                <option value="1">Lunes</option>
                                <option value="2">Martes</option>
                                <option value="3">Miércoles</option>
                                <option value="4">Jueves</option>
                                <option value="5">Viernes</option>
                                <option value="6">Sábado</option>
                            </select>
                        </div>
                    )}
                    
                    {(frequency === 'mensual' || frequency === 'quincenal' || frequency === 'anual') && (
                        <div className="form-group">
                            <label>Día del mes (1-31)</label>
                            <input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} required />
                        </div>
                    )}
                    {/* --- Fin Campos Condicionales --- */}

                    <div className="form-group">
                        <label>Fecha de inicio (primer pago)</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Nota (Opcional)</label>
                        <input type="text" placeholder="Ej: Pago de Internet" value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Guardando...' : 'Guardar Pago'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PagoModal;