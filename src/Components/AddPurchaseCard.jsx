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
} from "@mui/material";

function AddPurchaseCard({ item, handleAddPurchase }) {
  const [quantity, setQuantity] = useState(1);
  const [cost, setCost] = useState(() => {
    // initialize as number
    const parsed = parseFloat(item.price);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [error, setError] = useState("");

  // keep local state synced if item.price changes externally
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
      price: parseFloat(cost), // ensure float
      quantity: parseFloat(quantity), // allow fractional if desired
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
        maxWidth: 360,
        boxShadow: 1,
        borderRadius: 2,
        p: 1,
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Category: {item.category}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quantity Type: {item.quantity_type}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <TextField
              label="Price"
              size="small"
              type="number"
              inputProps={{ step: "0.01", min: 0 }}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ flex: "1 1 120px" }}
            />
            <TextField
              label="Quantity"
              size="small"
              type="number"
              inputProps={{ min: 1, step: "any" }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ flex: "1 1 100px" }}
            />
          </Stack>

          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          size="small"
          fullWidth
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
