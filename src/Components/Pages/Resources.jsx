import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Link,
  Paper,
  Container
} from '@mui/material';
import {
  Lightbulb,
  Restaurant,
  ShoppingCart,
  Storage,
  Delete,
  Park,
  School,
  Link as LinkIcon,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Resources = () => {
  const navigate = useNavigate();

  const quickTips = [
    "Plan your meals for the week before shopping",
    "Store fruits and vegetables properly to extend freshness",
    "Use the 'first in, first out' rule in your fridge",
    "Freeze leftovers before they go bad",
    "Learn to read expiration dates correctly",
    "Buy only what you need, especially perishables",
    "Use vegetable scraps for homemade broth",
    "Store herbs in water like flowers to keep them fresh"
  ];

  const storageTips = [
    { item: "Bananas", tip: "Store at room temperature, separate from other fruits" },
    { item: "Tomatoes", tip: "Keep at room temperature, not in the fridge" },
    { item: "Potatoes", tip: "Store in a cool, dark place away from onions" },
    { item: "Onions", tip: "Keep in a cool, dry place with good air circulation" },
    { item: "Leafy Greens", tip: "Wrap in damp paper towels and store in crisper" },
    { item: "Berries", tip: "Don't wash until ready to eat, store in original container" },
    { item: "Avocados", tip: "Store at room temperature until ripe, then refrigerate" },
    { item: "Bread", tip: "Store in a cool, dry place or freeze for longer storage" }
  ];

  const externalResources = [
    {
      title: "USDA FoodKeeper App",
      description: "Official app with storage times and tips for thousands of food items",
      url: "https://www.foodsafety.gov/keep-food-safe/foodkeeper-app",
      category: "Storage Guide"
    },
    {
      title: "Love Food Hate Waste",
      description: "UK-based resource with recipes, tips, and portion calculators",
      url: "https://www.lovefoodhatewaste.com/",
      category: "Tips & Recipes"
    },
    {
      title: "Save The Food",
      description: "Natural Resources Defense Council's comprehensive food waste guide",
      url: "https://savethefood.com/",
      category: "Educational"
    },
    {
      title: "FoodPrint",
      description: "Learn about the environmental impact of food waste",
      url: "https://foodprint.org/issues/the-problem-of-food-waste/",
      category: "Environmental"
    },
    {
      title: "Too Good To Go",
      description: "App to buy surplus food from restaurants and stores at reduced prices",
      url: "https://toogoodtogo.com/",
      category: "App"
    },
    {
      title: "Olio",
      description: "Share surplus food with neighbors in your community",
      url: "https://olioex.com/",
      category: "Community"
    },
    {
      title: "EPA Food Recovery Hierarchy",
      description: "Official guide on the best ways to reduce food waste",
      url: "https://www.epa.gov/sustainable-management-food/food-recovery-hierarchy",
      category: "Government"
    },
    {
      title: "Zero Waste Chef",
      description: "Blog with recipes and tips for using every part of your food",
      url: "https://zerowastechef.com/",
      category: "Recipes"
    }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      'Storage Guide': 'primary',
      'Tips & Recipes': 'secondary',
      'Educational': 'info',
      'Environmental': 'success',
      'App': 'warning',
      'Community': 'error',
      'Government': 'default',
      'Recipes': 'primary'
    };
    return colors[category] || 'default';
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1300
    }}>
      {/* Header */}
      <Box sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white', 
        py: 2,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexShrink: 0
      }}>
        <Container 
          maxWidth="md" 
          sx={{ 
            px: { xs: 2, sm: 3 },
            maxWidth: { xs: '100%', sm: '600px' }
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              color="inherit"
              onClick={() => navigate('/home')}
              startIcon={<ArrowBack />}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {/* Back */}
            </Button>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                flexGrow: 1,
                fontSize: { xs: '1.2rem', sm: '1.5rem' }
              }}
            >
              🌱 Food Waste Resources
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box 
        sx={{ 
          flex: 1,
          overflow: 'auto',
          px: { xs: 2, sm: 3 },
          maxWidth: { xs: '100%', sm: '600px' },
          mx: 'auto',
          mt: 3,
          pb: 2
        }}
      >
        {/* Introduction */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, backgroundColor: 'white' }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            color="primary"
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            💡 Why Reduce Food Waste?
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
          >
            Food waste is a major global issue that affects our environment, economy, and society. 
            By reducing food waste, you can save money, help the environment, and ensure more 
            food reaches those who need it.
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
            <Chip 
              icon={<Park />} 
              label="Reduces greenhouse gases" 
              color="success" 
              size="small"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
            />
            <Chip 
              icon={<Storage />} 
              label="Saves money" 
              color="primary" 
              size="small"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
            />
            <Chip 
              icon={<Delete />} 
              label="Conserves resources" 
              color="info" 
              size="small"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}
            />
          </Box>
        </Paper>

        {/* Quick Tips */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
              Quick Tips to Get Started
            </Typography>
            <Grid container spacing={1}>
              {quickTips.map((tip, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Box display="flex" alignItems="flex-start" gap={1} sx={{ mb: 1 }}>
                    <Typography 
                      variant="body2" 
                      color="primary" 
                      sx={{ 
                        mt: 0.5,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}.
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ 
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        lineHeight: 1.4
                      }}
                    >
                      {tip}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Storage Tips */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
              Proper Food Storage Guide
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph
              sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
            >
              Proper storage can significantly extend the life of your food and reduce waste.
            </Typography>
            <Grid container spacing={2}>
              {storageTips.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}>
                    <Typography 
                      variant="subtitle2" 
                      color="primary" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                    >
                      {item.item}
                    </Typography>
                    <Typography 
                      variant="body2"
                      sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                    >
                      {item.tip}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* External Resources */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              <School sx={{ mr: 1, verticalAlign: 'middle' }} />
              Helpful Resources & Links
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph
              sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
            >
              Explore these trusted resources for more detailed information and tools.
            </Typography>
            <Grid container spacing={2}>
              {externalResources.map((resource, index) => (
                <Grid item xs={12} key={index}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: { xs: 1.5, sm: 2 }, 
                      '&:hover': { 
                        backgroundColor: 'action.hover',
                        cursor: 'pointer'
                      },
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => window.open(resource.url, '_blank')}
                  >
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <LinkIcon color="action" sx={{ mt: 0.5, fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                      <Box flexGrow={1}>
                        <Box 
                          display="flex" 
                          alignItems="center" 
                          gap={1} 
                          mb={1}
                          flexDirection={{ xs: 'column', sm: 'row' }}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                        >
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="bold"
                            sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
                          >
                            {resource.title}
                          </Typography>
                          <Chip 
                            label={resource.category} 
                            color={getCategoryColor(resource.category)}
                            size="small"
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
                        >
                          {resource.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Local Resources */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              color="primary"
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              <Restaurant sx={{ mr: 1, verticalAlign: 'middle' }} />
              Local Community Resources
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              paragraph
              sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
            >
              Consider these local options to reduce food waste in your community.
            </Typography>
            <List sx={{ px: { xs: 0, sm: 1 } }}>
              <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <Delete color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Food Banks & Pantries"
                  secondary="Donate excess food to local food banks to help those in need"
                  primaryTypographyProps={{ 
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 'bold'
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                />
              </ListItem>
              <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <ShoppingCart color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Community Gardens"
                  secondary="Join or start a community garden to share fresh produce"
                  primaryTypographyProps={{ 
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 'bold'
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                />
              </ListItem>
              <ListItem sx={{ px: { xs: 0, sm: 2 } }}>
                <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                  <Storage color="primary" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Composting Programs"
                  secondary="Check with your local municipality for composting services"
                  primaryTypographyProps={{ 
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 'bold'
                  }}
                  secondaryTypographyProps={{ 
                    fontSize: { xs: '0.8rem', sm: '0.85rem' }
                  }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            textAlign: 'center', 
            backgroundColor: 'primary.main', 
            color: 'white'
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
          >
            🎯 Ready to Make a Difference?
          </Typography>
          <Typography 
            variant="body1" 
            paragraph
            sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            Start implementing these tips today and track your progress with our app!
          </Typography>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={() => navigate('/home')}
            sx={{ 
              mt: 1,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              py: { xs: 1.5, sm: 1 }
            }}
          >
            Start Tracking Your Food
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default Resources;
