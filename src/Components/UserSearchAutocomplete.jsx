import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { adminAPI } from '../api';

const UserSearchAutocomplete = ({
  onUserSelect,
  placeholder = 'Search by User ID or Username...',
  defaultLimit = 15,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [defaultUsers, setDefaultUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  const loadDefaultUsers = useCallback(async () => {
    try {
      const response = await adminAPI.searchUsers('', defaultLimit);
      setDefaultUsers(response.data || []);
      setHasLoadedDefaults(true);
      return response.data || [];
    } catch (error) {
      console.error('Error loading default users:', error);
      setDefaultUsers([]);
      setHasLoadedDefaults(true);
      return [];
    }
  }, [defaultLimit]);

  useEffect(() => {
    // Show recent users immediately so admins don't have to guess who to search
    loadDefaultUsers().then((users) => {
      setSuggestions(users);
      setShowSuggestions(true);
    });
  }, [loadDefaultUsers]);

  const searchUsers = async (query) => {
    const trimmed = (query || '').trim();

    if (!trimmed) {
      const users = defaultUsers.length ? defaultUsers : await loadDefaultUsers();
      setSuggestions(users);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.searchUsers(trimmed, 10);
      setSuggestions(response.data || []);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (showSuggestions) {
        searchUsers(searchTerm);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchUsers closes over latest defaults
  }, [searchTerm, showSuggestions]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
    setShowSuggestions(true);
  };

  const handleFocus = async () => {
    setShowSuggestions(true);
    if (!searchTerm.trim()) {
      const users = defaultUsers.length ? defaultUsers : await loadDefaultUsers();
      setSuggestions(users);
    }
  };

  const handleUserSelect = (user) => {
    setSearchTerm(user.username || user.id.toString());
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onUserSelect(user);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions(defaultUsers);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    onUserSelect(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === 'Enter' && searchTerm.trim()) {
        const numericId = parseInt(searchTerm.trim(), 10);
        if (!Number.isNaN(numericId)) {
          handleUserSelect({ id: numericId, username: `User ${numericId}` });
        }
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleUserSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        listRef.current &&
        !listRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showingDefaults = showSuggestions && !searchTerm.trim();
  const showList = showSuggestions && (suggestions.length > 0 || loading || hasLoadedDefaults);
  const showEmptySearch =
    showSuggestions &&
    searchTerm.trim() &&
    suggestions.length === 0 &&
    !loading;

  return (
    <Box sx={{ position: 'relative', width: '100%', overflow: 'visible' }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading && <CircularProgress size={16} />}
              {searchTerm && (
                <IconButton size="small" onClick={handleClear} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          },
        }}
      />

      {showList && (
        <Paper
          ref={listRef}
          elevation={3}
          sx={{
            // In-flow (not absolute) so parent cards can't clip the list
            position: 'relative',
            zIndex: 2,
            maxHeight: 320,
            overflow: 'auto',
            mt: 1,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {showingDefaults && (
            <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Recent users — click one or type to filter
              </Typography>
            </Box>
          )}

          {loading && suggestions.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : suggestions.length > 0 ? (
            <List dense sx={{ p: 0 }}>
              {suggestions.map((user, index) => (
                <ListItem
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor:
                      index === selectedIndex ? 'action.hover' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    borderBottom:
                      index < suggestions.length - 1 ? '1px solid' : 'none',
                    borderBottomColor: 'divider',
                  }}
                >
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText
                    primary={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {user.username || `User ${user.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user.id}
                          {user.created_at
                            ? ` • Created: ${new Date(user.created_at).toLocaleDateString()}`
                            : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                No users available
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {showEmptySearch && (
        <Paper
          elevation={3}
          sx={{
            position: 'relative',
            zIndex: 2,
            mt: 1,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            No users found matching &quot;{searchTerm}&quot;
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default UserSearchAutocomplete;
