import { useState } from 'react';
import { 
  agregarMenuItem, 
  actualizarMenuItem, 
  eliminarMenuItem,
  type MenuItem 
} from '../services/negociosService';
import './Negocio.css';

interface Props {
  negocioId: string;
  menu: MenuItem[];
  onMenuUpdate: (menu: MenuItem[]) => void;
}

const CATEGORIAS = [
  'Hamburguesas',
  'Pizzas',
  'Empanadas',
  'Lomitos',
  'Milanesas',
  'Papas',
  'Bebidas',
  'Postres',
  'Combos',
  'Otros'
];

function NegocioMenu({ negocioId, menu, onMenuUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    foto: '',
    categoria: 'Otros',
    disponible: true
  });

  const resetForm = () => {
    setForm({
      nombre: '',
      descripcion: '',
      precio: '',
      foto: '',
      categoria: 'Otros',
      disponible: true
    });
    setEditando(null);
    setShowForm(false);
  };

  const handleEdit = (item: MenuItem) => {
    setForm({
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio.toString(),
      foto: item.foto || '',
      categoria: item.categoria,
      disponible: item.disponible
    });
    setEditando(item);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio),
        foto: form.foto,
        categoria: form.categoria,
        disponible: form.disponible,
        orden: editando ? editando.orden : menu.length + 1
      };

      if (editando) {
        await actualizarMenuItem(negocioId, editando.id!, itemData);
        onMenuUpdate(menu.map(m => m.id === editando.id ? { ...m, ...itemData } : m));
      } else {
        const newId = await agregarMenuItem(negocioId, itemData);
        onMenuUpdate([...menu, { id: newId, ...itemData }]);
      }

      resetForm();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;

    try {
      await eliminarMenuItem(negocioId, item.id!);
      onMenuUpdate(menu.filter(m => m.id !== item.id));
    } catch (error) {
      console.error('Error eliminando:', error);
    }
  };

  const toggleDisponible = async (item: MenuItem) => {
    try {
      await actualizarMenuItem(negocioId, item.id!, { disponible: !item.disponible });
      onMenuUpdate(menu.map(m => m.id === item.id ? { ...m, disponible: !m.disponible } : m));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Agrupar por categoría
  const menuPorCategoria = menu.reduce((acc, item) => {
    if (!acc[item.categoria]) acc[item.categoria] = [];
    acc[item.categoria].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="menu-section">
      <div className="menu-header">
        <h2>🍔 Mi Menú</h2>
        <button onClick={() => setShowForm(true)} className="btn-add">
          ➕ Agregar Producto
        </button>
      </div>

      {/* Modal/Form */}
      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editando ? 'Editar Producto' : 'Nuevo Producto'}</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Hamburguesa Completa"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={e => setForm({...form, descripcion: e.target.value})}
                  placeholder="Ej: Con cheddar, bacon, lechuga..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={e => setForm({...form, precio: e.target.value})}
                    placeholder="5500"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({...form, categoria: e.target.value})}
                  >
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>URL de Foto (opcional)</label>
                <input
                  type="url"
                  value={form.foto}
                  onChange={e => setForm({...form, foto: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={form.disponible}
                    onChange={e => setForm({...form, disponible: e.target.checked})}
                  />
                  Disponible para venta
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      {menu.length === 0 ? (
        <div className="menu-empty">
          <span>🍽️</span>
          <p>Todavía no tenés productos</p>
          <button onClick={() => setShowForm(true)}>Agregar el primero</button>
        </div>
      ) : (
        <div className="menu-categorias">
          {Object.entries(menuPorCategoria).map(([categoria, items]) => (
            <div key={categoria} className="menu-categoria">
              <h3>{categoria}</h3>
              <div className="menu-items">
                {items.map(item => (
                  <div key={item.id} className={`menu-item ${!item.disponible ? 'no-disponible' : ''}`}>
                    {item.foto && (
                      <img src={item.foto} alt={item.nombre} className="item-foto" />
                    )}
                    <div className="item-info">
                      <h4>{item.nombre}</h4>
                      <p>{item.descripcion}</p>
                      <span className="item-precio">${item.precio.toLocaleString()}</span>
                    </div>
                    <div className="item-actions">
                      <button 
                        onClick={() => toggleDisponible(item)}
                        className={`btn-toggle ${item.disponible ? 'on' : 'off'}`}
                      >
                        {item.disponible ? '✅' : '❌'}
                      </button>
                      <button onClick={() => handleEdit(item)} className="btn-edit">
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(item)} className="btn-delete">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NegocioMenu;