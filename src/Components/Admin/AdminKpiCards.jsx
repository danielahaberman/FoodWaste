import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import { colors, primaryAlpha } from '../../themeColors';

const CARDS = [
  {
    key: 'users',
    label: 'Total Users',
    icon: PeopleAltOutlinedIcon,
    value: (o) => o.totalUsers,
    secondary: () => 'Accounts in range',
  },
  {
    key: 'initial',
    label: 'Initial Survey',
    icon: AssignmentTurnedInOutlinedIcon,
    value: (o) => o.initialSurveyCompleted,
    secondary: (o) => `${o.initialSurveyCompletionRate}% completion`,
  },
  {
    key: 'final',
    label: 'Final Survey',
    icon: FlagOutlinedIcon,
    value: (o) => o.finalSurveyCompleted,
    secondary: (o) => `${o.finalSurveyCompletionRate}% completion`,
  },
  {
    key: 'purchases',
    label: 'Purchases',
    icon: ShoppingBasketOutlinedIcon,
    value: (o) => o.totalPurchases,
    secondary: (o) => `${o.totalResponses} survey responses`,
  },
];

export default function AdminKpiCards({ overview }) {
  if (!overview) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {CARDS.map(({ key, label, icon: Icon, value, secondary }) => (
        <Grid item xs={12} sm={6} md={3} key={key}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2.5,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  backgroundColor: primaryAlpha(0.12),
                  color: colors.primary,
                }}
              >
                <Icon fontSize="small" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
                {value(overview)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {secondary(overview)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
