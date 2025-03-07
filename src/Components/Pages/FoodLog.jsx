// @ts-nocheck
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

const FoodLog = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [showForm, setShowForm] = useState(false)
  const [newFoodItem, setNewFoodItem] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    quantityType: "",
  });
  const [quantityTypes, setQuantityTypes] = useState([]);
  const fetchFoodItems = async () => {
    try {
      const currentDate = moment().format("YYYY-MM-DD");
      const params = { date: currentDate, user_id: 1 };  // Pass the current date as a query parameter
  
      const response = await axios.get("http://localhost:5001/food-items", {
        params,
    
      });
  
      console.log("response", response);
      setFoodItems(response.data);  // Make sure to set the food items from the response
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };
  const fetchQuantityTypes = async () => {
    try {
      const response = await axios.get("http://localhost:5001/quantity-types");
      setQuantityTypes(response.data);
    } catch (error) {
      console.error("Error fetching quantity types:", error);
    }
  };
  useEffect(() => {
   

    fetchFoodItems();
    fetchQuantityTypes();
  }, []);  // Empty dependency array means it runs once when the component mounts

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post("http://localhost:5001/food-items", 
        {
          ...newFoodItem,
          quantity_type_id: newFoodItem.quantityType,
        },
        {
          withCredentials: true,  // Include the JWT token with the request
        }
      );
      
      setNewFoodItem({
        name: "",
        category: "",
        price: "",
        quantity: "",
        quantityType: "",
      });
      fetchFoodItems();  // Fetch food items again after adding a new one
    } catch (error) {
      console.error("Error adding food item:", error);
    }
  };

  return (
    <div>
      <h1>Food Log</h1>

      {/* Display current food items */}
      <ul>
        {foodItems && foodItems.map((item) => (
          <li key={item.id}>
            {item.name} - {item.quantity} {item.quantity_type} - ${item.price} - {item.purchase_date}
          </li>
        ))}
      </ul>

      {/* Add Food Item Form */}
      <button onClick={() => setShowForm(true)}>+</button>
{showForm &&  <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Food Name"
          value={newFoodItem.name}
          onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Category"
          value={newFoodItem.category}
          onChange={(e) => setNewFoodItem({ ...newFoodItem, category: e.target.value })}
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
        <select
          value={newFoodItem.quantityType}
          onChange={(e) => setNewFoodItem({ ...newFoodItem, quantityType: e.target.value })}
        >
          {quantityTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <button type="submit">Add Food Item</button>
      </form>}
     
    </div>
  );
};

export default FoodLog;
