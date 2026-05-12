import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Welcome from './pages/Welcome';
import { AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Welcome />} />
                <Route path="/analyze" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default App;
