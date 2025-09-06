import React, { useState, useEffect, useRef } from 'react';
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
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { adminAPI } from '../api';

const UserSearchAutocomplete = ({ onUserSelect, placeholder = "Search by User ID or Username..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search function
  const searchUsers = async (query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await adminAPI.searchUsers(query, 10);
      setSuggestions(response.data);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching users:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search requests
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Handle input change
  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSearchTerm(user.id.toString());
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onUserSelect(user);
  };

  // Handle clear
  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onUserSelect(null);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === 'Enter' && searchTerm.trim()) {
        // Try to search with current term
        const numericId = parseInt(searchTerm.trim());
        if (!isNaN(numericId)) {
          handleUserSelect({ id: numericId, username: `User ${numericId}` });
        }
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
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
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
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

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        ref={inputRef}
        fullWidth
        value={searchTerm}
        onChange={handleInputChange}
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
                <IconButton
                  size="small"
                  onClick={handleClear}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
          }
        }}
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          ref={suggestionsRef}
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: 300,
            overflow: 'auto',
            mt: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <List dense sx={{ p: 0 }}>
            {suggestions.map((user, index) => (
              <ListItem
                key={user.id}
                onClick={() => handleUserSelect(user)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? 'action.hover' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderBottom: index < suggestions.length - 1 ? '1px solid' : 'none',
                  borderBottomColor: 'divider',
                }}
              >
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <ListItemText
                  primary={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* No results message */}
      {showSuggestions && searchTerm && suggestions.length === 0 && !loading && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            mt: 0.5,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            No users found matching "{searchTerm}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default UserSearchAutocomplete;
