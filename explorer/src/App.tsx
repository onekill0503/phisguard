import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Home } from './pages/Home';
import { AddressDetail } from './pages/AddressDetail';
import { TransactionDetail } from './pages/TransactionDetail';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="text-xl font-bold text-blue-600">
                BlockExplorer
              </Link>
              
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search by Address / Tx Hash"
                  className="w-96 px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/address/:address" element={<AddressDetail />} />
            <Route path="/tx/:hash" element={<TransactionDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;