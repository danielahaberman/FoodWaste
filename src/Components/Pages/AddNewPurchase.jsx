/* eslint-disable react/prop-types */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Paper, Modal, Box, Button } from "@mui/material";
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

  const initialNewFoodItem = {
    name: "",
    category_id: null,
    price: "",
    quantity: "",
    quantity_type_id: null,
  };

  const [newFoodItem, setNewFoodItem] = useState(initialNewFoodItem);
const API_URL = process.env.REACT_APP_API_URL;
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(
       `${API_URL}//add-food-item` ,
        {
          ...newFoodItem,
          user_id: localStorage.getItem("userId"),
        },
        { withCredentials: true }
      );

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
      const response = await axios.get(`${API_URL}/quantity-types`, { params });
      setQuantityTypes(response.data);
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
  };

  const fetchFoodCategories = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get(`${API_URL}/food-categories`, { params });
      setFoodCategories(response.data);
    } catch (error) {
      console.error("Error fetching food categories:", error);
    }
  };

  const handleAddToPurchase = async (foodItem) => {
    try {
      const purchaseDate = selectedDate.toISOString();

      const response = await axios.post(
        `${API_URL}/purchase`,
        {
          user_id: localStorage.getItem("userId"),
          name: foodItem.name,
          category: foodItem.category,
          category_id: foodItem.category_id,
          price: foodItem.price,
          quantity: foodItem.quantity,
          quantity_type: foodItem.quantity_type,
          purchase_date: purchaseDate,
        },
        { withCredentials: true }
      );

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
    <div>
      <div style={{ marginBottom: "20px", marginTop: "20px" }}>
        <div style={{width:"100px"}}>
             <Button onClick={()=>{
                setLoggingPurchase(false)
             }}>Close</Button>
        </div>
       
        <div>
             {!showNewFoodForm && (
          <Button
            variant="contained"
            onClick={() => setShowNewFoodForm(true)}
          >
            Add New Food Type
          </Button>
        )}
        </div>
       
      </div>

      <Modal
        open={showNewFoodForm}
        onClose={() => setShowNewFoodForm(false)}
        aria-labelledby="add-new-food-form"
        aria-describedby="form-to-add-new-food-item"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "500px",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
          }}
        >
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <input
                type="text"
                placeholder="Food Name"
                value={newFoodItem.name}
                onChange={(e) =>
                  setNewFoodItem({ ...newFoodItem, name: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={newFoodItem.price}
                onChange={(e) =>
                  setNewFoodItem({ ...newFoodItem, price: e.target.value })
                }
              />
              {/* <input
                type="number"
                placeholder="Quantity"
                value={newFoodItem.quantity}
                onChange={(e) =>
                  setNewFoodItem({ ...newFoodItem, quantity: e.target.value })
                }
              /> */}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label htmlFor="category">Food Category:</label>
                <select
                  id="category"
                  value={newFoodItem.category_id || ""}
                  onChange={(e) =>
                    setNewFoodItem({
                      ...newFoodItem,
                      category_id: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {foodCategories.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <label htmlFor="quantity">Quantity Type:</label>
                <select
                  id="quantity"
                  value={newFoodItem.quantity_type_id || ""}
                  onChange={(e) =>
                    setNewFoodItem({
                      ...newFoodItem,
                      quantity_type_id: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Select a quantity unit type
                  </option>
                  {quantityTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                bgcolor: "#FFA500",
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Add+
            </Button>
          </form>
        </Box>
      </Modal>

      <div>
        <FoodItemSearchDropdown
          foodItems={foodItems}
          open={true}
          handleAddToPurchase={(purchase) => {
            handleAddToPurchase(purchase);
            setLoggingPurchase(false);
          }}
        />
      </div>
    </div>
  );
}

export default AddNewPurchase;
