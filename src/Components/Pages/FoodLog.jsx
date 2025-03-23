 
/* eslint-disable no-unused-vars */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import PageLayout from "../PageLayout";
import AddPurchaseCard from "../AddPurchaseCard";
const FoodLog = () => {
  const [foodPurchases, setFoodPurchases] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const initialNewFoodItem = {
    name: "",
    category_id: null,
    price: "",
    quantity: "",
    quantity_type_id: null,
  }
  const [newFoodItem, setNewFoodItem] = useState(initialNewFoodItem);
  const [quantityTypes, setQuantityTypes] = useState([]);
  const [foodCategories, setFoodCategories] = useState([]);

  // Fetches all food items (without date filter)
  const fetchFoodItems = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get("http://localhost:5001/food-items", {
        params,
      });
      setFoodItems(response.data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  // Fetches food purchases with optional date filtering
  const fetchFoodPurchases = async () => {
    try {
      const currentDate = moment().format("YYYY-MM-DD");
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get("http://localhost:5001/food-purchases", {
        params,
      });
      setFoodPurchases(response.data);
    } catch (error) {
      console.error("Error fetching food purchases:", error);
    }
  };

  const fetchQuantityTypes = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get("http://localhost:5001/quantity-types", {
        params,
      });
      setQuantityTypes(response.data);
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
  };

  const fetchFoodCategories = async () => {
    try {
      const params = { user_id: localStorage.getItem("userId") };
      const response = await axios.get("http://localhost:5001/food-categories", {
        params,
      });
      setFoodCategories(response.data);
    } catch (error) {
      console.error("Error fetching food categories:", error);
    }
  };

  useEffect(() => {
    fetchFoodCategories();
    fetchFoodItems();
    fetchFoodPurchases();
    fetchQuantityTypes();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(
        "http://localhost:5001/add-food-item",
        {
          ...newFoodItem,
          user_id: localStorage.getItem("userId"),
        },
        {
          withCredentials: true,
        }
      );

      setNewFoodItem(initialNewFoodItem);
      fetchFoodItems();
      setShowForm(false);
    } catch (error) {
      console.error("Error adding food item:", error);
    }
  };
  const handleAddToPurchase = async (foodItem) => {
    try {
      const response = await axios.post(
        "http://localhost:5001/purchase",
        {
          user_id: localStorage.getItem("userId"),
          name: foodItem.name,
          category: foodItem.category,
          category_id: foodItem.category_id,  // Send category_id here
          price: foodItem.price,
          quantity: foodItem.quantity,
          quantity_type: foodItem.quantity_type,
          purchase_date: new Date().toISOString(),
        },
        { withCredentials: true }
      );
      console.log(response.data);
      fetchFoodPurchases(); // Refresh the list of purchases after adding the new purchase
     
    } catch (error) {
      console.error("Error adding purchase:", error);
    }
  };
console.log("newFood", newFoodItem)
  return (
    <div>
      <h1>Food Log</h1>

      {/* Display current food purchases */}
      <h2>Purchases</h2>
      <ul>
        {foodPurchases.map((item) => (
       <li key={item.id}>
       {item.name} - {item.quantity} {item.quantity_type} - ${item.price} - {new Date(item.purchase_date).toLocaleString('en-US', {
         year: 'numeric',
         month: 'long',
         day: 'numeric',
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
       })}
     </li>
        ))}
      </ul>
<div style={{marginBottom:"20px"}}>
   {!showForm && <button onClick={() => setShowForm(true)}>Add New Food Type</button>}
</div>
{/* {!showForm && <div>
   <button onClick={() => setShowForm(true)}>Log New Purchase</button>
</div>} */}

     
     

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", gap: "20px" }}>
            <input
              type="text"
              placeholder="Food Name"
              value={newFoodItem.name}
              onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={newFoodItem.price}
              onChange={(e) => setNewFoodItem({ ...newFoodItem, price: e.target.value })}
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newFoodItem.quantity}
              onChange={(e) => setNewFoodItem({ ...newFoodItem, quantity: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "30px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label htmlFor="category">Food Category:</label>
              <select
                id="category"
                value={newFoodItem.category_id || ""}
                onChange={(e) => {
                  console.log("e", e)
                  return(setNewFoodItem({ ...newFoodItem, category_id: e.target.value }))}}
              >
                <option value="" disabled>Select a category</option> {/* Default empty option */}
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
                onChange={(e) => setNewFoodItem({ ...newFoodItem, quantity_type_id: e.target.value })}
              >
                  <option value="" disabled>Select a Quantity</option> {/* Default empty option */}
                {quantityTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button style={{ marginTop: "20px" }} type="submit">
            Add Food Item
          </button>
        </form>
      )}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"Center"}}>
        {foodItems.map((item)=>{
        console.log("item", item)
        return(<AddPurchaseCard key={item.name} handleAddPurchase={handleAddToPurchase} item={item}/>)
      })}
      </div>
      
    </div>
  );
};

export default FoodLog;
