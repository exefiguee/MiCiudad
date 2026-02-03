import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Acá iremos agregando las rutas de cada categoría */}
      </Routes>
    </Router>
  );
}

export default App;