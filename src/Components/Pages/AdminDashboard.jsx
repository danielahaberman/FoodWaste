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
  AccordionDetails
} from '@mui/material';
import { adminAPI } from '../../api.jsx';

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

function AdminDashboard() {
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

  useEffect(() => {
    loadOverviewData();
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load data for specific tabs
    if (newValue === 1 && !surveyResponses) {
      loadSurveyResponses();
    } else if (newValue === 2 && !wastePatterns) {
      loadWastePatterns();
    } else if (newValue === 3 && !purchaseTrends) {
      loadPurchaseTrends();
    }
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
      <Typography variant="h4" gutterBottom>
        Admin Analytics Dashboard
      </Typography>
      
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
          <Tab label="Data Export" />
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

      {/* Data Export Tab */}
      <TabPanel value={tabValue} index={4}>
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
    </Box>
  );
}

export default AdminDashboard;
