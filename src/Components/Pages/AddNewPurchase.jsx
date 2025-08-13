/* eslint-disable react/prop-types */
import React from "react";
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
} from "@mui/material";
import { useEffect, useState } from "react";
import { foodPurchaseAPI, foodDataAPI } from "../../api";
import FoodItemSearchDropdown from "../SearchFoodItems";
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
    try {
       await foodPurchaseAPI.addFoodItem({
          ...newFoodItem,
          user_id: JSON.parse(localStorage.getItem("userId")),
        });

      setNewFoodItem(initialNewFoodItem);
      fetchFoodItems();
      setShowNewFoodForm(false);
    } catch (error) {
      console.error("Error adding food item:", error);
    }
  };

  const fetchQuantityTypes = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await foodDataAPI.getQuantityTypes(params);
      setQuantityTypes(response.data);
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
  };

  const fetchFoodCategories = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await foodDataAPI.getFoodCategories(params);
      setFoodCategories(response.data);
    } catch (error) {
      console.error("Error fetching food categories:", error);
    }
  };

  const handleAddToPurchase = async (foodItem) => {
    console.log("fooditem", foodItem);
    try {
      const purchaseDate = selectedDate.toISOString();

      const response = await foodPurchaseAPI.addPurchase({
          user_id: localStorage.getItem("userId"),
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
    } catch (error) {
      console.error("Error adding purchase:", error);
    }
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
          size="small"
          onClick={() => setLoggingPurchase(false)}
        >
          <CloseIcon fontSize="small" />
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
          handleAddToPurchase={(purchase) => {
            handleAddToPurchase(purchase);
            setLoggingPurchase(false);
          }}
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
            sx={{
              mt: 1,
              bgcolor: "#FFA500",
              color: "#fff",
              fontWeight: "bold",
            }}
          >
            Add+
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}

export default AddNewPurchase;
