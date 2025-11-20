import React, { useState } from "react";
import { Button, Checkbox, FormControlLabel, Typography, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageLayout from "../PageLayout";
import { getCurrentUserId, logout, getIntendedDestination, clearIntendedDestination } from "../../utils/authUtils";
import { authAPI } from "../../api";

function TermsAndConditions({ onTermsAccepted }) {
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const handleBackToApp = () => {
    const intendedDestination = getIntendedDestination();
    if (userId) {
      if (intendedDestination) {
        navigate(intendedDestination);
      } else {
        // Try to go back in history, fallback to home
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate("/home");
        }
      }
    } else {
      navigate("/");
    }
  };

  const handleAccept = async () => {
    if (!accepted || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await authAPI.acceptTerms(userId);
      
      // Call the callback to update the guard
      if (onTermsAccepted) {
        onTermsAccepted();
      }
      
      // Prefer intended destination if present
      const intendedDestination = getIntendedDestination();
      if (intendedDestination) {
        clearIntendedDestination();
        navigate(intendedDestination);
        return;
      }
      // If user is logged in, go to home, otherwise go to landing
      navigate(userId ? "/home" : "/");
    } catch (error) {
      console.error("Error accepting terms:", error);
      alert("Failed to accept terms. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    // Clear any existing user data and redirect to landing
    logout();
    navigate("/");
  };

  return (
    <PageLayout backgroundColor="var(--color-muted)">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            maxWidth: "640px",
            width: "100%",
            padding: "24px",
            backgroundColor: "var(--color-surface)",
            borderRadius: "12px",
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              color: "var(--color-text)",
              marginBottom: "16px",
            }}
          >
            Terms and Conditions
          </Typography>

          <Box
            sx={{
              maxHeight: "400px",
              overflowY: "auto",
              backgroundColor: "var(--color-surface)",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              <strong>Last updated: {new Date().toLocaleDateString()}</strong>
              <br /><br />
              
              <strong>1. Acceptance of Terms</strong>
              <br />
              By accessing and using Food Hero, you accept and agree to be bound by the terms and provision of this agreement.
              <br /><br />
              
              <strong>2. Use License</strong>
              <br />
              Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              <br /><br />
              
              <strong>3. Data Collection and Privacy</strong>
              <br />
              This application collects and stores information about your food purchases and consumption patterns to help you manage food waste. Your data is stored locally and may be transmitted to our servers for analysis and improvement purposes.
              <br /><br />
              
              <strong>4. Disclaimer</strong>
              <br />
              The materials on this application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              <br /><br />
              
              <strong>5. Limitations</strong>
              <br />
              In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.
              <br /><br />
              
              <strong>6. Revisions and Errata</strong>
              <br />
              The materials appearing on this application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this application are accurate, complete or current.
              <br /><br />
              
              <strong>7. Links</strong>
              <br />
              We have not reviewed all of the sites linked to this application and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site.
              <br /><br />
              
              <strong>8. Modifications</strong>
              <br />
              We may revise these terms of service for this application at any time without notice. By using this application you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                sx={{
                  color: "var(--color-success)",
                  "&.Mui-checked": {
                    color: "var(--color-success)",
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: "#000000" }}>
                I have read and agree to the Terms and Conditions
              </Typography>
            }
            sx={{ marginBottom: "16px" }}
          />

          <Box sx={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={!accepted || isSubmitting}
              sx={{
                backgroundColor: "var(--color-success)",
                color: "var(--color-primary-contrast)",
                "&:disabled": {
                  backgroundColor: "#e5e7eb",
                  color: "#9ca3af",
                },
                "&:hover": {
                  backgroundColor: "#2e7d32",
                },
              }}
            >
              {isSubmitting ? "Accepting..." : "Accept & Continue"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleDecline}
              disabled={isSubmitting}
              sx={{
                borderColor: "#6b7280",
                color: "var(--color-text)",
                "&:hover": {
                  borderColor: "#374151",
                  backgroundColor: "#f3f4f6",
                },
              }}
            >
              Decline
            </Button>
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
}

export default TermsAndConditions;
