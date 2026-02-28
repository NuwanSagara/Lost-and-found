import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostLost from './pages/PostLost';
import PostFound from './pages/PostFound';
import Search from './pages/Search';
import Chat from './pages/Chat';
import Home from './pages/Home';

// Placeholder Pages
const Notifications = () => <div className="p-8 text-center text-2xl">Notifications Center</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />

            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<Search />} />

                {/* Private Routes */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/post-lost" element={<PostLost />} />
                  <Route path="/post-found" element={<PostFound />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chat/:id" element={<Chat />} />
                  {/* Additional private routes will go here (Chats, Claims, Item Details) */}
                </Route>
              </Routes>
            </main>

            <footer className="bg-white border-t border-gray-200 mt-auto">
              <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} CampusFound. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
