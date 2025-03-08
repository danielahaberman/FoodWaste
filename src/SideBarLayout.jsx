import { useState } from "react";
import { AppBar, Toolbar, Typography, List, ListItem, ListItemText, IconButton, Drawer, Box, Container } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PageLayout from "./Components/PageLayout";

const drawerWidth = 200;

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

  return (
    <PageLayout>
      <Container 
        maxWidth="sm" 
        sx={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh",
          position: "relative",
          backgroundColor: "#FFB37A", 
          borderRadius: "12px",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
          padding: "24px"
        }}
      >
        {/* AppBar (Header) */}
        <AppBar position="static" sx={{ backgroundColor: "#01796F", borderRadius: "8px" }}>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{
                position: "absolute",
                top: "16px",
                left: "16px",
                zIndex: 1000 // Ensure it's always above other content
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontFamily: "Arial, sans-serif", fontWeight: "bold", color: "#F2F3F4" }}>
              My App
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, backgroundColor: "#F2F3F4" } }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px" }}>
            <IconButton onClick={handleDrawerToggle} sx={{ alignSelf: "flex-end" }}>
              <CloseIcon />
            </IconButton>
            <List>
              {menuItems.map((item) => (
                <ListItem button key={item.text} onClick={() => navigate(item.path)}>
                  <ListItemText primary={item.text} sx={{ textAlign: "center", fontFamily: "Arial, sans-serif", fontWeight: "bold", color: "black" }} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            mt: 2, 
            width: "100%", 
            maxWidth: "600px", 
            textAlign: "center" 
          }}
        >
          <Outlet />
        </Box>
      </Container>
    </PageLayout>
  );
};

export default SidebarLayout;
