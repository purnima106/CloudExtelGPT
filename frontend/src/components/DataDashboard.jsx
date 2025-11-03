/**
 * DataDashboard Component - Visualization Builder and Chart Renderer
 * 
 * This component provides:
 * 1. Data preview table showing uploaded Excel data
 * 2. Column metadata display (types, unique values, etc.)
 * 3. Interactive visualization builder UI (chart type, axes, aggregation)
 * 4. Smart suggestions based on data types
 * 5. ECharts integration for rendering interactive charts
 * 
 * DEPENDENCIES:
 * - services/api.js → generateVisualization() to get chart data from backend
 * - echarts + echarts-for-react: For rendering interactive charts
 * 
 * FLOW:
 * Display metadata → User selects chart options → API call → Render chart with ECharts
 * 
 * USED BY:
 * - DataPage.jsx → Renders this component after file upload
 */

import React, { useState, useCallback, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  BarChart3, PieChart, LineChart, ScatterChart, 
  TrendingUp, X, Play, RefreshCw, Download,
  ChevronDown, ChevronUp, Table, Info
} from 'lucide-react';

const DataDashboard = ({ fileId, fileMetadata, previewData, onReset }) => {
  const [selectedChartType, setSelectedChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [categoryColumn, setCategoryColumn] = useState('');
  const [valueColumn, setValueColumn] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  const [groupBy, setGroupBy] = useState('');
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);

  // Smart suggestions: Auto-select appropriate columns based on data types
  useEffect(() => {
    if (fileMetadata && fileMetadata.columns) {
      const columns = fileMetadata.columns;
      
      // Find categorical and numeric columns for suggestions
      const categoricalCols = columns.filter(col => 
        col.type === 'categorical' || col.type === 'text'
      );
      const numericCols = columns.filter(col => col.type === 'numeric');
      
      // Auto-suggest: First categorical as X-axis, first numeric as Y-axis
      if (categoricalCols.length > 0 && numericCols.length > 0) {
        if (selectedChartType === 'bar' || selectedChartType === 'line') {
          if (!xAxis) setXAxis(categoricalCols[0].name);
          if (!yAxis) setYAxis(numericCols[0].name);
        } else if (selectedChartType === 'pie') {
          if (!categoryColumn) setCategoryColumn(categoricalCols[0].name);
          if (!valueColumn) setValueColumn(numericCols[0].name);
        } else if (selectedChartType === 'scatter') {
          if (!xAxis && numericCols.length >= 2) setXAxis(numericCols[0].name);
          if (!yAxis && numericCols.length >= 2) setYAxis(numericCols[1].name);
        }
      }
    }
  }, [fileMetadata, selectedChartType]);

  // Generate visualization
  const handleGenerateChart = useCallback(async () => {
    // UI-only mode: no backend calls
    setIsLoading(false);
    setError('Feature disabled: backend is turned off in UI-only mode.');
  }, []);

  // Get ECharts option based on chart type
  const getChartOption = () => {
    if (!chartData) return null;

    const commonOptions = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#333',
        textStyle: { color: '#fff' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
    };

    if (chartData.chart_type === 'bar') {
      return {
        ...commonOptions,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: chartData.categories,
          axisLabel: { rotate: chartData.categories.length > 10 ? 45 : 0 },
        },
        yAxis: { type: 'value' },
        series: chartData.series.map(s => ({
          ...s,
          emphasis: { focus: 'series' },
        })),
        legend: chartData.series.length > 1 ? { data: chartData.series.map(s => s.name) } : undefined,
      };
    }

    if (chartData.chart_type === 'pie') {
      return {
        ...commonOptions,
        series: [{
          type: 'pie',
          radius: '60%',
          data: chartData.data,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        }],
      };
    }

    if (chartData.chart_type === 'line') {
      return {
        ...commonOptions,
        tooltip: { trigger: 'axis' },
        xAxis: {
          type: 'category',
          data: chartData.categories,
        },
        yAxis: { type: 'value' },
        series: chartData.series.map(s => ({
          ...s,
          smooth: true,
        })),
        legend: chartData.series.length > 1 ? { data: chartData.series.map(s => s.name) } : undefined,
      };
    }

    if (chartData.chart_type === 'scatter') {
      return {
        ...commonOptions,
        tooltip: { trigger: 'item' },
        xAxis: { type: 'value' },
        yAxis: { type: 'value' },
        series: chartData.series.map(s => ({
          ...s,
          symbolSize: 8,
        })),
        legend: chartData.series.length > 1 ? { data: chartData.series.map(s => s.name) } : undefined,
      };
    }

    return null;
  };

  // Get columns by type
  const getColumnsByType = (type) => {
    if (!fileMetadata?.columns) return [];
    return fileMetadata.columns.filter(col => col.type === type);
  };

  const categoricalColumns = getColumnsByType('categorical');
  const numericColumns = getColumnsByType('numeric');
  const allColumns = fileMetadata?.columns || [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-md">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {fileMetadata?.sheet_name || 'Data Dashboard'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {fileMetadata?.total_rows} rows × {fileMetadata?.total_columns} columns
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Upload New File
        </button>
      </div>

      {/* Data Preview Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Data Preview</h3>
          </div>
          {showPreview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {showPreview && previewData && (
          <div className="border-t border-gray-200 overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {Object.keys(previewData[0] || {}).map((key) => (
                    <th key={key} className="px-4 py-3 text-left font-semibold text-gray-700 border-b">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    {Object.values(row).map((value, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 text-gray-600">
                        {value !== null && value !== undefined ? String(value) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Column Metadata Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowMetadata(!showMetadata)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Column Information</h3>
          </div>
          {showMetadata ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {showMetadata && fileMetadata?.columns && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fileMetadata.columns.map((col) => (
                <div key={col.name} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-800">{col.name}</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      col.type === 'numeric' ? 'bg-blue-100 text-blue-700' :
                      col.type === 'categorical' ? 'bg-green-100 text-green-700' :
                      col.type === 'datetime' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {col.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Unique: {col.unique_count}</div>
                    {col.type === 'numeric' && (
                      <>
                        <div>Min: {col.min?.toLocaleString()}</div>
                        <div>Max: {col.max?.toLocaleString()}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Visualization Builder */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Create Visualization</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Chart Configuration */}
          <div className="space-y-6">
            {/* Chart Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Chart Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'bar', icon: BarChart3, label: 'Bar Chart' },
                  { type: 'pie', icon: PieChart, label: 'Pie Chart' },
                  { type: 'line', icon: LineChart, label: 'Line Chart' },
                  { type: 'scatter', icon: ScatterChart, label: 'Scatter Plot' },
                ].map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedChartType(type);
                      setChartData(null);
                      setError(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                      selectedChartType === type
                        ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${selectedChartType === type ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${selectedChartType === type ? 'text-blue-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Column Selection */}
            {selectedChartType === 'pie' ? (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category Column</label>
                  <select
                    value={categoryColumn}
                    onChange={(e) => setCategoryColumn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category column</option>
                    {categoricalColumns.map((col) => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Value Column</label>
                  <select
                    value={valueColumn}
                    onChange={(e) => setValueColumn(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select value column</option>
                    {numericColumns.map((col) => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">X-Axis</label>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select X-axis column</option>
                    {selectedChartType === 'scatter' ? (
                      numericColumns.map((col) => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))
                    ) : (
                      categoricalColumns.map((col) => (
                        <option key={col.name} value={col.name}>{col.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Y-Axis</label>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Y-axis column</option>
                    {numericColumns.map((col) => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Aggregation */}
            {selectedChartType !== 'scatter' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Aggregation</label>
                <select
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sum">Sum</option>
                  <option value="mean">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="median">Median</option>
                </select>
              </div>
            )}

            {/* Group By (for multi-series charts) */}
            {selectedChartType !== 'pie' && selectedChartType !== 'scatter' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Group By (Optional)
                </label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No grouping</option>
                  {categoricalColumns.map((col) => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateChart}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Chart
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Chart Display */}
          <div className="bg-gray-50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
            {chartData && getChartOption() ? (
              <div className="w-full h-full">
                <ReactECharts
                  option={getChartOption()}
                  style={{ height: '500px', width: '100%' }}
                  opts={{ renderer: 'svg' }}
                />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Configure your chart and click "Generate Chart"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataDashboard;
