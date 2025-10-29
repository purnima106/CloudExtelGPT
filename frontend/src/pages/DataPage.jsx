import React from 'react';
import Sidebar from '../components/Sidebar';

const DataPage = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Data Management</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Data management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default DataPage;

