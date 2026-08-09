import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = forwardRef(function SignaturePad({ onChange }, ref) {
  const containerRef = useRef(null);
  const sigRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 160 });

  useImperativeHandle(ref, () => ({
    isEmpty: () => sigRef.current?.isEmpty() ?? true,
    getPaths: () => sigRef.current?.toData() ?? [],
    getCanvasSize: () => dimensions,
    clear: () => {
      sigRef.current?.clear();
      onChange?.([]);
    },
  }));

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 160,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleEnd = () => {
    onChange?.(sigRef.current?.toData() ?? []);
  };

  const handleClear = () => {
    sigRef.current?.clear();
    onChange?.([]);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
        Signature
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Sign with your finger or mouse below
      </Typography>
      <Box
        ref={containerRef}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "#fff",
          touchAction: "none",
          overflow: "hidden",
        }}
      >
        {dimensions.width > 0 && (
          <SignatureCanvas
            ref={sigRef}
            penColor="#000"
            minWidth={1}
            maxWidth={2.5}
            onEnd={handleEnd}
            canvasProps={{
              width: dimensions.width,
              height: dimensions.height,
              style: { display: "block", width: "100%", height: dimensions.height },
            }}
          />
        )}
      </Box>
      <Button size="small" onClick={handleClear} sx={{ mt: 1 }}>
        Clear signature
      </Button>
    </Box>
  );
});

export default SignaturePad;
