/* eslint-disable react/prop-types */
import React from "react";
import dayjs from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import { foodPurchaseAPI, foodDataAPI } from "../../api";
import FoodItemSearchDropdown from "../SearchFoodItems";
import { getCurrentUserId } from "../../utils/authUtils";
import { Alert, Snackbar } from "@mui/material";
function AddNewPurchase({
  foodItems,
  fetchFoodItems,
  fetchFoodPurchases,
  selectedDate,
  setLoggingPurchase,
}) {
  const [quantityTypes, setQuantityTypes] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);
  const [showNewFoodForm, setShowNewFoodForm] = useState(false);
  const [hideNew, setHideNew] = useState(false);
  const [showDateConfirmation, setShowDateConfirmation] = useState(false);
  const [pendingFoodItem, setPendingFoodItem] = useState(null);
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

    try {
      setLoading(true);
      await foodPurchaseAPI.addFoodItem({
        ...newFoodItem,
        user_id: userId,
      });

      setNewFoodItem(initialNewFoodItem);
      fetchFoodItems();
      setShowNewFoodForm(false);
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
      });

      console.log(response.data);
      fetchFoodPurchases();
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
    }
    setShowDateConfirmation(false);
    setPendingFoodItem(null);
  };

  useEffect(() => {
    fetchFoodCategories();
    fetchFoodItems();
    fetchQuantityTypes();
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 600,
        height:"100vh",
        mx: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxSizing: "border-box",
        padding:"16px"
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
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
          variant="subtitle1"
          sx={{ flexGrow: 1, textAlign: "center" }}
        >
          Add Purchase
        </Typography>
        {!showNewFoodForm && !hideNew && (
          <Button
            style={{
              position: "absolute",
              top: "4px",
              zIndex: "9999999",
              right: "4px",
            }}
            variant="contained"
            size="small"
            onClick={() => setShowNewFoodForm(true)}
            startIcon={<AddIcon />}
          >
            New
          </Button>
        )}
      </Stack>

      {/* Search / Add to purchase */}
      <Box sx={{height:"100%", maxHeight:"85vh", overflow:"auto"}}>
        <FoodItemSearchDropdown
          setHideNew={setHideNew}
          foodItems={foodItems}
          open={true}
          handleAddToPurchase={handleAddToPurchase}
        />
      </Box>

      {/* New Food Modal */}
      <Modal
        open={showNewFoodForm}
        onClose={() => setShowNewFoodForm(false)}
        aria-labelledby="add-new-food-form"
        aria-describedby="form-to-add-new-food-item"
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

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  label="Category"
                  value={newFoodItem.category_id || ""}
                  onChange={(e) =>
                    setNewFoodItem((f) => ({
                      ...f,
                      category_id: e.target.value,
                    }))
                  }
                  required
                >
                  <MenuItem value="" disabled>
                    Select a category
                  </MenuItem>
                  {foodCategories.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="quantity-type-label">Quantity Type</InputLabel>
                <Select
                  labelId="quantity-type-label"
                  label="Quantity Type"
                  value={newFoodItem.quantity_type_id || ""}
                  onChange={(e) =>
                    setNewFoodItem((f) => ({
                      ...f,
                      quantity_type_id: e.target.value,
                    }))
                  }
                  required
                >
                  <MenuItem value="" disabled>
                    Select a quantity type
                  </MenuItem>
                  {quantityTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
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

       {/* Date Confirmation Modal */}
       <Dialog
         open={showDateConfirmation}
         onClose={() => setShowDateConfirmation(false)}
         maxWidth="sm"
         fullWidth
         sx={{
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
             fullWidth={{ xs: true, sm: false }}
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
             fullWidth={{ xs: true, sm: false }}
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
