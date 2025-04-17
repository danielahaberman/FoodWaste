/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
// @ts-nocheck
import React, { useState } from "react";
import { Autocomplete, TextField, Box } from "@mui/material";
import AddPurchaseCard from "./AddPurchaseCard"; // assuming this is your custom card

const FoodItemSearchDropdown = ({ foodItems, handleAddToPurchase, open }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <>
      {open && (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Autocomplete
          open={!selectedItem ? true : undefined}
            options={foodItems}
            getOptionLabel={(option) => option.name}
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Search food items" />}
            onChange={(event, value) => {
              setSelectedItem(value);
            }}
            isOptionEqualToValue={(option, value) => option.name === value.name}
          />

          {selectedItem && (
            <AddPurchaseCard
              key={selectedItem.name}
              handleAddPurchase={(purchase)=>{
                setSelectedItem(null)
                handleAddToPurchase(purchase)
              }}
              item={selectedItem}
            />
          )}
        </Box>
      )}
    </>
  );
};

export default FoodItemSearchDropdown;
