import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useData } from '../contexts/DataContext'; // 1. Importamos el hook
import './Modal.css'; // Asegúrate de tener los estilos del modal
import { Loader2 } from 'lucide-react'; // Para el ícono de carga

// 2. Aceptamos 'editingCategory'
const CategoryModal = ({ closeModal, editingCategory }) => {
    // 3. Usamos el hook para refrescar
    const { refreshAllData } = useData(); 
    
    // Estados del formulario
    const [name, setName] = useState('');
    const [type, setType] = useState('Gasto');
    const [color, setColor] = useState('#94a3b8'); // Un gris mejor por defecto
    
    // --- NUEVO ESTADO PARA LA NATURALEZA ---
    const [nature, setNature] = useState('Necesidad'); 
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 4. Verificamos si estamos editando
    const isEditing = !!editingCategory;

    // 5. Rellenamos el formulario si estamos editando
    useEffect(() => {
        if (isEditing) {
            setName(editingCategory.name);
            setType(editingCategory.type);
            setColor(editingCategory.color || '#94a3b8');
            // Si la categoría que editamos ya tiene una naturaleza, la usamos
            setNature(editingCategory.nature || (editingCategory.type === 'Gasto' ? 'Necesidad' : 'Ingreso'));
        }
    }, [editingCategory, isEditing]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('No estás autenticado.');
            setLoading(false);
            return;
        }

        // 6. Determinar el valor final de 'nature'
        const finalNature = type === 'Ingreso' ? 'Ingreso' : nature;

        // 7. Preparar los datos
        const categoryData = {
            name,
            type,
            color,
            nature: finalNature, // ¡Guardamos la naturaleza!
            user_id: user.id
        };

        // 8. Decidir si es un INSERT o un UPDATE
        let query;
        if (isEditing) {
            query = supabase.from('categories').update(categoryData).eq('id', editingCategory.id);
        } else {
            query = supabase.from('categories').insert([categoryData]);
        }

        const { error: dbError } = await query;

        if (dbError) {
            setError(`Error: ${dbError.message}`);
        } else {
            // ¡Éxito!
            await refreshAllData(); // 9. Refrescamos los datos de toda la app
            closeModal(); // Cerramos el modal
        }
        setLoading(false);
    };

    // Usaremos los radios que te propuse antes, son más claros que el <select>
    return (
        <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Editar' : 'Nueva'} Categoría</h3>
                    <button onClick={closeModal} className="close-button">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {error && <p className="form-error">{error}</p>}
                    
                    <div className="form-group">
                        <label htmlFor="name">Nombre</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    
                    {/* Reemplazamos el <select> por radios */}
                    <div className="form-group">
                        <label>Tipo</label>
                        <div className="radio-group">
                            <label className={`radio-label ${type === 'Gasto' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="Gasto"
                                    checked={type === 'Gasto'}
                                    onChange={() => setType('Gasto')}
                                />
                                Gasto
                            </label>
                            <label className={`radio-label ${type === 'Ingreso' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="Ingreso"
                                    checked={type === 'Ingreso'}
                                    onChange={() => setType('Ingreso')}
                                />
                                Ingreso
                            </label>
                        </div>
                    </div>

                    {/* --- NUEVO CAMPO: NATURALEZA (Condicional) --- */}
                    {type === 'Gasto' && (
                        <div className="form-group">
                            <label>Naturaleza del Gasto</label>
                            <p className="form-hint">Clasifica este gasto para tus reportes.</p>
                            <div className="radio-group nature-group">
                                <label className={`radio-label nature ${nature === 'Deber' ? 'active' : ''}`}>
                                    <input type="radio" name="nature" value="Deber" checked={nature === 'Deber'} onChange={() => setNature('Deber')} />
                                    Deber <span className="nature-hint">(Ej: Hipoteca, Deudas)</span>
                                </label>
                                <label className={`radio-label nature ${nature === 'Necesidad' ? 'active' : ''}`}>
                                    <input type="radio" name="nature" value="Necesidad" checked={nature === 'Necesidad'} onChange={() => setNature('Necesidad')} />
                                    Necesidad <span className="nature-hint">(Ej: Supermercado, Luz)</span>
                                </label>
                                <label className={`radio-label nature ${nature === 'Deseo' ? 'active' : ''}`}>
                                    <input type="radio" name="nature" value="Deseo" checked={nature === 'Deseo'} onChange={() => setNature('Deseo')} />
                                    Deseo <span className="nature-hint">(Ej: Restaurantes, Cine)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="color">Color</label>
                        <input
                            type="color"
                            id="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="color-input" // Añadimos una clase para mejor estilo
                        />
                    </div>
                    
                    <div className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={closeModal} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <Loader2 size={20} className="spinner-icon" />
                            ) : (
                                isEditing ? 'Actualizar' : 'Crear Categoría'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;