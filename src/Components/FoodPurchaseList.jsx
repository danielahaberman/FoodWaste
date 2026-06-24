/* eslint-disable react/prop-types */
import React from "react";
import {
  Typography,
  IconButton,
  Box,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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

const cardSx = {
  borderRadius: 2.5,
  border: "none",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
  backgroundColor: "white",
};

const FoodPurchaseList = ({ purchases, deletePurchase, canModify = true }) => {
  return (
    <Stack spacing={1}>
      {purchases.map(
        ({
          id,
          name,
          emoji,
          image,
          quantity,
          quantity_type,
          price,
          category,
          category_name,
        }) => {
          const cat = category || category_name;
          const displayEmoji =
            emoji || (cat ? categoryEmojiMap[cat] : null) || "🍽️";
          const qtyLabel = [quantity, quantity_type].filter(Boolean).join(" ");

          return (
            <Paper key={id} elevation={0} sx={{ ...cardSx, p: 1.25 }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    flexShrink: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    fontSize: "1.5rem",
                  }}
                >
                  {image ? (
                    <Box
                      component="img"
                      src={image}
                      alt=""
                      loading="lazy"
                      sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    displayEmoji
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    noWrap
                    sx={{ fontSize: "0.9rem" }}
                  >
                    {name}
                  </Typography>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{ mt: 0.35, flexWrap: "wrap", gap: 0.5 }}
                  >
                    {qtyLabel && (
                      <Typography variant="caption" color="text.secondary">
                        {qtyLabel}
                      </Typography>
                    )}
                    {cat && (
                      <Chip
                        label={cat}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          backgroundColor: "rgba(0, 0, 0, 0.05)",
                        }}
                      />
                    )}
                  </Stack>
                </Box>

                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{ flexShrink: 0, color: "text.primary", minWidth: 52, textAlign: "right" }}
                >
                  ${Number(price || 0).toFixed(2)}
                </Typography>

                {canModify && (
                  <IconButton
                    aria-label={`Delete ${name}`}
                    size="small"
                    onClick={() => deletePurchase(id)}
                    sx={{
                      flexShrink: 0,
                      color: "error.main",
                      backgroundColor: "rgba(211, 47, 47, 0.08)",
                      "&:hover": { backgroundColor: "rgba(211, 47, 47, 0.15)" },
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          );
        }
      )}
    </Stack>
  );
};

export default FoodPurchaseList;
