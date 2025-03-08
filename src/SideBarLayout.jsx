// @ts-nocheck
import { useState } from "react";
import { AppBar, Toolbar, Typography, List, ListItem, ListItemText, IconButton, Box, Container } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import PageLayout from "./Components/PageLayout";
import zIndex from "@mui/material/styles/zIndex";

const drawerWidth = 120;

const CustomDrawer = ({ open, onClose, children }) => {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left:`0`,
        width: open ? `${drawerWidth}px` : "0px",
        // opacity: open ? 1 : 0,
        height: "100%",
        backgroundColor: "white",
        boxShadow: 3,
        transition: "width 0.3s ease-in-out",
        zIndex: 1300,
      }}
    >
      {open &&  <Box style={{zIndex:"99999"}} sx={{ p: 2 }}>
        <IconButton onClick={onClose}>✖</IconButton>
        {children}
      </Box>}
     
     
    </Box>
  );
};

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
          <ListItemText style={{color:"black"}} primary={item.text} />
        </ListItem>
      ))}
    </List>
  );

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
          position: "relative" 
        }}
      >
        {/* AppBar (Header) */}
        <div style={{backgroundColor:"blue", height:"60px", width:"100%", display:"flex", alignItems:"Center", gap:"50px"}}>
          <MenuIcon onClick={handleDrawerToggle}/>
          <div>
            Home
          </div>
        </div>
        {/* <AppBar position="fixed" sx={{ width: "100%", maxWidth: "600px", marginRight:"auto" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="menu"  sx={{ mr: 2 }}>
              
            </IconButton>
            <Typography variant="h6" noWrap>
              My App
            </Typography>
          </Toolbar>
        </AppBar> */}
        
        {/* Custom Drawer */}
        <CustomDrawer open={mobileOpen} onClose={handleDrawerToggle}>
          {drawer}
        </CustomDrawer>
        
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            mt: 8, 
            width: "100%", 
            maxWidth: "600px", 
            margin: "0 auto" 
          }}
        >
          <Outlet />
        </Box>
      </Container>
    </PageLayout>
  );
};

export default SidebarLayout;
