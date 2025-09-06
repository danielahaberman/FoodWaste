/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const categoryEmojiMap = {
  Fruits: "🍎",
  Vegetables: "🥦",
  Bakery: "🍞",
  Dairy: "🥛",
  Meat: "🥩",
  Seafood: "🐟",
  Grains: "🌾",
  "Canned Goods": "🥫",
  Frozen: "🧊",
  Beverages: "🥤",
  Juice: "🧃",
  Snacks: "🍿",
  Condiments: "🧂",
  Spices: "🧂",
  Pantry: "📦",
  Deli: "🥪",
  "Prepared Foods": "🍱",
  Breakfast: "🍳",
  Sauces: "🍝",
  Baking: "🧁",
  "Oils & Vinegars": "🫒",
  Household: "🏠",
};

const FoodPurchaseList = ({ purchases, deletePurchase, canModify = true }) => {
  const [activeId, setActiveId] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (listRef.current && !listRef.current.contains(event.target)) {
        setActiveId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <List ref={listRef} disablePadding>
      {purchases.map(({ id, name, emoji, quantity, quantity_type, price, purchase_date, category, category_name }) => {
        const isActive = activeId === id;
        const cat = category || category_name;
        const displayEmoji = emoji || (cat ? categoryEmojiMap[cat] : null) || "🍽️";

        return (
          <React.Fragment key={id}>
            <ListItemButton
              onClick={() => setActiveId(isActive ? null : id)}
              sx={{
                bgcolor: isActive ? "action.selected" : "rgba(255, 255, 255, 0.95)",
                py: 1.5,
                px: 2,
                position: "relative",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.98)" },
                borderRadius: 1,
                mb: 1,
                mx: 2, // Add horizontal margin to show background
                backdropFilter: "blur(10px)",
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    color="text.primary"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    {/* Emoji or category fallback */}
                    <Box component="span" aria-label="emoji" role="img" sx={{ fontSize: "1.3em", display:'inline-flex', alignItems:'center' }}>
                      {displayEmoji}
                    </Box>
                    {name}
                  </Typography>
                }
                secondary={
                  <Box display="flex" gap={2} flexWrap="wrap" mt={0.5}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {quantity} {quantity_type} — ${Number(price || 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {new Date(purchase_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                  </Box>
                }
              />
              {isActive && (
                <IconButton
                  aria-label="delete purchase"
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canModify) {
                      deletePurchase(id);
                      setActiveId(null);
                    }
                  }}
                  disabled={!canModify}
                  title={!canModify ? "Can only delete food from the past 7 days" : "Delete this food item"}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: canModify ? "error.main" : "action.disabled",
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </ListItemButton>
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default FoodPurchaseList;
