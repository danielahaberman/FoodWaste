import React, { useRef, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Stack,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageWrapper from "../PageWrapper";
import SignaturePad from "../SignaturePad";
import { TERMS_DOCUMENT } from "../../constants/termsDocument";
import { getCurrentUserId, logout, getIntendedDestination, clearIntendedDestination } from "../../utils/authUtils";
import { authAPI } from "../../api";

const TERMS_CACHE_KEY_PREFIX = "termsAccepted:";

function hasSignaturePaths(paths) {
  return Array.isArray(paths) && paths.some((stroke) => Array.isArray(stroke) && stroke.length > 0);
}

function TermsAndConditions({ onTermsAccepted }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [over18, setOver18] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });
  const signatureRef = useRef(null);
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    over18 &&
    accepted &&
    hasSignaturePaths(signaturePaths) &&
    !isSubmitting;

  const handleAccept = async () => {
    if (!canSubmit) return;

    const paths = signatureRef.current?.getPaths() ?? signaturePaths;
    const canvasSize = signatureRef.current?.getCanvasSize?.() ?? {};
    if (!hasSignaturePaths(paths)) {
      setSnackbar({ open: true, message: "Please provide your signature.", severity: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.acceptTerms({
        user_id: userId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        over_18_attested: over18,
        signature_paths: paths,
        canvas_width: canvasSize.width || null,
        canvas_height: canvasSize.height || null,
        document_version: TERMS_DOCUMENT.version,
        document_title: TERMS_DOCUMENT.title,
        document_last_updated: TERMS_DOCUMENT.lastUpdated,
        client_signed_at: new Date().toISOString(),
      });

      if (userId) {
        localStorage.setItem(`${TERMS_CACHE_KEY_PREFIX}${userId}`, "true");
      }

      if (onTermsAccepted) {
        onTermsAccepted();
      }

      const intendedDestination = getIntendedDestination();
      if (intendedDestination) {
        clearIntendedDestination();
        navigate(intendedDestination);
        return;
      }
      navigate(userId ? "/log" : "/");
    } catch (error) {
      console.error("Error accepting terms:", error);
      setSnackbar({ open: true, message: "Failed to accept terms. Please try again.", severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    logout();
    navigate("/");
  };

  return (
    <PageWrapper showHeader={false} reserveBottomNav={false} backgroundColor="var(--color-muted)">
      <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
        <Paper elevation={3} sx={{ width: "100%", maxWidth: 640, p: 3, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" textAlign="center" fontWeight="bold" gutterBottom>
            {TERMS_DOCUMENT.title}
          </Typography>

          <Paper
            variant="outlined"
            className="selectable-text"
            sx={{ maxHeight: 400, overflowY: "auto", p: 2, mb: 2 }}
          >
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              <strong>Last updated: {TERMS_DOCUMENT.lastUpdated}</strong>
              <br />
              <br />

              <strong>1. Acceptance of Terms</strong>
              <br />
              By accessing and using Food Hero, you accept and agree to be bound by the terms and provision of this agreement.
              <br />
              <br />

              <strong>2. Use License</strong>
              <br />
              Permission is granted to temporarily use this application for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              <br />
              <br />

              <strong>3. Data Collection and Privacy</strong>
              <br />
              This application collects and stores information about your food purchases and consumption patterns to help you manage food waste. Your data is stored locally and may be transmitted to our servers for analysis and improvement purposes.
              <br />
              <br />

              <strong>4. Disclaimer</strong>
              <br />
              The materials on this application are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              <br />
              <br />

              <strong>5. Limitations</strong>
              <br />
              In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this application.
              <br />
              <br />

              <strong>6. Revisions and Errata</strong>
              <br />
              The materials appearing on this application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on this application are accurate, complete or current.
              <br />
              <br />

              <strong>7. Links</strong>
              <br />
              We have not reviewed all of the sites linked to this application and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site.
              <br />
              <br />

              <strong>8. Modifications</strong>
              <br />
              We may revise these terms of service for this application at any time without notice. By using this application you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
            </Typography>
          </Paper>

          <Stack spacing={2} sx={{ mb: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                fullWidth
                autoComplete="given-name"
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                fullWidth
                autoComplete="family-name"
              />
            </Stack>

            <SignaturePad ref={signatureRef} onChange={setSignaturePaths} />

            <FormControlLabel
              control={
                <Checkbox
                  checked={over18}
                  onChange={(e) => setOver18(e.target.checked)}
                  sx={{
                    color: "var(--color-success)",
                    "&.Mui-checked": { color: "var(--color-success)" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#000000" }}>
                  I attest that I am 18 years of age or older
                </Typography>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  sx={{
                    color: "var(--color-success)",
                    "&.Mui-checked": { color: "var(--color-success)" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "#000000" }}>
                  I have read and agree to the Terms and Conditions
                </Typography>
              }
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button variant="contained" color="success" onClick={handleAccept} disabled={!canSubmit}>
              {isSubmitting ? "Accepting..." : "Accept & Continue"}
            </Button>
            <Button variant="outlined" onClick={handleDecline} disabled={isSubmitting}>
              Decline
            </Button>
          </Stack>
        </Paper>
      </Stack>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
}

export default TermsAndConditions;
