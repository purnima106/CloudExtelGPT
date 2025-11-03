/**
 * DataPage Component - Main page for Excel file upload and data management
 * 
 * This component provides:
 * 1. Drag-and-drop file upload interface
 * 2. File preview after upload
 * 3. Integration with DataDashboard for visualization
 * 
 * DEPENDENCIES:
 * - services/api.js → uploadExcelFile(), getDataPreview() for backend communication
 * - components/DataDashboard.jsx → Displays visualization builder after upload
 * - components/Sidebar.jsx → Navigation sidebar
 * 
 * FLOW:
 * User uploads file → API call → Display preview → Show DataDashboard with metadata
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import DataDashboard from '../components/DataDashboard';
import { uploadExcelFile } from '../services/api';

const DataPage = () => {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [fileMetadata, setFileMetadata] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile) => {
    setError(null);
    setUploadSuccess(false);
    
    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Invalid file type. Please upload .xlsx, .xls, or .csv files.');
      return;
    }
    
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 50MB.');
      return;
    }
    
    setFile(selectedFile);
  }, []);

  // Handle file upload to backend
  const handleUpload = useCallback(async () => {
    // UI-only mode: no backend calls
    setIsUploading(true);
    setError('Feature disabled: backend is turned off in UI-only mode.');
    setUploadSuccess(false);
    setTimeout(() => setIsUploading(false), 400);
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  // Reset state
  const handleReset = useCallback(() => {
    setFile(null);
    setFileId(null);
    setFileMetadata(null);
    setPreviewData(null);
    setError(null);
    setUploadSuccess(false);
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <Sidebar />
      
      <div className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Data Management
            </h1>
            <p className="text-gray-600">
              Upload Excel files to analyze and visualize your data
            </p>
          </div>

          {/* Upload Section */}
          {!fileMetadata && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                {file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <FileSpreadsheet className="w-16 h-16 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
                      >
                        {isUploading ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload File
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={isUploading}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                      >
                        <X className="w-5 h-5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="w-16 h-16 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-800 mb-2">
                        Drag and drop your Excel file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                    </div>
                    <label className="inline-block mt-4">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      <span className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl inline-block hover:scale-105">
                        Select File
                      </span>
                    </label>
                    <p className="text-xs text-gray-400 mt-4">
                      Supports .xlsx, .xls, .csv files up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-sm">
                    File uploaded successfully! Processing metadata...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* In UI-only mode we keep the upload UI but don't show dashboard */}
        </div>
      </div>
    </div>
  );
};

export default DataPage;
