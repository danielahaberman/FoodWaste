import React, { useMemo } from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { colors, primaryAlpha } from '../../themeColors';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PALETTE = [
  colors.primary,
  '#2E7D32',
  '#0288D1',
  '#7B1FA2',
  '#F9A825',
  '#5D4037',
  '#00897B',
  '#C62828',
];

function EmptyChart({ label }) {
  return (
    <Box
      sx={{
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Typography variant="body2" color="text.secondary" textAlign="center">
        No {label.toLowerCase()} data for this range
      </Typography>
    </Box>
  );
}

function DistributionCard({ title, rows, variant = 'bar' }) {
  const chartData = useMemo(() => {
    if (!rows?.length) return null;
    const labels = rows.map((r) => r.response || 'Unknown');
    const values = rows.map((r) => Number(r.count) || 0);
    return {
      labels,
      datasets: [
        {
          label: 'Responses',
          data: values,
          backgroundColor: labels.map((_, i) =>
            variant === 'doughnut' ? PALETTE[i % PALETTE.length] : primaryAlpha(0.75)
          ),
          borderColor: variant === 'doughnut' ? '#fff' : colors.primaryDark,
          borderWidth: variant === 'doughnut' ? 2 : 0,
          borderRadius: variant === 'bar' ? 6 : 0,
        },
      ],
    };
  }, [rows, variant]);

  const options = useMemo(() => {
    if (variant === 'doughnut') {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
      };
    }
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } },
      },
    };
  }, [variant]);

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>
        {chartData ? (
          <Box sx={{ height: 240 }}>
            {variant === 'doughnut' ? (
              <Doughnut data={chartData} options={options} />
            ) : (
              <Bar data={chartData} options={options} />
            )}
          </Box>
        ) : (
          <EmptyChart label={title} />
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDistributionCharts({ demographics }) {
  if (!demographics) return null;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <DistributionCard title="Gender" rows={demographics.gender} variant="doughnut" />
      </Grid>
      <Grid item xs={12} md={4}>
        <DistributionCard title="Age" rows={demographics.age} variant="bar" />
      </Grid>
      <Grid item xs={12} md={4}>
        <DistributionCard title="Income" rows={demographics.income} variant="bar" />
      </Grid>
    </Grid>
  );
}

export function AdminCategoryBars({ title, rows, labelKey = 'category', valueKey = 'purchase_count' }) {
  const chartData = useMemo(() => {
    if (!rows?.length) return null;
    return {
      labels: rows.map((r) => r[labelKey] || 'Unknown'),
      datasets: [
        {
          label: title,
          data: rows.map((r) => Number(r[valueKey]) || 0),
          backgroundColor: primaryAlpha(0.75),
          borderRadius: 6,
        },
      ],
    };
  }, [rows, labelKey, valueKey, title]);

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {title}
        </Typography>
        {chartData ? (
          <Box sx={{ height: 280 }}>
            <Bar
              data={chartData}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, ticks: { precision: 0 } },
                  y: { grid: { display: false } },
                },
              }}
            />
          </Box>
        ) : (
          <EmptyChart label={title} />
        )}
      </CardContent>
    </Card>
  );
}
