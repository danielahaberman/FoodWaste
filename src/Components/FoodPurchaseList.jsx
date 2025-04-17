/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from "react";
import { List, ListItem, ListItemText, Divider, Typography } from "@mui/material";

const FoodPurchaseList = ({ purchases }) => {
  return (
    <List>
      {purchases.map((item) => (
        <div key={item.id}>
          <ListItem style={{ padding: "4px 8px", minHeight: "60px", backgroundColor:"lightgrey" }}>
            <ListItemText
              primary={
                <Typography variant="body2" style={{ fontWeight: "bold", fontSize: "14px", color:"black" }}>
                  {item.name}
                </Typography>
              }
              secondary={
                <div style={{display:"flex", gap:"10px"}}>
                  <Typography variant="body2" color="textSecondary" style={{ fontSize: "12px" }}>
                    {item.quantity} {item.quantity_type} - ${item.price}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ fontSize: "12px" }}>
                    {new Date(item.purchase_date).toLocaleString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                </div>
              }
            />
          </ListItem>
          <Divider style={{ margin: "0" }} />
        </div>
      ))}
    </List>
  );
};

export default FoodPurchaseList;
