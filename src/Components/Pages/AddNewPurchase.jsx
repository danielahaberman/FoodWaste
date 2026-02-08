/* eslint-disable react/prop-types */
import React from "react";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  Grid,
  Tabs,
  Tab,
  Card,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import { foodPurchaseAPI, foodDataAPI } from "../../api";
import FoodItemSearchDropdown from "../SearchFoodItems";
import AddPurchaseCard from "../AddPurchaseCard";
import MobileSelect from "../MobileSelect";
import { getCurrentUserId } from "../../utils/authUtils";
import { Alert, Snackbar } from "@mui/material";
import { mapToAppCategory } from "../../utils/categoryMapper";
import { mapToAppQuantityType } from "../../utils/quantityTypeMapper";
function AddNewPurchase({
  foodItems,
  fetchFoodItems,
  fetchFoodPurchases,
  selectedDate,
  setLoggingPurchase,
}) {
  const SUB_MODAL_Z_INDEX = 1600; // AddNewPurchase overlay uses zIndex 1500
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [quantityTypes, setQuantityTypes] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [selectedRecentItem, setSelectedRecentItem] = useState(null);
  const [showNewFoodForm, setShowNewFoodForm] = useState(false);
  const [activeView, setActiveView] = useState(0); // 0 = Recents, 1 = Add Food
  const [hideNew, setHideNew] = useState(false);
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [pendingFoodItem, setPendingFoodItem] = useState(null);
  const [newlyCreatedFoodItem, setNewlyCreatedFoodItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const initialNewFoodItem = {
    name: "",
    category_id: null,
    price: "",
    quantity: "",
    quantity_type_id: null,
  };

  const [newFoodItem, setNewFoodItem] = useState(initialNewFoodItem);
  const handleSubmit = async (event) => {
    event.preventDefault();
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to add food items.");
      return;
    }

    // Validate required fields
    if (!newFoodItem.name || !newFoodItem.category_id || !newFoodItem.quantity_type_id) {
      setError("Please fill in all required fields (name, category, and quantity type).");
      return;
    }

    try {
      setLoading(true);
      
      // Create the food item first
      await foodPurchaseAPI.addFoodItem({
        ...newFoodItem,
        user_id: userId,
      });

      // Get category name and quantity type name for potential purchase
      const categoryName = foodCategories.find(cat => cat.id === newFoodItem.category_id)?.name || null;
      const quantityTypeName = quantityTypes.find(qt => qt.id === newFoodItem.quantity_type_id)?.name || null;

      // Store the newly created food item data for the purchase confirmation dialog
      const createdFoodItem = {
        name: newFoodItem.name,
        category: categoryName,
        category_id: newFoodItem.category_id,
        price: parseFloat(newFoodItem.price) || 0,
        quantity: parseFloat(newFoodItem.quantity) || 1,
        quantity_type: quantityTypeName,
        quantity_type_id: newFoodItem.quantity_type_id,
      };

      setNewlyCreatedFoodItem(createdFoodItem);
      
      // Reset form and close modal
      setNewFoodItem(initialNewFoodItem);
      setShowNewFoodForm(false);
      
      // Show confirmation dialog asking if they want to add it as a purchase
      setShowPurchaseConfirmation(true);

      fetchFoodItems();
      setError(null);
    } catch (error) {
      console.error("Error adding food item:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to add food item. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuantityTypes = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const params = { user_id: userId };
      const response = await foodDataAPI.getQuantityTypes(params);
      setQuantityTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching quantity types:", error);
      setError("Failed to load quantity types. Please refresh the page.");
    }
  };

  const fetchFoodCategories = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const params = { user_id: userId };
      const response = await foodDataAPI.getFoodCategories(params);
      setFoodCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching food categories:", error);
      setError("Failed to load food categories. Please refresh the page.");
    }
  };

  const fetchRecentPurchases = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const response = await foodPurchaseAPI.getRecentPurchases({ user_id: userId, limit: 30 });
      setRecentPurchases(response.data || []);
    } catch (error) {
      console.error("Error fetching recent purchases:", error);
      // Optional UX enhancement; don't block add flow
    }
  };

  const handleAddToPurchase = async (foodItem) => {
    
    // Check if selected date is in the past (not today)
    const today = dayjs();
    const isSelectedDateInPast = selectedDate.isBefore(today, 'day');
    
    if (isSelectedDateInPast) {
      // Show confirmation modal for past dates
      setPendingFoodItem(foodItem);
      setShowDateConfirmation(true);
      return;
    }
    
    // If today or future date, proceed normally
    await addFoodToDate(foodItem, selectedDate);
  };

  const addFoodToDate = async (foodItem, date) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to add purchases.");
      return;
    }

    try {
      setLoading(true);
      const purchaseDate = date.format('YYYY-MM-DD');
      const response = await foodPurchaseAPI.addPurchase({
        user_id: userId,
        name: foodItem.name,
        category: foodItem.category,
        category_id: foodItem.category_id,
        price: foodItem.price,
        quantity: foodItem.quantity,
        quantity_type: foodItem.quantity_type,
        quantity_type_id: foodItem.quantity_type_id,
        purchase_date: purchaseDate,
        barcode: foodItem.barcode, // Include barcode if available (from Open Food Facts)
        image_url: foodItem.image, // Include image URL if available (from Open Food Facts)
        brand: foodItem.brand, // Include brand if available (from Open Food Facts)
        source: foodItem.source || 'local', // Include source to distinguish Open Food Facts products
        categories_tags: foodItem.categories_tags, // Include category tags array (from Open Food Facts)
        ingredients_text: foodItem.ingredients_text, // Include ingredients if available (from Open Food Facts)
      });

      fetchFoodPurchases();
      // Refresh food items list in case a new food_item was created
      fetchFoodItems();
      // Refresh recents
      fetchRecentPurchases();
      setLoggingPurchase(false);
      
      // Dispatch task completion event to update streak and task counts
      window.dispatchEvent(new CustomEvent('taskCompleted'));
      setError(null);
    } catch (error) {
      console.error("Error adding purchase:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to add purchase. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDateChoice = async (useToday) => {
    if (pendingFoodItem) {
      const targetDate = useToday ? dayjs() : selectedDate;
      await addFoodToDate(pendingFoodItem, targetDate);
      // Reset form and close modal after purchase is added
      setNewFoodItem(initialNewFoodItem);
      setShowNewFoodForm(false);
    }
    setShowDateConfirmation(false);
    setPendingFoodItem(null);
  };

  const handlePurchaseConfirmation = async (addAsPurchase) => {
    if (addAsPurchase && newlyCreatedFoodItem) {
      // User wants to add it as a purchase
      const purchaseData = {
        ...newlyCreatedFoodItem,
        purchase_date: selectedDate.format('YYYY-MM-DD'),
      };

      // Check if selected date is in the past (not today)
      const today = dayjs();
      const isSelectedDateInPast = selectedDate.isBefore(today, 'day');
      
      if (isSelectedDateInPast) {
        // Show confirmation modal for past dates
        setPendingFoodItem(purchaseData);
        setShowDateConfirmation(true);
      } else {
        // If today or future date, proceed normally
        await addFoodToDate(purchaseData, selectedDate);
      }
    }
    
    // Close the purchase confirmation dialog
    setShowPurchaseConfirmation(false);
    setNewlyCreatedFoodItem(null);
  };

  const handleScannedProduct = (scannedProduct) => {
    // Map Open Food Facts category to app category
    const mappedCategoryId = mapToAppCategory(
      scannedProduct.categories_tags || scannedProduct.categories,
      foodCategories
    );
    
    // Find the category name from the mapped ID
    const categoryName = foodCategories.find(cat => cat.id === mappedCategoryId)?.name || null;

    // Map quantity string to app quantity type (best-effort)
    const mappedQuantityTypeId = mapToAppQuantityType(scannedProduct.quantity, quantityTypes);
    
    // Create a temporary food item object that can be used with AddPurchaseCard
    // This allows Open Food Facts products to be added directly as purchases
    const tempFoodItem = {
      name: scannedProduct.name || "",
      category: categoryName,
      category_id: mappedCategoryId || null,
      price: 0, // User will enter price in AddPurchaseCard
      quantity: scannedProduct.quantity ? parseFloat(scannedProduct.quantity) || 1 : 1,
      quantity_type: mappedQuantityTypeId ? (quantityTypes.find(qt => qt.id === mappedQuantityTypeId)?.name || null) : null,
      quantity_type_id: mappedQuantityTypeId || null,
      source: 'openfoodfacts', // Mark as from Open Food Facts
      barcode: scannedProduct.barcode,
      image: scannedProduct.image, // Include image URL
    };

    // Instead of opening the form, directly show AddPurchaseCard
    // We'll create a temporary item that can be used with handleAddToPurchase
    // But first, we need to ensure they select quantity_type_id
    // So we'll still open the form but with a note that they can add as purchase after
    setNewFoodItem({
      name: scannedProduct.name || "",
      category_id: mappedCategoryId || null,
      price: "", // Price is never in barcode, user must enter
      quantity: scannedProduct.quantity ? parseFloat(scannedProduct.quantity) || "" : "",
      quantity_type_id: mappedQuantityTypeId || null,
    });

    // Open the new food form
    setShowNewFoodForm(true);
    
    // Show success message
    setError(null);
    
    // Optionally show info about ingredients if available
    if (scannedProduct.ingredients) {
      console.log('Scanned product ingredients:', scannedProduct.ingredients);
    }
  };

  useEffect(() => {
    fetchFoodCategories();
    fetchFoodItems();
    fetchQuantityTypes();
    fetchRecentPurchases();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        backgroundColor: 'background.default',
        overflow: "hidden",
      }}
    >
      {/* Header - Sticky */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <IconButton
            aria-label="close"
            size="medium"
            onClick={() => setLoggingPurchase(false)}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, textAlign: "center", fontWeight: 600 }}
          >
            Add Purchase
          </Typography>
          {/* Keep a spacer so the title stays centered */}
          <Box sx={{ width: 48 }} />
        </Stack>
      </Paper>

      {/* Tabs for Recents / Add Food */}
      {!selectedRecentItem && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 2, sm: 2.5 } }}>
          <Tabs 
            value={activeView} 
            onChange={(e, newValue) => setActiveView(newValue)}
            sx={{
              minHeight: '48px',
              '& .MuiTab-root': {
                minHeight: '48px',
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }
            }}
          >
            <Tab label="Your Recents" />
            <Tab label="Add Food" />
          </Tabs>
        </Box>
      )}

      {/* Main Content Area */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Show AddPurchaseCard if popular item is selected */}
        {selectedRecentItem ? (
          <Box sx={{ 
            pb: 2.5,
            px: 2.5,
            pt: 2.5,
            overflowY: 'auto', 
            overflowX: 'hidden',
            flex: 1,
            minHeight: 0,
            maxHeight: '100%',
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
              setSelectedItem={setSelectedRecentItem}
              item={selectedRecentItem}
              quantityTypes={quantityTypes}
              foodCategories={foodCategories}
              handleAddPurchase={(purchase) => {
                setSelectedRecentItem(null);
                handleAddToPurchase(purchase);
              }}
            />
          </Box>
        ) : activeView === 0 ? (
          <Box
            sx={{
              px: 2.5,
              pt: 2,
              pb: 2,
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              minHeight: 0,
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
            {recentPurchases.length === 0 ? (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  px: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No recent purchases yet.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 2,
                }}
              >
                {recentPurchases.map((food, index) => (
                  <Card
                    key={`${food.food_item_id || food.id || food.name}-${index}`}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 0.75,
                    }}
                    onClick={() => {
                      const foodItem = {
                        name: food.name,
                        category: food.category,
                        category_id: food.category_id,
                        price: food.price || 0,
                        quantity: 1,
                        quantity_type: food.quantity_type,
                        quantity_type_id: food.quantity_type_id,
                        emoji: food.emoji,
                        image: food.image,
                      };
                      setSelectedRecentItem(foodItem);
                    }}
                  >
                    <Box sx={{ fontSize: '2em', mb: 0.25 }}>
                      {food.image ? (
                        <img
                          src={food.image}
                          alt={food.name}
                          loading="lazy"
                          decoding="async"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<span style="font-size: 1.5em;">${food.emoji || '🍽️'}</span>`;
                          }}
                        />
                      ) : (
                        food.emoji || '🍽️'
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        lineHeight: 1.3,
                        mt: 0.25,
                      }}
                    >
                      {food.name.length > 15 ? food.name.substring(0, 15) + '...' : food.name}
                    </Typography>
                    {food.purchase_count ? (
                      <Chip
                        label={`${food.purchase_count}x`}
                        size="small"
                        sx={{ mt: 0.25, height: '18px', fontSize: '0.6rem', px: 0.5 }}
                        color="primary"
                        variant="outlined"
                      />
                    ) : null}
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ) : activeView === 1 ? (
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', px: 2.5, minHeight: 0 }}>
            <FoodItemSearchDropdown
              setHideNew={setHideNew}
              foodItems={foodItems}
              open={true}
              handleAddToPurchase={handleAddToPurchase}
              foodCategories={foodCategories}
              onScannedProduct={handleScannedProduct}
              quantityTypes={quantityTypes}
              onManualAdd={() => setShowNewFoodForm(true)}
            />
          </Box>
        ) : null}
      </Box>

      {/* New Food Modal */}
      <Modal
        open={showNewFoodForm}
        onClose={() => setShowNewFoodForm(false)}
        aria-labelledby="add-new-food-form"
        aria-describedby="form-to-add-new-food-item"
        sx={{ zIndex: SUB_MODAL_Z_INDEX }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 500,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Food Item</Typography>
            <IconButton
              aria-label="close"
              size="small"
              onClick={() => setShowNewFoodForm(false)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Divider />

          <Stack spacing={2}>
            <TextField
              label="Food Name"
              value={newFoodItem.name}
              onChange={(e) =>
                setNewFoodItem((f) => ({ ...f, name: e.target.value }))
              }
              fullWidth
              size="small"
              required
            />
            <TextField
              label="Price"
              type="number"
              inputProps={{ step: "0.01" }}
              value={newFoodItem.price}
              onChange={(e) =>
                setNewFoodItem((f) => ({ ...f, price: e.target.value }))
              }
              fullWidth
              size="small"
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <MobileSelect
                  value={newFoodItem.category_id || ""}
                  onChange={(e) =>
                    setNewFoodItem((f) => ({
                      ...f,
                      category_id: e.target.value,
                    }))
                  }
                  label="Category"
                  options={foodCategories.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  required
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <MobileSelect
                  value={newFoodItem.quantity_type_id || ""}
                  onChange={(e) =>
                    setNewFoodItem((f) => ({
                      ...f,
                      quantity_type_id: e.target.value,
                    }))
                  }
                  label="Quantity Type"
                  options={quantityTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  required
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1,
              bgcolor: "#1976d2",
              color: "#fff",
              fontWeight: "bold",
              '&:hover': {
                bgcolor: "#1565c0",
              },
            }}
          >
            {loading ? "Adding..." : "Add+"}
          </Button>
         </Box>
       </Modal>

       {/* Purchase Confirmation Modal */}
       <Dialog
         open={showPurchaseConfirmation}
         onClose={() => handlePurchaseConfirmation(false)}
         maxWidth="sm"
         fullWidth
         sx={{
           zIndex: SUB_MODAL_Z_INDEX,
           '& .MuiDialog-paper': {
             margin: { xs: 2, sm: 3 },
             maxHeight: { xs: '90vh', sm: 'auto' },
             borderRadius: { xs: 2, sm: 3 }
           }
         }}
       >
         <DialogTitle sx={{ 
           textAlign: 'center', 
           color: 'primary.main',
           fontSize: { xs: '1.1rem', sm: '1.25rem' },
           fontWeight: 600,
           px: { xs: 2, sm: 3 },
           pt: { xs: 2, sm: 3 }
         }}>
           ✅ Food Item Added!
         </DialogTitle>
         <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
           <Typography variant="body1" sx={{ 
             mb: 2, 
             textAlign: 'center',
             fontSize: { xs: '0.95rem', sm: '1rem' },
             lineHeight: 1.4
           }}>
             <strong>{newlyCreatedFoodItem?.name}</strong> has been added to your food items.
           </Typography>
           <Typography variant="body2" sx={{ 
             mb: 2, 
             color: 'text.secondary',
             textAlign: 'center',
             fontSize: { xs: '0.9rem', sm: '0.95rem' }
           }}>
             Would you also like to mark it as a purchase for today?
           </Typography>
         </DialogContent>
         <DialogActions sx={{ 
           justifyContent: 'center', 
           pb: { xs: 2, sm: 3 },
           px: { xs: 2, sm: 3 },
           flexDirection: { xs: 'column', sm: 'row' },
           gap: { xs: 1.5, sm: 2 }
         }}>
           <Button
             variant="outlined"
             onClick={() => handlePurchaseConfirmation(false)}
             size="large"
             fullWidth={isMobile}
             sx={{
               minHeight: { xs: 48, sm: 40 },
               fontSize: { xs: '0.95rem', sm: '1rem' },
               py: { xs: 1.5, sm: 1 }
             }}
           >
             No, Just Add Food Item
           </Button>
           <Button
             variant="contained"
             onClick={() => handlePurchaseConfirmation(true)}
             size="large"
             color="primary"
             fullWidth={isMobile}
             sx={{
               minHeight: { xs: 48, sm: 40 },
               fontSize: { xs: '0.95rem', sm: '1rem' },
               py: { xs: 1.5, sm: 1 }
             }}
           >
             Yes, Add as Purchase
           </Button>
         </DialogActions>
       </Dialog>

       {/* Date Confirmation Modal */}
       <Dialog
         open={showDateConfirmation}
         onClose={() => setShowDateConfirmation(false)}
         maxWidth="sm"
         fullWidth
         sx={{
           zIndex: SUB_MODAL_Z_INDEX,
           '& .MuiDialog-paper': {
             margin: { xs: 2, sm: 3 },
             maxHeight: { xs: '90vh', sm: 'auto' },
             borderRadius: { xs: 2, sm: 3 }
           }
         }}
       >
         <DialogTitle sx={{ 
           textAlign: 'center', 
           color: 'warning.main',
           fontSize: { xs: '1.1rem', sm: '1.25rem' },
           fontWeight: 600,
           px: { xs: 2, sm: 3 },
           pt: { xs: 2, sm: 3 }
         }}>
           ⚠️ Adding Food to Previous Day
         </DialogTitle>
         <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1, sm: 2 } }}>
           <Typography variant="body1" sx={{ 
             mb: 2, 
             textAlign: 'center',
             fontSize: { xs: '0.95rem', sm: '1rem' },
             lineHeight: 1.4
           }}>
             You're adding <strong>{pendingFoodItem?.name}</strong> to{' '}
             <strong>{selectedDate.format('MMM D, YYYY')}</strong>
           </Typography>
           <Typography variant="body2" sx={{ 
             mb: 2, 
             color: 'text.secondary',
             textAlign: 'center',
             fontSize: { xs: '0.9rem', sm: '0.95rem' }
           }}>
             Did you mean to add this to today instead?
           </Typography>
           <Typography variant="body2" sx={{ 
             color: 'text.secondary', 
             fontStyle: 'italic',
             textAlign: 'center',
             fontSize: { xs: '0.85rem', sm: '0.9rem' }
           }}>
             Today is {new Date().toLocaleDateString('en-US', { 
               weekday: 'long', 
               year: 'numeric', 
               month: 'long', 
               day: 'numeric' 
             })}
           </Typography>
         </DialogContent>
         <DialogActions sx={{ 
           justifyContent: 'center', 
           pb: { xs: 2, sm: 3 },
           px: { xs: 2, sm: 3 },
           flexDirection: { xs: 'column', sm: 'row' },
           gap: { xs: 1.5, sm: 2 }
         }}>
           <Button
             variant="outlined"
             onClick={() => handleConfirmDateChoice(false)}
             size="large"
             fullWidth={isMobile}
             sx={{
               minHeight: { xs: 48, sm: 40 },
               fontSize: { xs: '0.95rem', sm: '1rem' },
               py: { xs: 1.5, sm: 1 }
             }}
           >
             Keep Selected Date
           </Button>
           <Button
             variant="contained"
             onClick={() => handleConfirmDateChoice(true)}
             size="large"
             color="primary"
             fullWidth={isMobile}
             sx={{
               minHeight: { xs: 48, sm: 40 },
               fontSize: { xs: '0.95rem', sm: '1rem' },
               py: { xs: 1.5, sm: 1 }
             }}
           >
             Add to Today
           </Button>
         </DialogActions>
       </Dialog>

       {/* Error Snackbar */}
       <Snackbar
         open={!!error}
         autoHideDuration={6000}
         onClose={() => setError(null)}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
           {error}
         </Alert>
       </Snackbar>
     </Box>
   );
 }

export default AddNewPurchase;
