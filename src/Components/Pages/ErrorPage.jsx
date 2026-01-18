// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  BugReport as BugIcon,
} from '@mui/icons-material';
import { getStoredErrors, clearErrors } from '../../utils/errorLogger';
import PageWrapper from '../PageWrapper';

const ErrorPage = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = () => {
    const storedErrors = getStoredErrors();
    setErrors(storedErrors);
    // Auto-expand the first error if there are any
    if (storedErrors.length > 0 && expanded === null) {
      setExpanded(storedErrors[0].id);
    }
  };

  const handleClearErrors = () => {
    if (window.confirm('Are you sure you want to clear all error logs?')) {
      clearErrors();
      setErrors([]);
      setExpanded(null);
    }
  };

  const handleExpand = (errorId) => {
    setExpanded(expanded === errorId ? null : errorId);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

  const getErrorSeverity = (error) => {
    // Simple heuristic: check if it's a network error, API error, etc.
    if (error.message?.toLowerCase().includes('network') || 
        error.message?.toLowerCase().includes('fetch')) {
      return 'warning';
    }
    if (error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('403')) {
      return 'info';
    }
    return 'error';
  };

  return (
    <PageWrapper 
      title="Error Logs" 
      maxWidth="md"
      showLogo={false}
    >
      <Container 
        maxWidth="md"
        sx={{ 
          maxWidth: { xs: '100%', sm: '900px' },
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 3 },
          pb: 0
        }}
      >
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{ 
            mb: 3,
            p: 3,
            borderRadius: 3,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <BugIcon sx={{ fontSize: 32, color: '#d32f2f' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Error Logs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {errors.length} error{errors.length !== 1 ? 's' : ''} logged
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadErrors}
                size="small"
              >
                Refresh
              </Button>
              {errors.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearErrors}
                  size="small"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/log')}
                size="small"
              >
                Home
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Error List */}
        {errors.length === 0 ? (
          <Paper 
            elevation={0}
            sx={{ 
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.08)'
            }}
          >
            <BugIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Errors Logged
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All clear! No errors have been logged yet.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {errors.map((error, index) => (
              <Accordion
                key={error.id}
                expanded={expanded === error.id}
                onChange={() => handleExpand(error.id)}
                sx={{
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    backgroundColor: expanded === error.id ? 'rgba(211, 47, 47, 0.04)' : 'white',
                    borderRadius: expanded === error.id ? '8px 8px 0 0' : '8px',
                    '&:hover': {
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                    <Chip
                      label={`#${errors.length - index}`}
                      size="small"
                      color={getErrorSeverity(error)}
                      sx={{ fontWeight: 600 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {error.message || 'Unknown error'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(error.timestamp)}
                      </Typography>
                    </Box>
                    <Chip
                      label={error.errorType || 'Error'}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 2, pb: 3 }}>
                  <Stack spacing={2}>
                    {/* Error Message */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Error Message
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: '#fff5f5',
                          borderColor: '#ffcdd2',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {error.message || 'No message available'}
                      </Paper>
                    </Box>

                    {/* Stack Trace */}
                    {error.stack && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Stack Trace
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            backgroundColor: '#f5f5f5',
                            borderColor: '#e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            maxHeight: 200,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {error.stack}
                        </Paper>
                      </Box>
                    )}

                    {/* Context */}
                    {error.context && Object.keys(error.context).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Context
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            backgroundColor: '#f9f9f9',
                            borderColor: '#e0e0e0',
                          }}
                        >
                          <Stack spacing={1}>
                            {error.context.pathname && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Path:
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {error.context.pathname}
                                </Typography>
                              </Box>
                            )}
                            {error.context.url && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  URL:
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  {error.context.url}
                                </Typography>
                              </Box>
                            )}
                            {error.context.component && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Component:
                                </Typography>
                                <Typography variant="body2">
                                  {error.context.component}
                                </Typography>
                              </Box>
                            )}
                            {error.context.userAgent && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  User Agent:
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                                  {error.context.userAgent}
                                </Typography>
                              </Box>
                            )}
                            {/* Show any other context fields */}
                            {Object.entries(error.context).map(([key, value]) => {
                              if (['pathname', 'url', 'component', 'userAgent'].includes(key)) {
                                return null;
                              }
                              return (
                                <Box key={key}>
                                  <Typography variant="caption" color="text.secondary">
                                    {key}:
                                  </Typography>
                                  <Typography variant="body2">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Paper>
                      </Box>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </Container>
    </PageWrapper>
  );
};

export default ErrorPage;

