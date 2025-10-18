import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Modal.css';

const CategoryModal = ({ closeModal, refreshCategories }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Gasto');
    const [color, setColor] = useState('#CCCCCC'); // Color por defecto
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('categories').insert({
            name,
            type,
            color,
            user_id: user.id
        });

        if (error) {
            alert(error.message);
        } else {
            refreshCategories();
            closeModal();
        }
        setLoading(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Nueva Categoría</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Tipo</label>
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option>Gasto</option>
                            <option>Ingreso</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Color</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ padding: '5px', height: '40px' }}/>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Guardando...' : 'Guardar Categoría'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;