import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/common/Header'
import Footer from './components/common/Footer'
import Dashboard from './components/dashboard/Dashboard'
import AdminPanel from './components/admin/AdminPanel'

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen flex flex-col">
                    <Header />
                    <main className="flex-1 container mx-auto px-4 py-8">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/admin" element={<AdminPanel />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </Router>
        </AuthProvider>
    )
}

export default App
