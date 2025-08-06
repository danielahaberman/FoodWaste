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

const FoodPurchaseList = ({ purchases, deletePurchase }) => {
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
      {purchases.map(({ id, name, emoji, quantity, quantity_type, price, purchase_date }) => {
        const isActive = activeId === id;

        return (
          <React.Fragment key={id}>
            <ListItemButton
              onClick={() => setActiveId(isActive ? null : id)}
              sx={{
                bgcolor: isActive ? "action.selected" : "background.paper",
                py: 1.5,
                px: 2,
                position: "relative",
                "&:hover": { bgcolor: "action.hover" },
                borderRadius: 1,
                mb: 1,
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
                    {/* Show emoji if exists */}
                    {emoji && (
                      <Box component="span" aria-label="emoji" role="img" sx={{ fontSize: "1.3em" }}>
                        {emoji}
                      </Box>
                    )}
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
                    deletePurchase(id);
                    setActiveId(null);
                  }}
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "error.main",
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </ListItemButton>
            <Divider component="li" sx={{ margin: 0 }} />
          </React.Fragment>
        );
      })}
    </List>
  );
};

export default FoodPurchaseList;
