import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { adminAPI } from '../../api.jsx';
import UserSearchAutocomplete from '../UserSearchAutocomplete';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [overview, setOverview] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [surveyResponses, setSurveyResponses] = useState(null);
  const [wastePatterns, setWastePatterns] = useState(null);
  const [purchaseTrends, setPurchaseTrends] = useState(null);
  
  // Loading states for individual tabs
  const [loadingSurveyResponses, setLoadingSurveyResponses] = useState(false);
  const [loadingWastePatterns, setLoadingWastePatterns] = useState(false);
  const [loadingPurchaseTrends, setLoadingPurchaseTrends] = useState(false);
  
  // Track current survey filter
  const [currentSurveyFilter, setCurrentSurveyFilter] = useState('all');
  
  // Survey question view states
  const [surveyViewMode, setSurveyViewMode] = useState('summary'); // 'summary' or 'byQuestion'
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [questionResponses, setQuestionResponses] = useState(null);
  const [loadingQuestionResponses, setLoadingQuestionResponses] = useState(false);
  
  // Fake data management states
  const [fakeUsersCount, setFakeUsersCount] = useState(0);
  const [loadingFakeData, setLoadingFakeData] = useState(false);
  const [fakeDataMessage, setFakeDataMessage] = useState('');
  const [chartTimeframe, setChartTimeframe] = useState('daily');
  
  // Data management states
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchedUser, setSearchedUser] = useState(null);
  const [loadingUserSearch, setLoadingUserSearch] = useState(false);
  const [dataManagementMessage, setDataManagementMessage] = useState('');
  const [loadingDataOperation, setLoadingDataOperation] = useState(false);
  
  // User trends states
  const [trendsUser, setTrendsUser] = useState(null);
  const [userTrendsData, setUserTrendsData] = useState(null);
  const [loadingUserTrends, setLoadingUserTrends] = useState(false);
  const [userTrendsPeriod, setUserTrendsPeriod] = useState('week');
  const [userTrendsError, setUserTrendsError] = useState(null);

  useEffect(() => {
    loadOverviewData();
    loadFakeUsersCount();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const [overviewData, demographicsData] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getDemographics()
      ]);
      
      setOverview(overviewData.data);
      setDemographics(demographicsData.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading overview data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const loadSurveyResponses = async (stage = null) => {
    try {
      setLoadingSurveyResponses(true);
      const response = await adminAPI.getSurveyResponses(stage);
      setSurveyResponses(response.data);
      setCurrentSurveyFilter(stage || 'all');
      
      // Extract unique questions for the question selector
      const questionMap = new Map();
      response.data.forEach(item => {
        if (!questionMap.has(item.question_id)) {
          questionMap.set(item.question_id, {
            id: item.question_id,
            text: item.question_text
          });
        }
      });
      const questions = Array.from(questionMap.values());
      setAvailableQuestions(questions);
    } catch (err) {
      console.error('Error loading survey responses:', err);
      setError('Failed to load survey responses');
    } finally {
      setLoadingSurveyResponses(false);
    }
  };

  const loadQuestionResponses = async (questionId) => {
    if (!questionId) return;
    
    try {
      setLoadingQuestionResponses(true);
      const response = await adminAPI.getQuestionResponses(questionId, currentSurveyFilter === 'all' ? null : currentSurveyFilter);
      setQuestionResponses(response.data);
    } catch (err) {
      console.error('Error loading question responses:', err);
      setError('Failed to load question responses');
    } finally {
      setLoadingQuestionResponses(false);
    }
  };

  const loadWastePatterns = async () => {
    try {
      setLoadingWastePatterns(true);
      const response = await adminAPI.getWastePatterns();
      setWastePatterns(response.data);
    } catch (err) {
      console.error('Error loading waste patterns:', err);
      setError('Failed to load waste patterns');
    } finally {
      setLoadingWastePatterns(false);
    }
  };

  const loadPurchaseTrends = async () => {
    try {
      setLoadingPurchaseTrends(true);
      const response = await adminAPI.getPurchaseTrends();
      setPurchaseTrends(response.data);
    } catch (err) {
      console.error('Error loading purchase trends:', err);
      setError('Failed to load purchase trends');
    } finally {
      setLoadingPurchaseTrends(false);
    }
  };

  const loadFakeUsersCount = async () => {
    try {
      const response = await adminAPI.getFakeUsersCount();
      setFakeUsersCount(response.data.count);
    } catch (err) {
      console.error('Error loading fake users count:', err);
    }
  };

  const handleGenerateFakeData = async (count) => {
    try {
      setLoadingFakeData(true);
      setFakeDataMessage('');
      const response = await adminAPI.generateFakeData(count);
      setFakeDataMessage(`✅ ${response.data.message}`);
      await loadFakeUsersCount();
      await loadOverviewData(); // Refresh overview to show new users
    } catch (err) {
      console.error('Error generating fake data:', err);
      setFakeDataMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingFakeData(false);
    }
  };

  const handleCleanupFakeData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL fake users and their data? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoadingFakeData(true);
      setFakeDataMessage('');
      const response = await adminAPI.cleanupFakeData();
      setFakeDataMessage(`✅ ${response.data.message}`);
      await loadFakeUsersCount();
      await loadOverviewData(); // Refresh overview to show updated counts
    } catch (err) {
      console.error('Error cleaning up fake data:', err);
      setFakeDataMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingFakeData(false);
    }
  };

  const handleGenerateDtestTrendingData = async () => {
    try {
      setLoadingFakeData(true);
      setFakeDataMessage('⏳ Generating trending data for dtest user... This may take 1-2 minutes. Check the server terminal for progress updates.');
      const response = await adminAPI.generateDtestTrendingData();
      setFakeDataMessage(`✅ ${response.data.message} - ${response.data.data.purchases} purchases, ${response.data.data.consumptionLogs} consumption logs from ${response.data.data.startDate} to ${response.data.data.endDate}`);
      await loadOverviewData(); // Refresh overview to show updated counts
    } catch (err) {
      console.error('Error generating dtest trending data:', err);
      if (err.code === 'ECONNABORTED') {
        setFakeDataMessage(`❌ Request timed out. The operation may still be running on the server. Check the server logs.`);
      } else {
        setFakeDataMessage(`❌ Error: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoadingFakeData(false);
    }
  };

  // Data Management Functions
  const handleDeleteAllUsers = async () => {
    const confirmText = 'DELETE_ALL_USERS';
    const userInput = window.prompt(
      `⚠️ CRITICAL WARNING: This will PERMANENTLY DELETE ALL USERS and ALL their data.\n\nThis action CANNOT be undone!\n\nType "${confirmText}" to confirm this irreversible action:`
    );
    
    if (userInput !== confirmText) {
      setDataManagementMessage('❌ Operation cancelled - confirmation text did not match');
      return;
    }

    setLoadingDataOperation(true);
    setDataManagementMessage('');

    try {
      const response = await adminAPI.deleteAllUsers(confirmText);
      setDataManagementMessage(`✅ ${response.data.message}`);
      setSearchedUser(null); // Clear search results
      loadOverviewData(); // Refresh overview
    } catch (err) {
      console.error('Error deleting all users:', err);
      setDataManagementMessage(`❌ Failed to delete all users: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoadingDataOperation(false);
    }
  };

  const handleDeleteAllUserData = async () => {
    const confirmText = 'DELETE_ALL_DATA';
    const userInput = window.prompt(
      `⚠️ WARNING: This will delete ALL user data (purchases, logs, surveys) but keep user accounts.\n\nType "${confirmText}" to confirm this irreversible action:`
    );
    
    if (userInput !== confirmText) {
      setDataManagementMessage('❌ Operation cancelled - confirmation text did not match');
      return;
    }

    setLoadingDataOperation(true);
    setDataManagementMessage('');

    try {
      const response = await adminAPI.deleteAllUserData(confirmText);
      setDataManagementMessage(`✅ ${response.data.message}`);
      loadOverviewData(); // Refresh overview
    } catch (err) {
      console.error('Error deleting all user data:', err);
      setDataManagementMessage('❌ Failed to delete user data');
    } finally {
      setLoadingDataOperation(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    if (user) {
      handleSearchUser(user.id);
    } else {
      setSearchedUser(null);
      setDataManagementMessage('');
    }
  };

  const handleSearchUser = async (userId) => {
    if (!userId) {
      setDataManagementMessage('❌ Please select a user');
      return;
    }

    setLoadingUserSearch(true);
    setDataManagementMessage('');
    setSearchedUser(null);

    try {
      const response = await adminAPI.searchUser(userId);
      setSearchedUser(response.data);
      setDataManagementMessage('✅ User found');
    } catch (err) {
      console.error('Error searching user:', err);
      if (err.response?.status === 404) {
        setDataManagementMessage('❌ User not found');
      } else {
        setDataManagementMessage('❌ Failed to search user');
      }
    } finally {
      setLoadingUserSearch(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirmText = 'DELETE_USER_AND_DATA';
    const userInput = window.prompt(
      `⚠️ WARNING: This will permanently delete user "${username}" and ALL their data.\n\nType "${confirmText}" to confirm this irreversible action:`
    );
    
    if (userInput !== confirmText) {
      setDataManagementMessage('❌ Operation cancelled - confirmation text did not match');
      return;
    }

    setLoadingDataOperation(true);
    setDataManagementMessage('');

    try {
      const response = await adminAPI.deleteUser(userId, confirmText);
      setDataManagementMessage(`✅ ${response.data.message}`);
      setSearchedUser(null); // Clear search results
      loadOverviewData(); // Refresh overview
    } catch (err) {
      console.error('Error deleting user:', err);
      setDataManagementMessage('❌ Failed to delete user');
    } finally {
      setLoadingDataOperation(false);
    }
  };

  const handleDeleteUserDataOnly = async (userId, username) => {
    const confirmText = 'DELETE_USER_DATA_ONLY';
    const userInput = window.prompt(
      `⚠️ WARNING: This will delete ALL data for user "${username}" but keep their account.\n\nType "${confirmText}" to confirm this irreversible action:`
    );
    
    if (userInput !== confirmText) {
      setDataManagementMessage('❌ Operation cancelled - confirmation text did not match');
      return;
    }

    setLoadingDataOperation(true);
    setDataManagementMessage('');

    try {
      const response = await adminAPI.deleteUserData(userId, confirmText);
      setDataManagementMessage(`✅ ${response.data.message}`);
      // Refresh user search to show updated counts
      await handleSearchUser();
      loadOverviewData(); // Refresh overview
    } catch (err) {
      console.error('Error deleting user data:', err);
      setDataManagementMessage('❌ Failed to delete user data');
    } finally {
      setLoadingDataOperation(false);
    }
  };

  const handleDeleteUserStreak = async (userId, username) => {
    const confirmText = 'DELETE_USER_STREAK';
    const userInput = window.prompt(
      `⚠️ WARNING: This will delete streak data for user "${username}" (current streak, longest streak, total completions).\n\nType "${confirmText}" to confirm this action:`
    );
    
    if (userInput !== confirmText) {
      setDataManagementMessage('❌ Operation cancelled - confirmation text did not match');
      return;
    }

    setLoadingDataOperation(true);
    setDataManagementMessage('');

    try {
      const response = await adminAPI.deleteUserStreak(userId, confirmText);
      setDataManagementMessage(`✅ ${response.data.message}`);
      // Refresh user search to show updated counts
      await handleSearchUser();
      loadOverviewData(); // Refresh overview
    } catch (err) {
      console.error('Error deleting user streak:', err);
      setDataManagementMessage('❌ Failed to delete user streak data');
    } finally {
      setLoadingDataOperation(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load data for specific tabs
    if (newValue === 1 && !surveyResponses) {
      loadSurveyResponses();
    } else if (newValue === 2 && !wastePatterns) {
      loadWastePatterns();
    } else if (newValue === 3 && !purchaseTrends) {
      loadPurchaseTrends();
    } else if (newValue === 5) {
      // Fake Data Management tab - refresh count
      loadFakeUsersCount();
    }
  };

  const loadUserTrends = async (userId, period = 'week') => {
    if (!userId) {
      setUserTrendsError('Please select a user');
      return;
    }

    try {
      setLoadingUserTrends(true);
      setUserTrendsError(null);
      
      // All periods show full data range - no count needed
      const response = await adminAPI.getUserTrends(userId, period);
      setUserTrendsData(response.data);
    } catch (err) {
      console.error('Error loading user trends:', err);
      setUserTrendsError(err.response?.data?.error || 'Failed to load user trends');
      setUserTrendsData(null);
    } finally {
      setLoadingUserTrends(false);
    }
  };

  const handleTrendsUserSelect = (user) => {
    setTrendsUser(user);
    if (user) {
      loadUserTrends(user.id, userTrendsPeriod);
    } else {
      setUserTrendsData(null);
      setUserTrendsError(null);
    }
  };

  const processUserTrendsData = (trendsData) => {
    if (!trendsData || trendsData.length === 0) return null;

    // Filter out periods with no data (both consumed and wasted are 0)
    const filteredData = trendsData.filter(item => {
      const consumed = parseFloat(item.consumed_qty || 0);
      const wasted = parseFloat(item.wasted_qty || 0);
      return consumed > 0 || wasted > 0;
    });

    if (filteredData.length === 0) return null;

    const labels = filteredData.map(item => {
      const date = new Date(item.bucket);
      switch (userTrendsPeriod) {
        case 'day':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'week':
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'month':
        case 'all':
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        default:
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    });

    return {
      labels,
      datasets: [
        {
          label: '% Consumed',
          data: filteredData.map(item => {
            const total = item.consumed_qty + item.wasted_qty;
            const percent_consumed = total > 0 ? (item.consumed_qty / total) * 100 : 0;
            return parseFloat(percent_consumed.toFixed(2));
          }),
          borderColor: 'rgb(59, 130, 246)', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: false,
        },
        {
          label: '% Wasted',
          data: filteredData.map(item => parseFloat(item.percent_wasted.toFixed(2))),
          borderColor: 'rgb(239, 83, 80)', // Red
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          tension: 0.3,
          fill: false,
        },
      ],
    };
  };

  const getUserTrendsChartOptions = () => {
    const periodLabels = {
      day: 'Daily',
      week: 'Weekly',
      month: 'Monthly',
      all: 'All Time'
    };
    
    const xAxisLabels = {
      day: 'Day',
      week: 'Week',
      month: 'Month',
      all: 'Month'
    };
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: trendsUser 
            ? `Waste Trends for ${trendsUser.username || `User ${trendsUser.id}`} (${periodLabels[userTrendsPeriod] || 'Weekly'} View)`
            : 'Select a user to view trends',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: xAxisLabels[userTrendsPeriod] || 'Week'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Percentage (%)'
          },
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  };

  const handleExport = async (exportFunction, filename) => {
    try {
      const response = await exportFunction();
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export data');
    }
  };

  // Process waste patterns data for the line chart
  const processWasteTrendsData = (wastePatterns, timeframe = 'weekly') => {
    if (!wastePatterns?.detailed) return null;

    // The detailed data now contains day_start, week_start, and month_start
    const sortedDetailed = [...wastePatterns.detailed].sort((a, b) => {
      // Sort by the appropriate date field based on timeframe
      let dateA, dateB;
      switch (timeframe) {
        case 'daily':
          dateA = new Date(a.day_start);
          dateB = new Date(b.day_start);
          break;
        case 'weekly':
          dateA = new Date(a.week_start);
          dateB = new Date(b.week_start);
          break;
        case 'monthly':
          dateA = new Date(a.month_start);
          dateB = new Date(b.month_start);
          break;
        default:
          dateA = new Date(a.week_start);
          dateB = new Date(b.week_start);
      }
      return dateA - dateB;
    });

    // Group by timeframe and sum up consumed/wasted
    const timeframeData = {};
    sortedDetailed.forEach(item => {
      let timeKey;
      let dateLabel;
      let date;
      
      switch (timeframe) {
        case 'daily':
          timeKey = item.day_start;
          date = new Date(item.day_start);
          dateLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          break;
        case 'weekly':
          timeKey = item.week_start;
          date = new Date(item.week_start);
          dateLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          break;
        case 'monthly':
          timeKey = item.month_start;
          date = new Date(item.month_start);
          dateLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            year: 'numeric' 
          });
          break;
        default:
          timeKey = item.week_start;
          date = new Date(item.week_start);
          dateLabel = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
      }
      
      if (!timeframeData[timeKey]) {
        timeframeData[timeKey] = { 
          consumed: 0, 
          wasted: 0, 
          timeKey: timeKey,
          dateLabel: dateLabel 
        };
      }
      
      if (item.action === 'consumed') {
        timeframeData[timeKey].consumed += parseInt(item.count);
      } else if (item.action === 'wasted') {
        timeframeData[timeKey].wasted += parseInt(item.count);
      }
    });

    // Convert to arrays for chart
    const chartLabels = [];
    const chartConsumedData = [];
    const chartWastedData = [];

    Object.values(timeframeData).forEach(period => {
      chartLabels.push(period.dateLabel);
      chartConsumedData.push(period.consumed);
      chartWastedData.push(period.wasted);
    });

    // If no data, return null
    if (chartLabels.length === 0) return null;

    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Consumed',
          data: chartConsumedData,
          borderColor: 'rgb(59, 130, 246)', // Blue color for consumed (user preference)
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Wasted',
          data: chartWastedData,
          borderColor: 'rgb(156, 163, 175)', // Gray color for wasted (avoiding orange)
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          tension: 0.1,
          fill: false,
        },
      ],
    };
  };

  // Chart options for the waste trends line graph
  const getChartOptions = (timeframe) => {
    const timeframeLabels = {
      daily: 'Day',
      weekly: 'Week', 
      monthly: 'Month'
    };
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Consumption vs Waste Trends (${timeframeLabels[timeframe]}ly View)`,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} items`;
            }
          }
        }
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: timeframeLabels[timeframe]
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Number of Items'
          },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  };

  const renderQuestionVisualization = (question, responses) => {
    if (!question || !responses) return null;

    const questionType = question.type;
    const responseCounts = {};
    
    // Count responses
    responses.forEach(response => {
      const value = response.response;
      responseCounts[value] = (responseCounts[value] || 0) + 1;
    });

    if (questionType === 'text') {
      // Text responses - show as list
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Text Responses ({responses.length} total)
            </Typography>
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {responses.map((response, index) => (
                <ListItem key={index} divider>
                  <ListItemText 
                    primary={response.response}
                    secondary={`User ID: ${response.user_id} • ${new Date(response.created_at).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    } else if (questionType === 'number' || questionType === 'money') {
      // Numeric responses - show statistics and distribution
      const numericResponses = responses
        .map(r => parseFloat(r.response))
        .filter(r => !isNaN(r));
      
      const avg = numericResponses.length > 0 ? numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length : 0;
      const min = numericResponses.length > 0 ? Math.min(...numericResponses) : 0;
      const max = numericResponses.length > 0 ? Math.max(...numericResponses) : 0;
      
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Typography variant="body2">Average: {avg.toFixed(2)}</Typography>
                <Typography variant="body2">Min: {min.toFixed(2)}</Typography>
                <Typography variant="body2">Max: {max.toFixed(2)}</Typography>
                <Typography variant="body2">Total Responses: {numericResponses.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Distribution
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Response</TableCell>
                        <TableCell>Count</TableCell>
                        <TableCell>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(responseCounts)
                        .sort(([,a], [,b]) => b - a)
                        .map(([response, count]) => (
                          <TableRow key={response}>
                            <TableCell>{response}</TableCell>
                            <TableCell>{count}</TableCell>
                            <TableCell>{((count / responses.length) * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      );
    } else {
      // Multiple choice, rating, yes/no - show as chart-like table
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Response Distribution ({responses.length} total)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Response</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Percentage</TableCell>
                    <TableCell>Visual</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(responseCounts)
                    .sort(([,a], [,b]) => b - a)
                    .map(([response, count]) => {
                      const percentage = (count / responses.length) * 100;
                      const barWidth = Math.max(percentage, 5); // Minimum 5% width
                      
                      return (
                        <TableRow key={response}>
                          <TableCell>{response}</TableCell>
                          <TableCell>{count}</TableCell>
                          <TableCell>{percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                              <Box 
                                sx={{ 
                                  width: `${barWidth}%`, 
                                  bgcolor: 'primary.main', 
                                  height: 20, 
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                                  {count}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      width: '100vw', 
      maxWidth: '100vw', 
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'auto',
      backgroundColor: '#f5f5f5',
      zIndex: 1000
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">
          Admin Analytics Dashboard
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={onLogout}
          startIcon={<Lock />}
        >
          Logout
        </Button>
      </Box>
      
      {/* Overview Cards */}
      {overview && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {overview.totalUsers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Initial Survey
                </Typography>
                <Typography variant="h4">
                  {overview.initialSurveyCompleted}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {overview.initialSurveyCompletionRate}% completion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Final Survey
                </Typography>
                <Typography variant="h4">
                  {overview.finalSurveyCompleted}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {overview.finalSurveyCompletionRate}% completion rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Purchases
                </Typography>
                <Typography variant="h4">
                  {overview.totalPurchases}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {overview.totalResponses} survey responses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Demographics" />
          <Tab label="Survey Responses" />
          <Tab label="Waste Patterns" />
          <Tab label="Purchase Trends" />
          <Tab label="User Trends" />
          <Tab label="Data Export" />
          <Tab label="Fake Data Management" />
        <Tab label="Data Management" />
        </Tabs>
      </Box>

      {/* Demographics Tab */}
      <TabPanel value={tabValue} index={0}>
        {demographics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gender Distribution
                  </Typography>
                  {demographics.gender.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{item.response}</Typography>
                      <Chip label={item.count} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Age Distribution
                  </Typography>
                  {demographics.age.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography>{item.response}</Typography>
                      <Chip label={item.count} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Income Distribution
                  </Typography>
                  {demographics.income.map((item, index) => (
                    <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">{item.response}</Typography>
                      <Chip label={item.count} size="small" />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Survey Responses Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Survey Responses - {currentSurveyFilter.charAt(0).toUpperCase() + currentSurveyFilter.slice(1)} Survey
            {surveyResponses && (
              <Chip 
                label={`${surveyResponses.length} responses`} 
                size="small" 
                sx={{ ml: 1 }} 
                color="primary"
              />
            )}
          </Typography>
          
          {/* Survey Filter Buttons */}
          <Box sx={{ mb: 2 }}>
            <Button 
              variant={currentSurveyFilter === 'initial' ? "contained" : "outlined"}
              onClick={() => loadSurveyResponses('initial')}
              sx={{ mr: 1 }}
              disabled={loadingSurveyResponses}
            >
              Initial Survey
            </Button>
            <Button 
              variant={currentSurveyFilter === 'weekly' ? "contained" : "outlined"}
              onClick={() => loadSurveyResponses('weekly')}
              sx={{ mr: 1 }}
              disabled={loadingSurveyResponses}
            >
              Weekly Survey
            </Button>
            <Button 
              variant={currentSurveyFilter === 'final' ? "contained" : "outlined"}
              onClick={() => loadSurveyResponses('final')}
              sx={{ mr: 1 }}
              disabled={loadingSurveyResponses}
            >
              Final Survey
            </Button>
            <Button 
              variant={currentSurveyFilter === 'all' ? "contained" : "outlined"}
              onClick={() => loadSurveyResponses()}
              disabled={loadingSurveyResponses}
            >
              All Surveys
            </Button>
          </Box>

          {/* View Mode Toggle */}
          {surveyResponses && (
            <Box sx={{ mb: 2 }}>
              <Button 
                variant={surveyViewMode === 'summary' ? "contained" : "outlined"}
                onClick={() => setSurveyViewMode('summary')}
                sx={{ mr: 1 }}
              >
                Summary View
              </Button>
              <Button 
                variant={surveyViewMode === 'byQuestion' ? "contained" : "outlined"}
                onClick={() => setSurveyViewMode('byQuestion')}
              >
                By Question View
              </Button>
            </Box>
          )}

          {/* Question Selector for By Question View */}
          {surveyViewMode === 'byQuestion' && availableQuestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 400 }}>
                <InputLabel>Select Question</InputLabel>
                <Select
                  value={selectedQuestion}
                  onChange={(e) => {
                    setSelectedQuestion(e.target.value);
                    if (e.target.value) {
                      loadQuestionResponses(e.target.value);
                    }
                  }}
                  label="Select Question"
                >
                  {availableQuestions.map((question) => (
                    <MenuItem key={question.id} value={question.id}>
                      {question.text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>
        
        {loadingSurveyResponses ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : surveyResponses ? (
          surveyViewMode === 'summary' ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Response</TableCell>
                    <TableCell>Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {surveyResponses.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.question_text}</TableCell>
                      <TableCell>{row.response}</TableCell>
                      <TableCell>{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            // By Question View
            <Box>
              {loadingQuestionResponses ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <CircularProgress />
                </Box>
              ) : questionResponses ? (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {questionResponses.question.question_text}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Type: {questionResponses.question.type} • Stage: {questionResponses.question.stage}
                  </Typography>
                  {renderQuestionVisualization(questionResponses.question, questionResponses.responses)}
                </Box>
              ) : selectedQuestion ? (
                <Typography variant="body1" color="textSecondary" align="center">
                  Select a question above to view detailed responses
                </Typography>
              ) : (
                <Typography variant="body1" color="textSecondary" align="center">
                  Select a question to view detailed responses
                </Typography>
              )}
            </Box>
          )
        ) : (
          <Typography variant="body1" color="textSecondary" align="center">
            Click a button above to load survey responses data
          </Typography>
        )}
      </TabPanel>

                           {/* Waste Patterns Tab */}
        <TabPanel value={tabValue} index={2}>
          {loadingWastePatterns ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : wastePatterns ? (
            <Grid container spacing={3}>
              {/* Consumption vs Waste Trends Line Graph */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h6">
                        Consumption vs Waste Trends Over Time
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Timeframe</InputLabel>
                        <Select
                          value={chartTimeframe}
                          label="Timeframe"
                          onChange={(e) => setChartTimeframe(e.target.value)}
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Track whether users are improving their habits - ideally seeing consumption increase and waste decrease over time
                    </Typography>
                    {(() => {
                      const chartData = processWasteTrendsData(wastePatterns, chartTimeframe);
                      if (!chartData || chartData.datasets[0].data.length < 2) return null;
                      
                      const consumedData = chartData.datasets[0].data;
                      const wastedData = chartData.datasets[1].data;
                      
                      // Calculate trends (simple linear regression slope)
                      const calculateTrend = (data) => {
                        const n = data.length;
                        const x = Array.from({length: n}, (_, i) => i);
                        const sumX = x.reduce((a, b) => a + b, 0);
                        const sumY = data.reduce((a, b) => a + b, 0);
                        const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
                        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
                        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
                      };
                      
                      const consumedTrend = calculateTrend(consumedData);
                      const wastedTrend = calculateTrend(wastedData);
                      
                      const isImproving = consumedTrend > 0 && wastedTrend < 0;
                      const trendColor = isImproving ? 'success.main' : 'warning.main';
                      const trendText = isImproving ? 'Improving' : 'Needs Attention';
                      
                      return (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ color: trendColor, fontWeight: 'bold' }}>
                            Trend Analysis: {trendText}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Consumed items: {consumedTrend > 0 ? '↗️ Increasing' : '↘️ Decreasing'} 
                            {' • '}
                            Wasted items: {wastedTrend < 0 ? '↘️ Decreasing' : '↗️ Increasing'}
                          </Typography>
                        </Box>
                      );
                    })()}
                    <Box sx={{ height: '400px', width: '100%' }}>
                      {processWasteTrendsData(wastePatterns, chartTimeframe) ? (
                        <Line 
                          data={processWasteTrendsData(wastePatterns, chartTimeframe)} 
                          options={getChartOptions(chartTimeframe)}
                        />
                      ) : (
                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          alignItems="center" 
                          height="100%"
                          color="text.secondary"
                        >
                          <Typography>No trend data available</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Overall Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Overall Consumption vs Waste Summary
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Average Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wastePatterns.overall?.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Chip 
                                  label={row.action} 
                                  color={row.action === 'consumed' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{row.count}</TableCell>
                              <TableCell>${(Number(row.total_cost) || 0).toFixed(2)}</TableCell>
                              <TableCell>${(Number(row.avg_cost) || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Waste by Category */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Waste by Category
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>% of Total Waste</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wastePatterns.byCategory?.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row.category || 'Unknown'}</TableCell>
                              <TableCell>{row.count}</TableCell>
                              <TableCell>${(Number(row.total_cost) || 0).toFixed(2)}</TableCell>
                              <TableCell>{row.waste_percentage || 0}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Waste Trends Over Time */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Waste Trends Over Time (Last 12 Weeks)
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Week Starting</TableCell>
                            <TableCell>Waste Count</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Average Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wastePatterns.trends?.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(row.week_start).toLocaleDateString()}</TableCell>
                              <TableCell>{row.count}</TableCell>
                              <TableCell>${(Number(row.total_cost) || 0).toFixed(2)}</TableCell>
                              <TableCell>${(Number(row.avg_cost) || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Detailed Breakdown */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detailed Breakdown by Category and Week
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Week</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Total Cost</TableCell>
                            <TableCell>Average Cost</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {wastePatterns.detailed?.slice(0, 20).map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(row.week_start).toLocaleDateString()}</TableCell>
                              <TableCell>{row.category || 'Unknown'}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={row.action} 
                                  color={row.action === 'consumed' ? 'success' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{row.count}</TableCell>
                              <TableCell>${(Number(row.total_cost) || 0).toFixed(2)}</TableCell>
                              <TableCell>${(Number(row.avg_cost) || 0).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {wastePatterns.detailed?.length > 20 && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        Showing first 20 records. Use export for complete data.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body1" color="textSecondary" align="center">
              Click the tab to load waste patterns data
            </Typography>
          )}
        </TabPanel>

      {/* Purchase Trends Tab */}
      <TabPanel value={tabValue} index={3}>
        {loadingPurchaseTrends ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : purchaseTrends ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Categories by Spending
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell>Total Spent</TableCell>
                          <TableCell>Count</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseTrends.categories.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.category}</TableCell>
                            <TableCell>${(Number(row.total_spent) || 0).toFixed(2)}</TableCell>
                            <TableCell>{row.purchase_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Weekly Purchase Trends
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Week</TableCell>
                          <TableCell>Purchases</TableCell>
                          <TableCell>Total Spent</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                                                 {purchaseTrends.weekly.map((row, index) => (
                           <TableRow key={index}>
                             <TableCell>{new Date(row.week_start).toLocaleDateString()}</TableCell>
                             <TableCell>{row.purchase_count}</TableCell>
                             <TableCell>${(Number(row.total_spent) || 0).toFixed(2)}</TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="textSecondary" align="center">
            Click the tab to load purchase trends data
          </Typography>
        )}
      </TabPanel>

      {/* User Trends Tab */}
      <TabPanel value={tabValue} index={4}>
        <Typography variant="h6" gutterBottom>
          User Waste Trends
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Select a user to view their waste and consumption trends over time.
        </Typography>

        <Grid container spacing={3}>
          {/* User Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Select User
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <UserSearchAutocomplete
                    onUserSelect={handleTrendsUserSelect}
                    placeholder="Search by User ID or Username..."
                  />
                </Box>
                
                {trendsUser && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Viewing trends for: <strong>{trendsUser.username || `User ${trendsUser.id}`}</strong>
                      {trendsUser.email && ` (${trendsUser.email})`}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Period Selector */}
          {trendsUser && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">
                      Time Period
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Period</InputLabel>
                      <Select
                        value={userTrendsPeriod}
                        label="Period"
                        onChange={(e) => {
                          const newPeriod = e.target.value;
                          setUserTrendsPeriod(newPeriod);
                          if (trendsUser) {
                            loadUserTrends(trendsUser.id, newPeriod);
                          }
                        }}
                      >
                        <MenuItem value="day">Daily</MenuItem>
                        <MenuItem value="week">Weekly</MenuItem>
                        <MenuItem value="month">Monthly</MenuItem>
                        <MenuItem value="all">All Time</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Trends Chart */}
          {trendsUser && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  {loadingUserTrends ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                      <CircularProgress />
                    </Box>
                  ) : userTrendsError ? (
                    <Alert severity="error">{userTrendsError}</Alert>
                  ) : userTrendsData && userTrendsData.length > 0 ? (
                    <>
                      {(() => {
                        // Filter out periods with no data
                        const filteredData = userTrendsData.filter(item => {
                          const consumed = parseFloat(item.consumed_qty || 0);
                          const wasted = parseFloat(item.wasted_qty || 0);
                          return consumed > 0 || wasted > 0;
                        });

                        if (filteredData.length === 0) {
                          return (
                            <Alert severity="info">
                              No trend data available for this user. They may not have any consumption logs yet.
                            </Alert>
                          );
                        }

                        return (
                          <>
                            <Box sx={{ height: '400px', width: '100%' }}>
                              {processUserTrendsData(userTrendsData) && (
                                <Line 
                                  data={processUserTrendsData(userTrendsData)} 
                                  options={getUserTrendsChartOptions()}
                                />
                              )}
                            </Box>
                            
                            {/* Summary Statistics */}
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                              <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Total Consumed
                                    </Typography>
                                    <Typography variant="h5" color="primary">
                                      {filteredData.reduce((sum, item) => sum + item.consumed_qty, 0).toFixed(0)} items
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      ${filteredData.reduce((sum, item) => sum + item.consumed_cost, 0).toFixed(2)} total
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Total Wasted
                                    </Typography>
                                    <Typography variant="h5" color="error">
                                      {filteredData.reduce((sum, item) => sum + item.wasted_qty, 0).toFixed(0)} items
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      ${filteredData.reduce((sum, item) => sum + item.wasted_cost, 0).toFixed(2)} total
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="subtitle2" color="textSecondary">
                                      Average % Wasted
                                    </Typography>
                                    <Typography variant="h5">
                                      {filteredData.length > 0 
                                        ? (filteredData.reduce((sum, item) => sum + item.percent_wasted, 0) / filteredData.length).toFixed(1)
                                        : 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      Across {filteredData.length} {
                                        userTrendsPeriod === 'day' ? 'days' : 
                                        userTrendsPeriod === 'week' ? 'weeks' : 
                                        userTrendsPeriod === 'month' ? 'months' : 
                                        'periods'
                                      }
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            </Grid>

                            {/* Trends Table */}
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="subtitle1" gutterBottom>
                                Detailed Data
                              </Typography>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>
                                        {userTrendsPeriod === 'day' ? 'Date' : 
                                         userTrendsPeriod === 'week' ? 'Week Starting' : 
                                         userTrendsPeriod === 'month' ? 'Month Starting' : 
                                         'Month Starting'}
                                      </TableCell>
                                      <TableCell align="right">Consumed Items</TableCell>
                                      <TableCell align="right">Wasted Items</TableCell>
                                      <TableCell align="right">Consumed Cost</TableCell>
                                      <TableCell align="right">Wasted Cost</TableCell>
                                      <TableCell align="right">% Wasted</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {filteredData.map((row, index) => {
                                      const date = new Date(row.bucket);
                                      const dateLabel = userTrendsPeriod === 'month' || userTrendsPeriod === 'all'
                                        ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                        : date.toLocaleDateString();
                                      
                                      return (
                                        <TableRow key={index}>
                                          <TableCell>{dateLabel}</TableCell>
                                          <TableCell align="right">{row.consumed_qty.toFixed(0)}</TableCell>
                                          <TableCell align="right">{row.wasted_qty.toFixed(0)}</TableCell>
                                          <TableCell align="right">${row.consumed_cost.toFixed(2)}</TableCell>
                                          <TableCell align="right">${row.wasted_cost.toFixed(2)}</TableCell>
                                          <TableCell align="right">
                                            <Chip 
                                              label={`${row.percent_wasted.toFixed(1)}%`}
                                              size="small"
                                              color={row.percent_wasted > 50 ? 'error' : row.percent_wasted > 25 ? 'warning' : 'success'}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <Alert severity="info">
                      No trend data available for this user. They may not have any consumption logs yet.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Empty State */}
          {!trendsUser && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      Select a user to view their waste trends
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Use the search box above to find and select a user
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Data Export Tab */}
      <TabPanel value={tabValue} index={5}>
        <Typography variant="h6" gutterBottom>
          Export Data to CSV (Google Sheets Compatible)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(adminAPI.exportRawData, 'raw_data.csv')}
            >
              Export Raw Data
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(adminAPI.exportUserDemographics, 'user_demographics.csv')}
            >
              Export Demographics
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(() => adminAPI.exportSurveyResponses('initial'), 'survey_responses_initial.csv')}
            >
              Export Initial Survey
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(() => adminAPI.exportSurveyResponses('weekly'), 'survey_responses_weekly.csv')}
            >
              Export Weekly Survey
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(() => adminAPI.exportSurveyResponses('final'), 'survey_responses_final.csv')}
            >
              Export Final Survey
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleExport(adminAPI.exportWastePatterns, 'waste_patterns.csv')}
            >
              Export Waste Patterns
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="textSecondary">
            💡 Tip: Click any export button to download CSV files that can be directly imported into Google Sheets.
          </Typography>
        </Box>
      </TabPanel>

      {/* Fake Data Management Tab */}
      <TabPanel value={tabValue} index={6}>
        <Typography variant="h6" gutterBottom>
          Fake Data Management
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Generate fake users with realistic test data for development and testing purposes. 
          All fake users are easily identifiable (DummyUser1, DummyUser2, etc.) and can be safely deleted.
        </Typography>

        {/* Current Status */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Status
            </Typography>
            <Typography variant="h4" color="primary">
              {fakeUsersCount} Fake Users
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Currently in the database
            </Typography>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleGenerateFakeData(3)}
              disabled={loadingFakeData}
              sx={{ mb: 1 }}
            >
              Generate 3 Users
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleGenerateFakeData(5)}
              disabled={loadingFakeData}
              sx={{ mb: 1 }}
            >
              Generate 5 Users
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => handleGenerateFakeData(10)}
              disabled={loadingFakeData}
              sx={{ mb: 1 }}
            >
              Generate 10 Users
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleCleanupFakeData}
              disabled={loadingFakeData || fakeUsersCount === 0}
              sx={{ mb: 1 }}
            >
              Delete All Fake Data
            </Button>
          </Grid>
        </Grid>

        {/* Trending Data for dtest User */}
        <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generate Trending Data for "dtest" User
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Creates data from August 23rd to today showing a progression from junk food with high waste to healthy food with low waste.
              User will be created if it doesn't exist (password: testtest).
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGenerateDtestTrendingData}
              disabled={loadingFakeData}
            >
              Generate dtest Trending Data
            </Button>
          </CardContent>
        </Card>

        {/* Status Message */}
        {fakeDataMessage && (
          <Alert 
            severity={fakeDataMessage.includes('✅') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
          >
            {fakeDataMessage}
          </Alert>
        )}

        {/* Loading Indicator */}
        {loadingFakeData && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Processing fake data...
            </Typography>
          </Box>
        )}

        {/* Information Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  What Gets Generated
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="User Accounts" 
                      secondary="DummyUser1, DummyUser2, etc. with hashed passwords"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Food Purchases" 
                      secondary="5-15 purchases per week over 4 weeks with realistic prices and quantities"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Consumption Logs" 
                      secondary="2-5 events per purchase with varied waste ratios based on food type"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Survey Responses" 
                      secondary="Complete initial, weekly, and final survey answers"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Safety Features
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Easy Identification" 
                      secondary="All fake users have 'DummyUser' prefix"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Complete Cleanup" 
                      secondary="Deleting fake users removes ALL associated data"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Cascade Delete" 
                      secondary="Database constraints ensure no orphaned data"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Confirmation Required" 
                      secondary="Delete action requires confirmation"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Warning */}
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> Fake data is for development and testing only. 
            Always clean up fake data before deploying to production or sharing with real users.
          </Typography>
        </Alert>
      </TabPanel>

      {/* Data Management Tab */}
      <TabPanel value={tabValue} index={7}>
        <Typography variant="h6" gutterBottom>
          User Data Management
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Powerful admin tools for managing user data. Use with extreme caution.
        </Typography>

        <Grid container spacing={3}>
          {/* Delete All Users */}
          <Grid item xs={12}>
            <Card sx={{ border: '3px solid', borderColor: 'error.main', backgroundColor: 'rgba(211, 47, 47, 0.05)' }}>
              <CardContent>
                <Typography variant="h6" color="error.main" gutterBottom>
                  🗑️ Delete All Users
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>CRITICAL:</strong> This will PERMANENTLY DELETE ALL USERS and ALL their associated data (purchases, logs, surveys, streaks).
                  This action CANNOT be undone. Use this to clear the database for fresh testing.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAllUsers}
                  disabled={loadingDataOperation}
                  sx={{ mb: 1 }}
                >
                  {loadingDataOperation ? 'Deleting...' : 'Delete All Users'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Bulk Data Deletion */}
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Typography variant="h6" color="error.main" gutterBottom>
                  ⚠️ Bulk Data Deletion
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Delete ALL user data (purchases, consumption logs, surveys) while preserving user accounts.
                  Users can continue to log in but will start fresh.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAllUserData}
                  disabled={loadingDataOperation}
                  sx={{ mb: 1 }}
                >
                  Delete All User Data
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* User Search and Management */}
          <Grid item xs={12}>
            <Card sx={{ overflow: 'visible' }}>
              <CardContent sx={{ overflow: 'visible' }}>
                <Typography variant="h6" gutterBottom>
                  🔍 User Search & Management
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Search for a specific user and manage their data or account.
                </Typography>
                
                <Box sx={{ mb: 2, position: 'relative', zIndex: 1 }}>
                  <UserSearchAutocomplete
                    onUserSelect={handleUserSelect}
                    placeholder="Search by User ID or Username..."
                  />
                  {loadingUserSearch && (
                    <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        Loading user details...
                      </Typography>
                    </Box>
                  )}
                </Box>

                {searchedUser && (
                  <Card variant="outlined" sx={{ mt: 2, p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      User Found: {searchedUser.user.username}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>ID:</strong> {searchedUser.user.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Username:</strong> {searchedUser.user.username || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Email:</strong> {searchedUser.user.email || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          <strong>Created:</strong> {new Date(searchedUser.user.created_at).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>
                      Data Summary:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} sm={3}>
                        <Chip 
                          label={`${searchedUser.dataCounts.purchases_count} Purchases`} 
                          color="primary" 
                          size="small" 
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Chip 
                          label={`${searchedUser.dataCounts.consumption_logs_count} Logs`} 
                          color="secondary" 
                          size="small" 
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Chip 
                          label={`${searchedUser.dataCounts.survey_responses_count} Surveys`} 
                          color="info" 
                          size="small" 
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Chip 
                          label={`${searchedUser.dataCounts.food_items_count} Food Items`} 
                          color="success" 
                          size="small" 
                        />
                      </Grid>
                    </Grid>

                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Button
                        variant="outlined"
                        color="info"
                        onClick={() => handleDeleteUserStreak(searchedUser.user.id, searchedUser.user.username)}
                        disabled={loadingDataOperation}
                        size="small"
                      >
                        Delete Streak Data
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => handleDeleteUserDataOnly(searchedUser.user.id, searchedUser.user.username)}
                        disabled={loadingDataOperation}
                        size="small"
                      >
                        Delete Data Only
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleDeleteUser(searchedUser.user.id, searchedUser.user.username)}
                        disabled={loadingDataOperation}
                        size="small"
                      >
                        Delete User & Data
                      </Button>
                    </Box>
                  </Card>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Message */}
        {dataManagementMessage && (
          <Alert 
            severity={dataManagementMessage.includes('✅') ? 'success' : 'error'} 
            sx={{ mt: 2 }}
          >
            {dataManagementMessage}
          </Alert>
        )}
      </TabPanel>
    </Box>
  );
}

export default AdminDashboard;
