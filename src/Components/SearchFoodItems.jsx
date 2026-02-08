/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Divider,
  Paper,
  InputAdornment,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import AddPurchaseCard from "./AddPurchaseCard";
import BarcodeScanner from "./BarcodeScanner";
import { lookupProductByBarcode } from "../utils/openFoodFacts";
import { getCurrentUserId } from "../utils/authUtils";
import { mapToAppCategory, getSuggestedCategoryName } from "../utils/categoryMapper";
import { mapToAppQuantityType, getSuggestedQuantityTypeName, parseQuantityString } from "../utils/quantityTypeMapper";
import api, { foodPurchaseAPI } from "../api";

const FoodItemSearchDropdown = ({ foodItems, handleAddToPurchase, open, setHideNew, foodCategories, onScannedProduct, quantityTypes, onManualAdd }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [localResults, setLocalResults] = useState([]);
  const [offResults, setOffResults] = useState([]);
  const [popularResults, setPopularResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Manual search function - only called when user clicks search button
  const performUnifiedSearch = async () => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setLocalResults([]);
      setOffResults([]);
      setPopularResults([]);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const response = await api.get("/api/food-items/search", {
        params: {
          term: searchTerm.trim(),
          user_id: userId,
        },
      });

      const data = response.data;
      const local = data.local || [];
      const offRaw = data.openfoodfacts || [];

      // Dedupe logic:
      // - Don't show OFF results that already exist in local results (same name, case-insensitive).
      // - Collapse near-identical OFF results (same name + brand) to avoid clutter.
      const norm = (s) => String(s || '').trim().toLowerCase();
      const localNameSet = new Set(local.map((i) => norm(i.name)).filter(Boolean));

      const seenOffKey = new Set();
      const off = [];
      for (const p of offRaw) {
        const nameKey = norm(p?.name);
        if (!nameKey) continue;
        if (localNameSet.has(nameKey)) continue;

        const brandKey = norm(p?.brand);
        const offKey = `${nameKey}::${brandKey}`;
        if (seenOffKey.has(offKey)) continue;
        seenOffKey.add(offKey);
        off.push(p);
      }

      setLocalResults(local);
      setOffResults(off);
      
      // Fetch and filter popular items based on search term
      try {
        const userId = getCurrentUserId();
        const recentResponse = await foodPurchaseAPI.getRecentPurchases({ user_id: userId, limit: 50 });
        const popularItems = (recentResponse.data || []).filter(item => 
          item.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        );
        setPopularResults(popularItems);
      } catch (err) {
        console.error('Error fetching recent items:', err);
        setPopularResults([]);
      }

      // Handle errors from Open Food Facts search
      if (data.error) {
        if (data.error.type === 'RATE_LIMITED') {
          setSearchError(
            `⚠️ Rate limit exceeded. Please wait ${data.error.retryAfter || 60} seconds before searching again. ` +
            `Your local food items are still available below.`
          );
        } else {
          setSearchError('Unable to search Open Food Facts database. Your local food items are still available.');
        }
      } else {
        setSearchError(null);
      }
    } catch (error) {
      console.error('Error performing unified search:', error);
      setLocalResults([]);
      setOffResults([]);
      setPopularResults([]);
      setSearchError('An error occurred while searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Handle Enter key press in search field
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performUnifiedSearch();
    }
  };

  useEffect(() => {
    setHideNew(!!selectedItem);
  }, [selectedItem]);

  const handleScan = async (barcode) => {
    // Close scanner first
    setScannerOpen(false);
    // Show processing state while looking up the product
    setScanning(true);
    setScanError(null);

    try {
      const result = await lookupProductByBarcode(barcode);

      if (result.success && result.product) {
        // If callback provided, use it (for pre-filling form)
        if (onScannedProduct) {
          onScannedProduct(result.product);
        } else {
          // Otherwise, try to find matching item or create a new one
          const matchingItem = foodItems.find(
            (item) => item.name.toLowerCase() === result.product.name.toLowerCase()
          );

          if (matchingItem) {
            setSelectedItem(matchingItem);
          } else {
            // Create a temporary item from scanned product
            // This will need category mapping
            setScanError('Product found but not in your list. Please add it manually or select a similar item.');
          }
        }
      } else {
        // Handle errors
        if (result.error === 'RATE_LIMITED') {
          setScanError(`Too many requests. Please wait ${result.retryAfter || 60} seconds and try again.`);
        } else if (result.error === 'NOT_FOUND') {
          setScanError('Product not found in database. Please enter details manually.');
        } else {
          setScanError(result.message || 'Failed to lookup product. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      setScanError('An error occurred while processing the barcode. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleScanError = (error) => {
    setScanError(error);
  };
  
  return (
    <>
      {open && (
        <Box display="flex" flexDirection="column" gap={0} width="100%" sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Search Bar with Scan Button */}
          {!selectedItem && (
            <Box sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <TextField
                  variant="outlined"
                  placeholder="Search food items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  size="small"
                  fullWidth
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Search"
                          edge="end"
                          onClick={performUnifiedSearch}
                          disabled={searching || !searchTerm || searchTerm.trim().length < 2}
                          sx={{ mr: -0.5 }}
                        >
                          {searching ? <CircularProgress size={18} /> : <SearchIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-end" },
                    flexShrink: 0,
                  }}
                >
                  {onManualAdd && (
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={onManualAdd}
                      sx={{
                        flex: { xs: 1, sm: "0 0 auto" },
                        whiteSpace: "nowrap",
                        borderRadius: 2,
                        minHeight: 40,
                      }}
                    >
                      Manual
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={() => setScannerOpen(true)}
                    sx={{
                      flex: { xs: 1, sm: "0 0 auto" },
                      whiteSpace: "nowrap",
                      borderRadius: 2,
                      minHeight: 40,
                    }}
                  >
                    Scan
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Scanning/Loading State */}
          {scanning && (
            <Box display="flex" alignItems="center" gap={2} p={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" color="text.secondary">
                Looking up product...
              </Typography>
            </Box>
          )}

          {/* Error Messages */}
          {(scanError || searchError) && (
            <Alert 
              severity={(scanError || searchError)?.includes('Rate limit') ? 'warning' : 'error'}
              onClose={() => {
                setScanError(null);
                setSearchError(null);
              }}
              sx={{ mb: 1 }}
            >
              {scanError || searchError}
            </Alert>
          )}

          {/* Search Results or Selected Item */}
          {selectedItem ? (
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              overflowX: 'hidden',
              minHeight: 0,
              maxHeight: '100%',
              pb: 2.5,
              px: 2.5,
              pt: 2.5,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                },
              },
            }}>
              <AddPurchaseCard
                setSelectedItem={setSelectedItem}
                item={selectedItem}
                quantityTypes={quantityTypes}
                foodCategories={foodCategories}
                handleAddPurchase={(purchase) => {
                  setSelectedItem(null);
                  handleAddToPurchase(purchase);
                }}
              />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={0} sx={{ flex: 1, overflow: 'hidden' }}>
              {/* Loading State - Show when searching and no results yet */}
              {searching && localResults.length === 0 && offResults.length === 0 && popularResults.length === 0 && (
                <Box display="flex" alignItems="center" gap={1.5} p={3} justifyContent="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Searching food items...
                  </Typography>
                </Box>
              )}

              {/* Combined Results: Popular + Local + Open Food Facts */}
              {(popularResults.length > 0 || localResults.length > 0 || offResults.length > 0) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(140px, 1fr))"
                    gap={1.5}
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      pr: 1,
                      pb: 2,
                      '&::-webkit-scrollbar': {
                        width: '6px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '3px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '3px',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        },
                      },
                    }}
                  >
                    {/* Popular Items First (filtered by search) */}
                    {popularResults.map((item) => (
                      <Paper
                        key={`popular-${item.id}`}
                        elevation={2}
                        sx={{
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          border: "1px solid #ffd700",
                          backgroundColor: "#fff9e6",
                          cursor: "pointer",
                          position: "relative",
                          "&:hover": {
                            backgroundColor: "#fff5cc",
                          },
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Product Image if available, otherwise show emoji */}
                        {item.image ? (
                          <Box
                            sx={{
                              width: '100%',
                              height: '80px',
                              mb: 0.75,
                              borderRadius: 1,
                              overflow: 'hidden',
                              backgroundColor: '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span style="font-size: 2em;">${item.emoji || '🍽️'}</span>`;
                              }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ mb: 0.75, fontSize: '2em', textAlign: 'center', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.emoji || '🍽️'}
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "100%" }}>
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.3 }}>
                            {item.name}
                          </Typography>
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            color="success"
                            sx={{ 
                              height: '20px',
                              width: '20px',
                              minWidth: '20px',
                              '& .MuiChip-icon': { 
                                fontSize: '14px',
                                margin: 0
                              },
                              '& .MuiChip-label': {
                                display: 'none'
                              }
                            }}
                          />
                        </Box>
                        {item.category && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                            {item.category}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                    
                    {/* Local Food Items */}
                    {localResults.map((item) => (
                      <Paper
                        key={item.id}
                        elevation={2}
                        sx={{
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          border: "1px solid #e0e0e0",
                          cursor: "pointer",
                          position: "relative",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Product Image if available, otherwise show emoji */}
                        {item.image ? (
                          <Box
                            sx={{
                              width: '100%',
                              height: '80px',
                              mb: 0.75,
                              borderRadius: 1,
                              overflow: 'hidden',
                              backgroundColor: '#f5f5f5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span style="font-size: 2em;">${item.emoji || '🍽️'}</span>`;
                              }}
                            />
                          </Box>
                        ) : (
                          <Box sx={{ mb: 0.75, fontSize: '2em', textAlign: 'center', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.emoji || '🍽️'}
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "100%" }}>
                          <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.3 }}>
                            {item.name}
                          </Typography>
                          <Chip
                            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                            size="small"
                            color="success"
                            sx={{ 
                              height: '20px',
                              width: '20px',
                              minWidth: '20px',
                              '& .MuiChip-icon': { 
                                fontSize: '14px',
                                margin: 0
                              },
                              '& .MuiChip-label': {
                                display: 'none'
                              }
                            }}
                          />
                        </Box>
                        {item.category && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                            {item.category}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                    
                    {/* Loading indicator when local results are shown but Open Food Facts is still loading */}
                    {searching && localResults.length > 0 && offResults.length === 0 && (
                      <Box
                        sx={{
                          gridColumn: '1 / -1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          p: 2,
                          backgroundColor: '#f5f9ff',
                          borderRadius: 1,
                          border: '1px solid #e3f2fd',
                        }}
                      >
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Searching Open Food Facts database for more results...
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Open Food Facts Results Appended Below */}
                    {offResults.map((product, index) => (
                        <Paper
                          key={product.barcode || `off-${index}`}
                          elevation={1}
                          sx={{
                            p: 1.5,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            border: "2px solid #1976d2",
                            backgroundColor: "#f5f9ff",
                            cursor: "pointer",
                            position: "relative",
                            "&:hover": {
                              backgroundColor: "#e3f2fd",
                              borderColor: "#1565c0",
                            },
                          }}
                          onClick={() => {
                            const suggestedCategoryId = mapToAppCategory(product.categories_tags, foodCategories);
                            const suggestedCategoryName = suggestedCategoryId
                              ? (foodCategories.find(c => c.id === suggestedCategoryId)?.name || null)
                              : null;

                            const suggestedQuantityTypeId = mapToAppQuantityType(product.quantity, quantityTypes);
                            const suggestedQuantityTypeName = suggestedQuantityTypeId
                              ? (quantityTypes.find(q => q.id === suggestedQuantityTypeId)?.name || null)
                              : null;

                            // Create a temporary food item object that can be used with AddPurchaseCard
                            // Don't auto-fill category or quantity - let user select manually
                            const tempFoodItem = {
                              name: product.name,
                              category: suggestedCategoryName, // Suggested from OFF tags (user can override)
                              category_id: suggestedCategoryId, // Suggested from OFF tags (user can override)
                              price: 0,
                              quantity: 1, // Default to 1, let user adjust
                              quantity_type: suggestedQuantityTypeName, // Suggested from OFF quantity string (user can override)
                              quantity_type_id: suggestedQuantityTypeId, // Suggested from OFF quantity string (user can override)
                              source: 'openfoodfacts',
                              barcode: product.barcode,
                              brand: product.brand || '',
                              categories_tags: product.categories_tags || [],
                              ingredients_text: product.ingredients || '',
                              image: product.image, // Include image URL
                              // Store the full product data for reference
                              _offProduct: product,
                            };
                            setSelectedItem(tempFoodItem);
                          }}
                        >
                          {/* Product Image */}
                          {product.image && (
                            <Box
                              sx={{
                                width: '100%',
                                height: '80px',
                                mb: 0.75,
                                borderRadius: 1,
                                overflow: 'hidden',
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                fetchpriority="low"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain',
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </Box>
                          )}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, width: "100%" }}>
                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.3 }}>
                              {product.name}
                            </Typography>
                            <Chip
                              icon={<PublicIcon sx={{ fontSize: '14px !important' }} />}
                              size="small"
                              color="primary"
                              sx={{ 
                                height: '20px',
                                width: '20px',
                                minWidth: '20px',
                                backgroundColor: '#1976d2',
                                color: 'white',
                                '& .MuiChip-icon': { 
                                  fontSize: '14px',
                                  color: 'white',
                                  margin: 0
                                },
                                '& .MuiChip-label': {
                                  display: 'none'
                                },
                                '&:hover': {
                                  backgroundColor: '#1565c0',
                                }
                              }}
                            />
                          </Box>
                          {product.brand && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                              {product.brand}
                            </Typography>
                          )}
                          {product.categories && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                              {product.categories.split(',').slice(0, 2).join(', ')}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}

              {/* No Results Message - Only show after a search has been performed */}
              {hasSearched && localResults.length === 0 && offResults.length === 0 && popularResults.length === 0 && !searching && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No food items found. Try a different search term or add a new item.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Barcode Scanner Dialog */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
        onError={handleScanError}
        onManualAdd={() => {
          setScannerOpen(false);
          if (onManualAdd) onManualAdd();
        }}
      />
    </>
  );
};

export default FoodItemSearchDropdown;
