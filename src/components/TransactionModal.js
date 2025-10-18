import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext'; // <-- 1. Importa el Hook
import './Modal.css';
import './TransactionModal.css';

// 2. Quita 'onSuccess' de las props
const TransactionModal = ({ closeModal }) => {
    // 3. Obtén datos y la función de refrescar del contexto
    const { accounts, categories, refreshAllData } = useData();
    
    const [activeTab, setActiveTab] = useState('Gasto');
    const [loading, setLoading] = useState(false);

    // Estados del formulario
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');

    // 4. BORRA el 'useEffect' que cargaba cuentas y categorías. Ya no se necesita.

    // 5. Esta lógica ahora usa 'categories' del contexto
    const filteredCategories = categories.filter(cat => cat.type === activeTab);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        const parsedAmount = parseFloat(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            alert('El monto debe ser un número mayor a 0');
            setLoading(false);
            return;
        }

        try {
            if (activeTab === 'Transferencia') {
                if (fromAccountId === toAccountId) {
                    throw new Error('Las cuentas de origen y destino no pueden ser la misma.');
                }
                const { error } = await supabase.from('transfers').insert({
                    user_id: user.id,
                    from_account_id: fromAccountId,
                    to_account_id: toAccountId,
                    amount: parsedAmount,
                    date,
                    note
                });
                if (error) throw error;

            } else {
                const { error } = await supabase.from('transactions').insert({
                    user_id: user.id,
                    account_id: accountId,
                    category_id: categoryId,
                    amount: parsedAmount,
                    type: activeTab,
                    date,
                    note
                });
                if (error) throw error;
            }
            
            alert('¡Guardado con éxito!');
            await refreshAllData(); // <-- 6. Llama al contexto para recargar TODO
            closeModal(); // Cierra el modal
            
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{activeTab === 'Transferencia' ? 'Nueva Transferencia' : `Nuevo ${activeTab}`}</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>
                
                <div className="modal-tabs">
                    <button className={`tab-button ${activeTab === 'Gasto' ? 'active' : ''}`} onClick={() => setActiveTab('Gasto')}>Gasto</button>
                    <button className={`tab-button ${activeTab === 'Ingreso' ? 'active' : ''}`} onClick={() => setActiveTab('Ingreso')}>Ingreso</button>
                    <button className={`tab-button ${activeTab === 'Transferencia' ? 'active' : ''}`} onClick={() => setActiveTab('Transferencia')}>Transferencia</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {activeTab !== 'Transferencia' && (
                        <>
                            <div className="form-group">
                                <label>Monto</label>
                                <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Cuenta</label>
                                <select value={accountId} onChange={e => setAccountId(e.target.value)} required>
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Categoría</label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                    <option value="">Seleccionar...</option>
                                    {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {activeTab === 'Transferencia' && (
                         <>
                            <div className="form-group">
                                <label>Monto</label>
                                <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Desde la cuenta</label>
                                <select value={fromAccountId} onChange={e => setFromAccountId(e.target.value)} required>
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Hacia la cuenta</label>
                                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} required>
                                    <option value="">Seleccionar...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                     <div className="form-group">
                        <label>Nota (Opcional)</label>
                        <input type="text" placeholder="Descripción..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;