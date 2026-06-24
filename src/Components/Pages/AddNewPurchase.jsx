/* eslint-disable react/prop-types */
import React from "react";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
  Paper,
  Chip,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useEffect, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import { foodPurchaseAPI, foodDataAPI } from "../../api";
import FoodItemSearchDropdown from "../SearchFoodItems";
import AddPurchaseCard from "../AddPurchaseCard";
import MobileSelect from "../MobileSelect";
import AppConfirmDialog from "../AppConfirmDialog";
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
    const today = dayjs();
    const isSelectedDateInPast = selectedDate.isBefore(today, 'day');

    if (isSelectedDateInPast) {
      setPendingFoodItem(foodItem);
      setShowDateConfirmation(true);
      return 'pending';
    }

    return addFoodToDate(foodItem, selectedDate);
  };

  const addFoodToDate = async (foodItem, date) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setError("You must be logged in to add purchases.");
      return false;
    }

    try {
      setLoading(true);
      const purchaseDate = date.format('YYYY-MM-DD');
      await foodPurchaseAPI.addPurchase({
        user_id: userId,
        name: foodItem.name,
        category: foodItem.category,
        category_id: foodItem.category_id,
        price: foodItem.price,
        quantity: foodItem.quantity,
        quantity_type: foodItem.quantity_type,
        quantity_type_id: foodItem.quantity_type_id,
        purchase_date: purchaseDate,
        barcode: foodItem.barcode,
        image_url: foodItem.image,
        brand: foodItem.brand,
        source: foodItem.source || 'local',
        categories_tags: foodItem.categories_tags,
        ingredients_text: foodItem.ingredients_text,
      });

      await Promise.all([
        fetchFoodPurchases(),
        fetchFoodItems(),
        fetchRecentPurchases(),
      ]);
      setLoggingPurchase(false);
      window.dispatchEvent(new CustomEvent('taskCompleted'));
      setError(null);
      return true;
    } catch (error) {
      console.error("Error adding purchase:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to add purchase. Please try again.";
      setError(errorMessage);
      return false;
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
        position: "relative",
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            bgcolor: "rgba(255, 255, 255, 0.82)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={36} />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Adding food…
          </Typography>
        </Box>
      )}
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
            disabled={loading}
            sx={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Purchase
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedDate.format('MMM D, YYYY')}
            </Typography>
          </Box>
          <Box sx={{ width: 48 }} />
        </Stack>
      </Paper>

      {/* Tabs for Recents / Add Food */}
      {!selectedRecentItem && (
        <Box sx={{ px: { xs: 2, sm: 2.5 }, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
          <Box
            sx={{
              p: 0.5,
              borderRadius: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }}
          >
            <Tabs
              value={activeView}
              onChange={(e, newValue) => setActiveView(newValue)}
              variant="fullWidth"
              TabIndicatorProps={{ sx: { display: 'none' } }}
              sx={{
                minHeight: 44,
                '& .MuiTabs-flexContainer': { gap: 0.5 },
                '& .MuiTab-root': {
                  minHeight: 44,
                  py: 1,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                    backgroundColor: 'white',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  },
                },
              }}
            >
              <Tab label="Your Recents" disableRipple />
              <Tab label="Add Food" disableRipple />
            </Tabs>
          </Box>
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
              handleAddPurchase={async (purchase) => {
                const ok = await handleAddToPurchase(purchase);
                if (ok === true) {
                  setSelectedRecentItem(null);
                }
              }}
              submitting={loading}
            />
          </Box>
        ) : activeView === 0 ? (
          <Box
            sx={{
              px: { xs: 2, sm: 2.5 },
              pt: 1.5,
              pb: 2,
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              minHeight: 0,
            }}
          >
            {recentPurchases.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                  backgroundColor: 'white',
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No recent purchases yet. Search for food on the Add Food tab.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setActiveView(1)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Add Food
                </Button>
              </Paper>
            ) : (
              <Stack spacing={1}>
                {recentPurchases.map((food, index) => (
                  <Paper
                    key={`${food.food_item_id || food.id || food.name}-${index}`}
                    elevation={0}
                    onClick={() => {
                      setSelectedRecentItem({
                        name: food.name,
                        category: food.category,
                        category_id: food.category_id,
                        price: food.price || 0,
                        quantity: 1,
                        quantity_type: food.quantity_type,
                        quantity_type_id: food.quantity_type_id,
                        emoji: food.emoji,
                        image: food.image,
                      });
                    }}
                    sx={{
                      p: 1.25,
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      backgroundColor: 'white',
                      transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.25}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          flexShrink: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          fontSize: '1.5rem',
                        }}
                      >
                        {food.image ? (
                          <Box
                            component="img"
                            src={food.image}
                            alt=""
                            loading="lazy"
                            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          food.emoji || '🍽️'
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {food.name}
                        </Typography>
                        {food.category && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {food.category}
                          </Typography>
                        )}
                      </Box>
                      {food.purchase_count ? (
                        <Chip
                          label={`${food.purchase_count}×`}
                          size="small"
                          sx={{
                            height: 24,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(25, 118, 210, 0.1)',
                            color: 'primary.main',
                          }}
                        />
                      ) : null}
                      <ChevronRightIcon sx={{ color: 'text.disabled' }} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>
        ) : activeView === 1 ? (
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', px: { xs: 2, sm: 2.5 }, minHeight: 0 }}>
            <FoodItemSearchDropdown
              setHideNew={setHideNew}
              foodItems={foodItems}
              open={true}
              handleAddToPurchase={handleAddToPurchase}
              addingPurchase={loading}
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
            position: isMobile ? "fixed" : "absolute",
            ...(isMobile
              ? {
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  maxWidth: "100%",
                  height: "100dvh",
                  borderRadius: 0,
                  overflow: "auto",
                  pt: "calc(24px + env(safe-area-inset-top, 0px))",
                  pb: "calc(24px + env(safe-area-inset-bottom, 0px))",
                }
              : {
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "90%",
                  maxWidth: 500,
                  borderRadius: 2,
                }),
            bgcolor: "background.paper",
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
              onClick={() => setShowNewFoodForm(false)}
            >
              <CloseIcon />
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
              minHeight: 44,
              '&:hover': {
                bgcolor: "#1565c0",
              },
            }}
          >
            {loading ? "Adding..." : "Add+"}
          </Button>
         </Box>
       </Modal>

       <AppConfirmDialog
         open={showPurchaseConfirmation}
         onClose={() => handlePurchaseConfirmation(false)}
         zIndex={SUB_MODAL_Z_INDEX}
         tone="success"
         icon={<CheckCircleOutlineIcon />}
         title="Food item added!"
         primaryAction={{
           label: "Yes, add as purchase",
           onClick: () => handlePurchaseConfirmation(true),
         }}
         secondaryAction={{
           label: "No, just save the item",
           onClick: () => handlePurchaseConfirmation(false),
         }}
       >
         <Stack spacing={1.25}>
           <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
             <strong>{newlyCreatedFoodItem?.name}</strong> was saved to your food items.
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
             Would you also like to log it as a purchase for today?
           </Typography>
         </Stack>
       </AppConfirmDialog>

       <AppConfirmDialog
         open={showDateConfirmation}
         onClose={() => setShowDateConfirmation(false)}
         zIndex={SUB_MODAL_Z_INDEX}
         tone="warning"
         icon={<WarningAmberRoundedIcon />}
         title="Adding food to a past day"
         primaryAction={{
           label: "Add to today",
           onClick: () => handleConfirmDateChoice(true),
         }}
         secondaryAction={{
           label: "Keep selected date",
           onClick: () => handleConfirmDateChoice(false),
         }}
       >
         <Stack spacing={1.25}>
           <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
             You&apos;re adding <strong>{pendingFoodItem?.name}</strong> to{" "}
             <strong>{selectedDate.format("MMM D, YYYY")}</strong>.
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
             Did you mean to add this to today instead?
           </Typography>
           <Typography
             variant="caption"
             color="text.secondary"
             sx={{ fontStyle: "italic", display: "block" }}
           >
             Today is {dayjs().format("dddd, MMMM D, YYYY")}
           </Typography>
         </Stack>
       </AppConfirmDialog>

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
