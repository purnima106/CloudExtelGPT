import React from 'react';
import Sidebar from '../components/Sidebar';

const DashboardPage = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Total Conversations</h2>
            <p className="text-3xl font-bold text-blue-500">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Documents</h2>
            <p className="text-3xl font-bold text-green-500">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Data Sources</h2>
            <p className="text-3xl font-bold text-purple-500">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

