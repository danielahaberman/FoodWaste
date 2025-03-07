// @ts-nocheck
import { useState } from "react";
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, IconButton, Box,  } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 240;

const SidebarLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: "Home", path: "/" },
    { text: "About", path: "/about" },
    { text: "Contact", path: "/contact" }
  ];

  const drawer = (
    <List>
      {menuItems.map((item) => (
        <ListItem button key={item.text} onClick={() => navigate(item.path)}>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar (Header) */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: "none" } }}>
           <MenuIcon/>
          </IconButton>
          <Typography variant="h6" noWrap>
            My App
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
          display: { xs: "none", sm: "block" }
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: "block", sm: "none" } }}
      >
        {drawer}
      </Drawer>
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: { sm: `${drawerWidth}px` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default SidebarLayout;
