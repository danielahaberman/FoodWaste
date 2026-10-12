import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import UserSearchAutocomplete from '../UserSearchAutocomplete';
import AppConfirmDialog from '../AppConfirmDialog';
import { adminAPI } from '../../api';

function Stat({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function AdminUserManagementPanel({ onDataChanged }) {
  const [searchedUser, setSearchedUser] = useState(null);
  const [loadingUserSearch, setLoadingUserSearch] = useState(false);
  const [loadingOp, setLoadingOp] = useState(false);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const handleUserSelect = async (user) => {
    if (!user) {
      setSearchedUser(null);
      setMessage('');
      return;
    }
    setLoadingUserSearch(true);
    setMessage('');
    try {
      const response = await adminAPI.searchUser(user.id);
      setSearchedUser(response.data);
    } catch (err) {
      setSearchedUser(null);
      setMessage(err.response?.status === 404 ? 'User not found' : 'Failed to load user');
    } finally {
      setLoadingUserSearch(false);
    }
  };

  const openConfirm = (type, payload = {}) => {
    setConfirmText('');
    setConfirm({ type, ...payload });
  };

  const expectedConfirm = () => {
    switch (confirm?.type) {
      case 'deleteUser':
        return 'DELETE_USER_AND_DATA';
      case 'deleteUserData':
        return 'DELETE_USER_DATA_ONLY';
      case 'deleteStreak':
        return 'DELETE_USER_STREAK';
      case 'deleteAllUsers':
        return 'DELETE_ALL_USERS';
      case 'deleteAllData':
        return 'DELETE_ALL_DATA';
      default:
        return '';
    }
  };

  const runConfirmedAction = async () => {
    const expected = expectedConfirm();
    if (confirmText !== expected) {
      setMessage('Confirmation text did not match — cancelled');
      return;
    }

    setLoadingOp(true);
    setMessage('');
    try {
      let response;
      const userId = confirm.userId;
      switch (confirm.type) {
        case 'deleteUser':
          response = await adminAPI.deleteUser(userId, expected);
          setSearchedUser(null);
          break;
        case 'deleteUserData':
          response = await adminAPI.deleteUserData(userId, expected);
          await handleUserSelect({ id: userId });
          break;
        case 'deleteStreak':
          response = await adminAPI.deleteUserStreak(userId, expected);
          break;
        case 'deleteAllUsers':
          response = await adminAPI.deleteAllUsers(expected);
          setSearchedUser(null);
          break;
        case 'deleteAllData':
          response = await adminAPI.deleteAllUserData(expected);
          break;
        default:
          break;
      }
      setMessage(response?.data?.message || 'Done');
      setConfirm(null);
      onDataChanged?.();
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setLoadingOp(false);
    }
  };

  const user = searchedUser?.user;
  const counts = searchedUser?.dataCounts;
  const activity = searchedUser?.activity;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
        User management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Look up an account, review activity, and run targeted cleanup actions.
      </Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 2, overflow: 'visible' }}>
        <CardContent sx={{ overflow: 'visible' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <PersonSearchOutlinedIcon color="primary" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Find a user
            </Typography>
          </Stack>
          <UserSearchAutocomplete onUserSelect={handleUserSelect} />
          {loadingUserSearch && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading user…</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {message && (
        <Alert
          severity={/fail|error|not found|cancelled/i.test(message) ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => setMessage('')}
        >
          {message}
        </Alert>
      )}

      {user && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, mb: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {user.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID {user.id}
                  {user.email ? ` · ${user.email}` : ''}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  color={activity?.initialSurveyCompleted ? 'success' : 'default'}
                  label={activity?.initialSurveyCompleted ? 'Initial done' : 'Initial pending'}
                />
                <Chip
                  size="small"
                  color={activity?.finalSurveyCompleted ? 'success' : 'default'}
                  label={activity?.finalSurveyCompleted ? 'Final done' : 'Final pending'}
                />
              </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Stat label="Purchases" value={counts?.purchases_count ?? 0} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stat label="Logs" value={counts?.consumption_logs_count ?? 0} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stat label="Survey answers" value={counts?.survey_responses_count ?? 0} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stat
                  label="Last activity"
                  value={
                    activity?.lastActivityAt
                      ? new Date(activity.lastActivityAt).toLocaleDateString()
                      : '—'
                  }
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stat
                  label="Consumed $"
                  value={`$${Number(activity?.consumedCost || 0).toFixed(2)}`}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stat
                  label="Wasted $"
                  value={`$${Number(activity?.wastedCost || 0).toFixed(2)}`}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="warning"
                disabled={loadingOp}
                onClick={() => openConfirm('deleteUserData', { userId: user.id, username: user.username })}
              >
                Wipe user data
              </Button>
              <Button
                variant="outlined"
                color="warning"
                disabled={loadingOp}
                onClick={() => openConfirm('deleteStreak', { userId: user.id, username: user.username })}
              >
                Reset streak
              </Button>
              <Button
                variant="contained"
                color="error"
                disabled={loadingOp}
                onClick={() => openConfirm('deleteUser', { userId: user.id, username: user.username })}
              >
                Delete user
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'error.light',
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          backgroundColor: 'rgba(211, 47, 47, 0.04)',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberOutlinedIcon color="error" fontSize="small" />
            <Typography sx={{ fontWeight: 700, color: 'error.main' }}>Danger zone</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Bulk destructive actions. Prefer per-user tools above whenever possible.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverOutlinedIcon />}
              disabled={loadingOp}
              onClick={() => openConfirm('deleteAllData')}
            >
              Delete all user data
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteForeverOutlinedIcon />}
              disabled={loadingOp}
              onClick={() => openConfirm('deleteAllUsers')}
            >
              Delete all users
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <AppConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title="Confirm destructive action"
        tone="warning"
        icon={<WarningAmberOutlinedIcon />}
        presentation="centered"
        primaryAction={{
          label: loadingOp ? 'Working…' : 'Confirm',
          onClick: runConfirmedAction,
          color: 'error',
          disabled: loadingOp || confirmText !== expectedConfirm(),
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setConfirm(null),
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Type <strong>{expectedConfirm()}</strong> to continue
          {confirm?.username ? ` for ${confirm.username}` : ''}.
        </Typography>
        <TextField
          fullWidth
          size="small"
          autoFocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={expectedConfirm()}
        />
      </AppConfirmDialog>
    </Box>
  );
}
