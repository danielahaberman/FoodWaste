/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  TextField,
  Button,
  InputAdornment,
  Divider,
} from "@mui/material";

function AddPurchaseCard({ item, handleAddPurchase, setSelectedItem }) {
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(() => {
    const parsed = parseFloat(item.price);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const parsed = parseFloat(item.price);
    setCost(Number.isNaN(parsed) ? 0 : parsed);
  }, [item.price]);

  const handleAdd = () => {
    setError("");
    if (quantity <= 0) {
      setError("Quantity must be at least 1");
      return;
    }
    if (cost < 0) {
      setError("Price cannot be negative");
      return;
    }

    const purchaseData = {
      name: item.name,
      category: item.category,
      price: parseFloat(cost),
      quantity: parseFloat(quantity),
      quantity_type_id: item.quantity_type_id,
      category_id: item.category_id,
    };

    handleAddPurchase(purchaseData);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: "100vw",
        boxShadow: 2,
        borderRadius: 2,
        boxSizing: "border-box",
        // p: 2,
        mx: "auto",
      }}
    >
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight="bold">
            {item.emoji ? `${item.emoji} ` : ""}
            {item.name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Category: {item.category}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quantity Type: {item.quantity_type}
          </Typography>

          <Divider sx={{ my: 1 }} />

          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField
              label="Price"
              size="small"
              type="number"
              inputProps={{ step: "0.01", min: 0 }}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
              }}
              sx={{ flex: "1 1 140px" }}
            />
            <TextField
              label="Quantity"
              size="small"
              type="number"
              inputProps={{ min: 1, step: "any" }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ flex: "1 1 120px" }}
            />
          </Stack>

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => setSelectedItem(null)}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={handleAdd}
          disabled={quantity <= 0 || cost < 0}
        >
          Add to Purchase
        </Button>
      </CardActions>
    </Card>
  );
}

export default AddPurchaseCard;
