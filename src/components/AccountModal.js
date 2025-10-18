import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext'; // <-- 1. Importa el Hook
import './Modal.css';

// 2. Quita 'refreshAccounts' de las props
const AccountModal = ({ closeModal }) => {
    const { refreshAllData } = useData(); // <-- 3. Obtén la función de refrescar
    const [name, setName] = useState('');
    const [institution, setInstitution] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase.from('accounts').insert({
            name,
            institution,
            opening_balance: parseFloat(openingBalance) || 0,
            user_id: user.id
        });

        if (error) {
            alert(error.message);
        } else {
            // 4. Llama al contexto para refrescar TODO
            await refreshAllData();
            closeModal(); // Cierra el modal
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Nueva Cuenta</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre de la cuenta</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Institución (Opcional)</label>
                        <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Saldo inicial</label>
                        <input type="number" step="0.01" placeholder="0.00" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Guardando...' : 'Guardar Cuenta'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AccountModal;