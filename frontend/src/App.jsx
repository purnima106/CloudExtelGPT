import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import DataPage from './pages/DataPage';
import PDFPage from './pages/PDFPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/pdf" element={<PDFPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

