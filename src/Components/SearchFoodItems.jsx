/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Stack,
  Divider,
  Paper,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddPurchaseCard from "./AddPurchaseCard";

const FoodItemSearchDropdown = ({ foodItems, handleAddToPurchase, open, setHideNew}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const filteredItems = foodItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
 setHideNew(!!selectedItem)
  }, [selectedItem])
  
  return (
    <>
      {open && (
        <Box display="flex" flexDirection="column" gap={3} width="100%">
          {/* Search Bar */}
          {!selectedItem &&  <TextField
            variant="outlined"
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />}
         

          {/* Search Results or Selected Item */}
          {selectedItem ? (
            <AddPurchaseCard
            setSelectedItem={setSelectedItem}
              item={selectedItem}
              handleAddPurchase={(purchase) => {
                setSelectedItem(null);
                handleAddToPurchase(purchase);
              }}
            />
          ) : (
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
              gap={2}
              maxHeight="100%"
              overflow="auto"
            >
              {filteredItems.map((item) => (
                <Paper
                  key={item.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    border: "1px solid #e0e0e0",
                    cursor: "pointer",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                  onClick={() => setSelectedItem(item)}
                >
                  <Typography variant="subtitle1">
                    {(item.emoji || '🍽️') + ' '}
                    {item.name}
                  </Typography>
                  {item.category && (
                    <Typography variant="body2" color="text.secondary">
                      {item.category}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default FoodItemSearchDropdown;
