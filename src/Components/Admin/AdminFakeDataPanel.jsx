import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AppConfirmDialog from '../AppConfirmDialog';
import { adminAPI } from '../../api';

const PERSONAS = [
  { value: 'mixed', label: 'Mixed (default)' },
  { value: 'high_waste', label: 'High waste' },
  { value: 'low_waste', label: 'Low waste' },
  { value: 'improving', label: 'Improving over time' },
];

export default function AdminFakeDataPanel({ onDataChanged }) {
  const [count, setCount] = useState(5);
  const [weeks, setWeeks] = useState(4);
  const [persona, setPersona] = useState('mixed');
  const [fakeUsers, setFakeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(null); // { type, user? }

  const loadFakeUsers = async () => {
    try {
      const response = await adminAPI.listFakeUsers();
      setFakeUsers(response.data.users || []);
    } catch (err) {
      console.error('Error listing fake users:', err);
    }
  };

  useEffect(() => {
    loadFakeUsers();
  }, []);

  const refresh = async () => {
    await loadFakeUsers();
    onDataChanged?.();
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await adminAPI.generateFakeData({ count, weeks, persona });
      setMessage(response.data.message);
      await refresh();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupAll = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await adminAPI.cleanupFakeData();
      setMessage(response.data.message);
      setConfirm(null);
      await refresh();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOne = async (user) => {
    try {
      setLoading(true);
      setMessage('');
      const response = await adminAPI.deleteFakeUser(user.id);
      setMessage(response.data.message);
      setConfirm(null);
      await refresh();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDtest = async () => {
    try {
      setLoading(true);
      setMessage('Generating dtest trending data… this can take 1–2 minutes.');
      const response = await adminAPI.generateDtestTrendingData();
      setMessage(
        `${response.data.message} — ${response.data.data.purchases} purchases, ${response.data.data.consumptionLogs} logs`
      );
      await refresh();
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setMessage('Request timed out. Check server logs; the job may still be running.');
      } else {
        setMessage(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        Fake Data
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate DummyUser accounts with purchases, consumption logs, surveys, and streaks for testing.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current fake users
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {fakeUsers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Generate users
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" gutterBottom>
                    Count: {count}
                  </Typography>
                  <Slider
                    value={count}
                    min={1}
                    max={20}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(_, v) => setCount(v)}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Weeks of history</InputLabel>
                    <Select
                      label="Weeks of history"
                      value={weeks}
                      onChange={(e) => setWeeks(e.target.value)}
                      disabled={loading}
                    >
                      {[2, 4, 6, 8, 12].map((w) => (
                        <MenuItem key={w} value={w}>
                          {w} weeks
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Persona</InputLabel>
                    <Select
                      label="Persona"
                      value={persona}
                      onChange={(e) => setPersona(e.target.value)}
                      disabled={loading}
                    >
                      {PERSONAS.map((p) => (
                        <MenuItem key={p.value} value={p.value}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ScienceOutlinedIcon />}
                    onClick={handleGenerate}
                    disabled={loading}
                  >
                    Generate
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => setConfirm({ type: 'cleanupAll' })}
                    disabled={loading || fakeUsers.length === 0}
                  >
                    Delete all fake data
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          mb: 2,
          backgroundColor: 'var(--color-primary-light)',
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
            Scenario preset: dtest trending
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creates/updates user <strong>dtest</strong> (password: testtest) with a junk-food → healthy progression.
          </Typography>
          <Button variant="contained" color="secondary" onClick={handleDtest} disabled={loading}>
            Generate dtest trending data
          </Button>
        </CardContent>
      </Card>

      {message && (
        <Alert
          severity={/error|fail|timed out/i.test(message) && !/success/i.test(message) ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {loading && (
        <Box display="flex" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2">Working…</Typography>
        </Box>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Fake users
          </Typography>
          {fakeUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No DummyUser accounts yet. Generate some above.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell align="right">Purchases</TableCell>
                    <TableCell align="right">Logs</TableCell>
                    <TableCell align="right">Surveys</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fakeUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell align="right">{user.purchases_count}</TableCell>
                      <TableCell align="right">{user.consumption_logs_count}</TableCell>
                      <TableCell align="right">{user.survey_responses_count}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="error"
                          disabled={loading}
                          onClick={() => setConfirm({ type: 'deleteOne', user })}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <AppConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          confirm?.type === 'deleteOne'
            ? `Delete ${confirm.user?.username}?`
            : 'Delete all fake users?'
        }
        tone="warning"
        icon={<DeleteOutlineIcon />}
        presentation="centered"
        primaryAction={{
          label: confirm?.type === 'deleteOne' ? 'Delete user' : 'Delete all',
          onClick: () =>
            confirm?.type === 'deleteOne'
              ? handleDeleteOne(confirm.user)
              : handleCleanupAll(),
          color: 'error',
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setConfirm(null),
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {confirm?.type === 'deleteOne'
            ? 'This removes the DummyUser and all associated purchases, logs, and surveys.'
            : 'This permanently deletes every DummyUser* account and all of their data.'}
        </Typography>
      </AppConfirmDialog>
    </Box>
  );
}
