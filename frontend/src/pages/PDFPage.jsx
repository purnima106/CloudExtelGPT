import React from 'react';
import Sidebar from '../components/Sidebar';

const PDFPage = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-3xl font-bold mb-6">PDF Documents</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">PDF upload and management interface coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default PDFPage;

