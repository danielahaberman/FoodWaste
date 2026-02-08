/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Divider,
  Chip,
  Box,
  Grid,
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MobileSelect from "./MobileSelect";
import { useMediaQuery, useTheme } from "@mui/material";

function AddPurchaseCard({ item, handleAddPurchase, setSelectedItem, quantityTypes, foodCategories }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentItem, setCurrentItem] = useState(item);
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [cost, setCost] = useState(() => {
    const parsed = parseFloat(item.price);
    // Avoid defaulting to 0 (users accidentally submit $0 purchases).
    // If there's no meaningful price, start blank.
    return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "";
  });
  const [error, setError] = useState("");

  // Update currentItem when item prop changes
  useEffect(() => {
    // If category name exists but category_id doesn't, try to find matching category
    let updatedItem = { ...item };
    if (item.category && !item.category_id && foodCategories && foodCategories.length > 0) {
      const matchingCategory = foodCategories.find(cat => 
        cat.name.toLowerCase() === item.category.toLowerCase() ||
        item.category.toLowerCase().includes(cat.name.toLowerCase()) ||
        cat.name.toLowerCase().includes(item.category.toLowerCase())
      );
      if (matchingCategory) {
        updatedItem.category_id = matchingCategory.id;
        updatedItem.category = matchingCategory.name;
      }
    }
    
    setCurrentItem(updatedItem);
    const parsed = parseFloat(updatedItem.price);
    setCost(Number.isFinite(parsed) && parsed > 0 ? String(parsed) : "");
    setQuantity(updatedItem.quantity || 1);
  }, [item, foodCategories]);


  const handleAdd = () => {
    setError("");
    const quantityNum = parseFloat(quantity);
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      setError("Quantity must be at least 1");
      return;
    }
    const costTrimmed = String(cost).trim();
    const costNum = parseFloat(costTrimmed);
    if (!costTrimmed || !Number.isFinite(costNum)) {
      setError("Please enter a price");
      return;
    }
    if (costNum <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    // For Open Food Facts and OpenNutrition products, ensure category_id and quantity_type_id are set
    if (currentItem.source === 'openfoodfacts' || currentItem.source === 'opennutrition') {
      if (!currentItem.category_id) {
        setError("Please select a category");
        return;
      }
      if (!currentItem.quantity_type_id) {
        setError("Please select a quantity type");
        return;
      }
    }

    // Get quantity_type name from quantity_type_id if available
    const quantityTypeName = currentItem.quantity_type || 
      (currentItem.quantity_type_id && quantityTypes?.find(qt => qt.id === currentItem.quantity_type_id)?.name) || 
      null;

    // Get category name if not set
    const categoryName = currentItem.category || 
      (currentItem.category_id && foodCategories?.find(cat => cat.id === currentItem.category_id)?.name) || 
      null;

    const purchaseData = {
      name: currentItem.name,
      category: categoryName,
      price: costNum,
      quantity: quantityNum,
      quantity_type: quantityTypeName,
      quantity_type_id: currentItem.quantity_type_id,
      category_id: currentItem.category_id,
      barcode: currentItem.barcode, // Include barcode for Open Food Facts products
      // Preserve metadata so the backend can store a snapshot on the purchase.
      image: currentItem.image || currentItem.image_url || null,
      image_url: currentItem.image || currentItem.image_url || null,
      emoji: currentItem.emoji || null,
      brand: currentItem.brand || null,
      source: currentItem.source || null,
      categories_tags: currentItem.categories_tags || null,
      ingredients_text: currentItem.ingredients_text || null,
    };

    handleAddPurchase(purchaseData);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: "100%",
        boxShadow: 2,
        borderRadius: 3,
        boxSizing: "border-box",
        mx: "auto",
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack spacing={{ xs: 2, sm: 2.5 }}>
          {/* Product Image if available, otherwise show emoji */}
          {currentItem.image ? (
            <Box
              sx={{
                width: '100%',
                height: { xs: '160px', sm: '200px' },
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <img
                src={currentItem.image}
                alt={currentItem.name}
                loading="eager"
                decoding="async"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onError={(e) => {
                  // Fallback to emoji if image fails
                  const fallbackEmoji = currentItem.emoji || '🍽️';
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span style="font-size: 4em;">${fallbackEmoji}</span>`;
                }}
              />
            </Box>
          ) : (
            <Box sx={{ mb: 0.5, fontSize: '4em', textAlign: 'center', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentItem.emoji || '🍽️'}
            </Box>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, fontSize: '1.25rem' }}>
              {currentItem.name}
            </Typography>
            {currentItem.source === 'openfoodfacts' ? (
              <Chip
                icon={<PublicIcon sx={{ fontSize: '18px !important' }} />}
                size="small"
                color="primary"
                sx={{ 
                  height: '28px',
                  width: '28px',
                  minWidth: '28px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  '& .MuiChip-icon': { 
                    fontSize: '18px',
                    color: 'white',
                    margin: 0
                  },
                  '& .MuiChip-label': {
                    display: 'none'
                  }
                }}
              />
            ) : (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '18px !important' }} />}
                size="small"
                color="success"
                sx={{ 
                  height: '28px',
                  width: '28px',
                  minWidth: '28px',
                  '& .MuiChip-icon': { 
                    fontSize: '18px',
                    margin: 0
                  },
                  '& .MuiChip-label': {
                    display: 'none'
                  }
                }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary">
            Category: {currentItem.category || 'Not set'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quantity Type: {currentItem.quantity_type || 'Not set'}
          </Typography>

          <Divider sx={{ my: 1 }} />

          {/* Always show category and quantity type selectors for Open Food Facts and OpenNutrition items */}
          {(currentItem.source === 'openfoodfacts' || currentItem.source === 'opennutrition') && (
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                {foodCategories && (
                  <Grid item xs={6}>
                    <MobileSelect
                      value={currentItem.category_id || ''}
                      onChange={(e) => {
                        const selectedCategory = foodCategories.find(cat => cat.id === e.target.value);
                        const updatedItem = {
                          ...currentItem,
                          category_id: e.target.value,
                          category: selectedCategory?.name || null,
                        };
                        setCurrentItem(updatedItem);
                        if (setSelectedItem) {
                          setSelectedItem(updatedItem);
                        }
                      }}
                      label="Category *"
                      options={foodCategories.map(cat => ({ value: cat.id, label: cat.name }))}
                      required
                      error={!currentItem.category_id}
                      size="small"
                    />
                  </Grid>
                )}
                {quantityTypes && (
                  <Grid item xs={6}>
                    <MobileSelect
                      value={currentItem.quantity_type_id || ''}
                      onChange={(e) => {
                        const selectedQt = quantityTypes.find(qt => qt.id === e.target.value);
                        const updatedItem = {
                          ...currentItem,
                          quantity_type_id: e.target.value,
                          quantity_type: selectedQt?.name || null,
                        };
                        setCurrentItem(updatedItem);
                        if (setSelectedItem) {
                          setSelectedItem(updatedItem);
                        }
                      }}
                      label="Quantity Type *"
                      options={quantityTypes.map(qt => ({ value: qt.id, label: qt.name }))}
                      required
                      error={!currentItem.quantity_type_id}
                      size="small"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
            <TextField
              label="Price *"
              size="small"
              type="number"
              inputProps={{ step: "0.01", min: 0.01 }}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              sx={{ flex: { xs: "1 1 auto", sm: "1 1 140px" }, width: { xs: "100%", sm: "auto" } }}
            />
            <TextField
              label="Quantity"
              size="small"
              type="number"
              inputProps={{ min: 1, step: "any" }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ flex: { xs: "1 1 auto", sm: "1 1 120px" }, width: { xs: "100%", sm: "auto" } }}
            />
          </Stack>

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ 
        justifyContent: "space-between", 
        px: { xs: 1.5, sm: 2 }, 
        py: { xs: 1, sm: 1.5 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 0 },
      }}>
        <Button
          variant="outlined"
          color="secondary"
          size={isMobile ? "medium" : "small"}
          onClick={() => setSelectedItem(null)}
          fullWidth={isMobile}
          sx={{ minHeight: { xs: '44px', sm: 'auto' } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size={isMobile ? "medium" : "small"}
          onClick={handleAdd}
          disabled={
            !String(cost).trim() ||
            parseFloat(cost) <= 0 ||
            parseFloat(quantity) <= 0 ||
            ((currentItem.source === 'openfoodfacts' || currentItem.source === 'opennutrition') && 
             (!currentItem.category_id || !currentItem.quantity_type_id))
          }
          fullWidth={isMobile}
          sx={{ minHeight: { xs: '44px', sm: 'auto' } }}
        >
          Add to Purchase
        </Button>
      </CardActions>
    </Card>
  );
}

export default AddPurchaseCard;
