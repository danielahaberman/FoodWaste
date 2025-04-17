/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { Button } from "@mui/material";
function AddPurchaseCard({ item, handleAddPurchase }) {
  const [quantity, setQuantity] = useState(1); // Default quantity
  const [cost, setCost] = useState(item.price); // Default cost from item

  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  const handleCostChange = (e) => {
    setCost(e.target.value);
  };

  const handleAdd = () => {
    const purchaseData = {
      name: item.name,
      category: item.category,
      price: parseFloat(cost), // Ensure price is a float
      quantity: quantity,
      quantity_type_id: item.quantity_type_id, // Use the quantity_type_id from the item
      category_id: item.category_id, // Use the category_id from the item
    };
  
    console.log("Adding purchase:", purchaseData); // Debugging line
  
    handleAddPurchase(purchaseData);// Close the card after adding the purchase
  };
console.log("item", item)
  return (
    <div>
      {/* Display the food item name, and toggle to show more details */}
      {/* {!openCard && (
        <div
          onClick={() => setOpenCard(true)}
          style={{
            padding: "10px",
            border: "1px solid",
            width: "100px",
            cursor: "pointer",
          }}
        >
          {item.name}
        </div>
      )} */}

      {/* Show details when the card is open */}
      <div style={{ padding: "10px", border: "1px solid", width: "200px" }}>
          <div>
            <strong>Name:</strong> {item.name}
          </div>
          <div>
            <strong>Category:</strong> {item.category}
          </div>
          <div>
            <strong>Price:</strong>{" "}
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={handleCostChange}
              style={{ width: "80px", marginLeft: "5px" }}
            />
          </div>
          <div>
            <strong>Quantity Type:</strong> {item.quantity_type}
          </div>
          <div>
            <strong>Quantity:</strong>{" "}
            <input
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              style={{ width: "50px", marginLeft: "5px" }}
            />
          </div>
          
          {/* Button to trigger adding to the purchase list */}
          <button onClick={handleAdd} style={{ marginTop: "10px" }}>
            Add to Purchase
          </button>
        </div>
    </div>
  );
}

export default AddPurchaseCard;
