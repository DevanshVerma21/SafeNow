import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import HamburgerMenu from '../layout/HamburgerMenu';
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState('emergency-alerts');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    {
      id: 'emergency-alerts',
      name: 'Emergency Alerts Report',
      description: 'Comprehensive report of all emergency alerts including response times and outcomes',
      icon: ExclamationTriangleIcon,
      color: 'red'
    },
    {
      id: 'response-times',
      name: 'Response Times Analysis',
      description: 'Analysis of emergency response times by type, location, and responder',
      icon: ClockIcon,
      color: 'blue'
    },
    {
      id: 'user-activity',
      name: 'User Activity Report',
      description: 'Report on user registrations, activity levels, and engagement metrics',
      icon: UserGroupIcon,
      color: 'green'
    },
    {
      id: 'geographic-analysis',
      name: 'Geographic Analysis',
      description: 'Geographic distribution of alerts and response coverage areas',
      icon: MapPinIcon,
      color: 'purple'
    },
    {
      id: 'performance-metrics',
      name: 'Performance Metrics',
      description: 'Overall system performance and efficiency metrics',
      icon: ChartBarIcon,
      color: 'orange'
    }
  ];

  useEffect(() => {
    generateReport();
  }, [selectedReport, dateRange]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(dateRange)
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        // Generate demo data based on report type
        setReportData(generateDemoData(selectedReport));
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData(generateDemoData(selectedReport));
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = (reportType) => {
    const baseData = {
      generatedAt: new Date().toISOString(),
      dateRange,
      summary: {}
    };

    switch (reportType) {
      case 'emergency-alerts':
        return {
          ...baseData,
          summary: {
            totalAlerts: 89,
            resolvedAlerts: 84,
            averageResponseTime: 4.2,
            criticalAlerts: 12
          },
          data: [
            {
              id: 1,
              type: 'Medical',
              severity: 'High',
              location: 'Mumbai Central',
              responseTime: 3.5,
              status: 'Resolved',
              responder: 'Dr. Priya Sharma',
              timestamp: '2025-10-09T10:30:00Z'
            },
            {
              id: 2,
              type: 'Fire',
              severity: 'Critical',
              location: 'Bandra West',
              responseTime: 2.8,
              status: 'Resolved',
              responder: 'Fire Chief Suresh',
              timestamp: '2025-10-09T09:15:00Z'
            },
            {
              id: 3,
              type: 'Police',
              severity: 'Medium',
              location: 'Andheri East',
              responseTime: 5.2,
              status: 'In Progress',
              responder: 'Inspector Vikram',
              timestamp: '2025-10-09T11:00:00Z'
            }
          ]
        };

      case 'response-times':
        return {
          ...baseData,
          summary: {
            averageResponseTime: 4.2,
            fastestResponse: 1.8,
            slowestResponse: 8.5,
            targetResponseTime: 5.0
          },
          data: {
            byType: {
              'Medical': 3.8,
              'Fire': 3.2,
              'Police': 4.8,
              'Natural Disaster': 6.1
            },
            byLocation: {
              'Mumbai': 3.9,
              'Delhi': 4.2,
              'Bangalore': 4.6,
              'Chennai': 4.1
            },
            trends: [
              { date: '2025-10-05', avgTime: 4.5 },
              { date: '2025-10-06', avgTime: 4.1 },
              { date: '2025-10-07', avgTime: 3.8 },
              { date: '2025-10-08', avgTime: 4.3 },
              { date: '2025-10-09', avgTime: 4.0 }
            ]
          }
        };

      case 'user-activity':
        return {
          ...baseData,
          summary: {
            totalUsers: 247,
            newRegistrations: 23,
            activeUsers: 189,
            retentionRate: 76.5
          },
          data: {
            registrations: [
              { date: '2025-10-05', count: 8 },
              { date: '2025-10-06', count: 12 },
              { date: '2025-10-07', count: 5 },
              { date: '2025-10-08', count: 15 },
              { date: '2025-10-09', count: 9 }
            ],
            byRole: {
              'Citizens': 201,
              'Responders': 38,
              'Admins': 8
            },
            engagement: {
              'Daily Active': 189,
              'Weekly Active': 225,
              'Monthly Active': 247
            }
          }
        };

      default:
        return baseData;
    }
  };

  const exportReport = (format) => {
    // Simulate export functionality
    const reportName = reportTypes.find(r => r.id === selectedReport)?.name || 'Report';
    const fileName = `${reportName}_${dateRange.startDate}_to_${dateRange.endDate}.${format}`;
    
    // In a real app, this would trigger actual file download
    alert(`Exporting ${fileName}...`);
  };

  const ReportSummary = () => {
    if (!reportData?.summary) return null;

    const summaryCards = Object.entries(reportData.summary).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    }));

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {summaryCards.map(({ key, value, label }, index) => (
          <motion.div
            key={key}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-2">{label}</h3>
            <p className="text-lg md:text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
              {key.includes('Time') && typeof value === 'number' && 'm'}
              {key.includes('Rate') && '%'}
            </p>
          </motion.div>
        ))}
      </div>
    );
  };

  const ReportContent = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-12 shadow-lg border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-4 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm md:text-base">Generating report...</p>
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="bg-white rounded-2xl p-6 md:p-8 lg:p-12 shadow-lg border border-gray-200 text-center">
          <ClipboardDocumentListIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm md:text-base">Select a report type to generate</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 md:space-y-6">
        <ReportSummary />
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">
                  {reportTypes.find(r => r.id === selectedReport)?.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Generated on {new Date(reportData.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportReport('pdf')}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 min-h-[44px] touch-manipulation bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm md:text-base w-full sm:w-auto"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Export PDF</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => exportReport('xlsx')}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 min-h-[44px] touch-manipulation bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm md:text-base w-full sm:w-auto"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Export Excel</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.print()}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 min-h-[44px] touch-manipulation bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white rounded-lg font-medium transition-colors text-sm md:text-base w-full sm:w-auto"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Print Report</span>
                </motion.button>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {selectedReport === 'emergency-alerts' && reportData.data && (
              <>
                {/* Mobile Card Layout */}
                <div className="block lg:hidden space-y-4">
                  {reportData.data.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Alert #{alert.id}</p>
                          <p className="text-sm text-gray-600">{alert.type}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Location</p>
                          <p className="text-gray-900">{alert.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Response Time</p>
                          <p className="text-gray-900">{alert.responseTime}m</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Status</p>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                            alert.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Responder</p>
                          <p className="text-gray-900">{alert.responder}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Alert ID</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Severity</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Response Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Responder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.data.map((alert, index) => (
                        <tr key={alert.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="py-3 px-4">#{alert.id}</td>
                          <td className="py-3 px-4">{alert.type}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              alert.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4">{alert.location}</td>
                          <td className="py-3 px-4">{alert.responseTime}m</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              alert.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">{alert.responder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {selectedReport === 'response-times' && reportData.data && (
              <div className="space-y-6 md:space-y-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 text-sm md:text-base">Response Times by Emergency Type</h4>
                  <div className="space-y-3">
                    {Object.entries(reportData.data.byType).map(([type, time]) => (
                      <motion.div 
                        key={type} 
                        whileHover={{ scale: 1.01 }}
                        className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-700 text-sm md:text-base">{type}</span>
                        <span className="text-gray-900 font-semibold text-sm md:text-base">{time} minutes</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-4 text-sm md:text-base">Response Times by Location</h4>
                  <div className="space-y-3">
                    {Object.entries(reportData.data.byLocation).map(([location, time]) => (
                      <motion.div 
                        key={location} 
                        whileHover={{ scale: 1.01 }}
                        className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-700 text-sm md:text-base">{location}</span>
                        <span className="text-gray-900 font-semibold text-sm md:text-base">{time} minutes</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'user-activity' && reportData.data && (
              <div className="space-y-6 md:space-y-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-4 text-sm md:text-base">User Distribution by Role</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(reportData.data.byRole).map(([role, count]) => (
                      <motion.div 
                        key={role} 
                        whileHover={{ scale: 1.02 }}
                        className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-700 text-sm md:text-base">{role}</span>
                        <span className="text-gray-900 font-semibold text-sm md:text-base">{count} users</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-4 text-sm md:text-base">User Engagement</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(reportData.data.engagement).map(([period, count]) => (
                      <motion.div 
                        key={period} 
                        whileHover={{ scale: 1.02 }}
                        className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-medium text-gray-700 text-sm md:text-base">{period}</span>
                        <span className="text-gray-900 font-semibold text-sm md:text-base">{count} users</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <HamburgerMenu />
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 text-sm md:text-base mt-1">Generate comprehensive reports on system performance and activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection & Filters */}
      <div className="bg-white rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Report Type Selection */}
          <div className="lg:col-span-2">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Select Report Type</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {reportTypes.map((report) => {
                const IconComponent = report.icon;
                return (
                  <motion.button
                    key={report.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedReport(report.id)}
                    className={`p-4 md:p-6 rounded-xl border-2 transition-all text-left min-h-[120px] touch-manipulation ${
                      selectedReport === report.id
                        ? `border-${report.color}-500 bg-${report.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <IconComponent className={`w-5 h-5 md:w-6 md:h-6 ${
                        selectedReport === report.id ? `text-${report.color}-600` : 'text-gray-600'
                      }`} />
                      <h4 className={`font-semibold text-sm md:text-base ${
                        selectedReport === report.id ? `text-${report.color}-900` : 'text-gray-900'
                      }`}>
                        {report.name}
                    </h4>
                    </div>
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{report.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="lg:col-span-1">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Date Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-3 min-h-[48px] touch-manipulation border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateReport}
                className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 py-3 min-h-[48px] touch-manipulation rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm md:text-base"
              >
                <ClipboardDocumentListIcon className="w-4 h-4 md:w-5 md:h-5" />
                <span>Generate Report</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <ReportContent />
    </div>
  );
};

export default Reports;