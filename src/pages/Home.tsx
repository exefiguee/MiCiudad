import { Link } from 'react-router-dom';
import type { Category } from '../types';
import './Home.css';

const categories: Category[] = [
  { id: '1', name: 'Delivery', icon: '🛵', path: '/delivery', color: '#FF6B6B' },
  { id: '2', name: 'Remises', icon: '🚗', path: '/remises', color: '#4ECDC4' },
  { id: '3', name: 'Transporte', icon: '🚌', path: '/transporte', color: '#45B7D1' },
  { id: '4', name: 'Oficios', icon: '🔧', path: '/oficios', color: '#FFA07A' },
  { id: '5', name: 'Alojamiento', icon: '🏨', path: '/alojamiento', color: '#98D8C8' },
  { id: '6', name: 'Servicios', icon: '🏥', path: '/servicios', color: '#F7DC6F' },
  { id: '7', name: 'Gastronomía', icon: '🍽️', path: '/gastronomia', color: '#BB8FCE' },
  { id: '8', name: 'Entretenimiento', icon: '🎉', path: '/entretenimiento', color: '#85C1E2' },
];

function Home() {
  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Mi Ciudad</h1>
        <p>Todo lo que necesitás en un solo lugar</p>
      </header>

      <div className="categories-grid">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className="category-card"
            style={{ borderColor: category.color }}
          >
            <div className="category-icon" style={{ backgroundColor: category.color }}>
              {category.icon}
            </div>
            <h3>{category.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;