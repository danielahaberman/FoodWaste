// @ts-nocheck
/* eslint-disable react/prop-types */
import React, { useEffect, useMemo, useRef } from "react";
import { Box, Typography, keyframes } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import FlagIcon from "@mui/icons-material/Flag";
import { colors, primaryAlpha } from "../../themeColors";
import { buildWaypointLayout, pathFromPoints } from "./pathUtils";

const pulseRing = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  100% {
    transform: scale(2.15);
    opacity: 0;
  }
`;

const pulseNode = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.18); }
`;

function MapDecoration({ type, style }) {
  if (type === "tree") {
    return (
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 28,
          height: 36,
          pointerEvents: "none",
          ...style,
          "&::before": {
            content: '""',
            position: "absolute",
            left: "50%",
            bottom: 10,
            width: 8,
            height: 14,
            ml: "-4px",
            borderRadius: 1,
            background: "#8B6914",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            left: "50%",
            bottom: 16,
            width: 26,
            height: 26,
            ml: "-13px",
            borderRadius: "50% 50% 45% 45%",
            background: "linear-gradient(160deg, #6BBF59 0%, #3E8F3A 100%)",
            boxShadow: "0 2px 0 rgba(0,0,0,0.08)",
          },
        }}
      />
    );
  }

  if (type === "bush") {
    return (
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          width: 34,
          height: 18,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #7BC96F 0%, #4FA045 100%)",
          boxShadow: "6px 4px 0 -2px #5BA84F, -8px 3px 0 -3px #69B75C",
          pointerEvents: "none",
          opacity: 0.9,
          ...style,
        }}
      />
    );
  }

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        width: 14,
        height: 10,
        borderRadius: "40%",
        background: "#8BC34A",
        opacity: 0.55,
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

function CheckpointNode({ checkpoint, point, onSelect, nodeRef }) {
  const { status, kind, label, title } = checkpoint;
  const isFinal = kind === "final";
  const isCurrent = status === "current";
  const isUpcoming = status === "upcoming";
  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const size = isFinal ? 44 : 38;

  return (
    <Box
      ref={nodeRef}
      component="button"
      type="button"
      aria-label={`${title}, ${status}`}
      onClick={() => onSelect?.(checkpoint)}
      sx={{
        position: "absolute",
        left: point.x,
        top: point.y,
        width: size,
        height: size,
        ml: `-${size / 2}px`,
        mt: `-${size / 2}px`,
        p: 0,
        border: "none",
        borderRadius: "50%",
        cursor: "pointer",
        background: isLocked
          ? "linear-gradient(180deg, #FFFFFF 0%, #FFF3E6 100%)"
          : isCompleted
            ? `linear-gradient(180deg, ${colors.primaryMid} 0%, ${colors.primaryDark} 100%)`
            : "linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%)",
        boxShadow: isLocked
          ? `0 2px 0 ${colors.primaryMuted}, 0 3px 8px rgba(61, 48, 40, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)`
          : isCurrent
            ? `0 3px 0 ${colors.primaryDark}, 0 0 0 4px ${primaryAlpha(0.22)}, 0 8px 18px ${primaryAlpha(0.35)}, inset 0 1px 0 rgba(255,255,255,0.85)`
            : `0 3px 0 ${colors.primaryDark}, 0 6px 14px ${primaryAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.85)`,
        outline: isCurrent
          ? `3px solid ${colors.primary}`
          : isUpcoming
            ? `2px solid ${colors.primaryMid}`
            : isLocked
              ? `1.5px solid ${colors.primaryMuted}`
              : "3px solid transparent",
        outlineOffset: isLocked ? 1 : 2,
        animation: isCurrent ? `${pulseNode} 1s ease-in-out infinite` : "none",
        transition: "transform 0.15s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: isLocked ? colors.primary : isCompleted ? "#fff" : colors.primaryDark,
        zIndex: isCurrent || isUpcoming ? 2 : 1,
        "&:active": {
          transform: "scale(0.94) translateY(1px)",
        },
        ...(isCurrent && {
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: `3px solid ${colors.primary}`,
            boxShadow: `0 0 12px ${primaryAlpha(0.55)}`,
            pointerEvents: "none",
            animation: `${pulseRing} 1.35s ease-out infinite`,
          },
          "&::after": {
            animationDelay: "0.45s",
            borderColor: colors.primaryMid,
            borderWidth: 2.5,
          },
        }),
      }}
    >
      {isFinal ? (
        isCompleted ? (
          <CheckIcon sx={{ fontSize: 22 }} />
        ) : (
          <FlagIcon sx={{ fontSize: 20, color: isLocked ? colors.primaryMid : colors.primary }} />
        )
      ) : isCompleted ? (
        <CheckIcon sx={{ fontSize: 20 }} />
      ) : (
        <Typography
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: "0.95rem",
            lineHeight: 1,
            color: "inherit",
          }}
        >
          {label}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Pure SVG + CSS progress map. Scales to any checkpoint count.
 */
export default function SurveyMap({ checkpoints, onSelectCheckpoint }) {
  const focusRef = useRef(null);
  const scrolledForId = useRef(null);

  const layout = useMemo(
    () => buildWaypointLayout(checkpoints.length),
    [checkpoints.length]
  );
  const pathD = useMemo(
    () => pathFromPoints(layout.pathPoints || layout.points),
    [layout.pathPoints, layout.points]
  );

  const focusId = useMemo(() => {
    const current = checkpoints.find((cp) => cp.status === "current");
    if (current) return current.id;
    const upcoming = checkpoints.find((cp) => cp.status === "upcoming");
    if (upcoming) return upcoming.id;
    const completed = [...checkpoints].reverse().find((cp) => cp.status === "completed");
    return completed?.id ?? checkpoints[0]?.id ?? null;
  }, [checkpoints]);

  const decorations = useMemo(() => {
    const items = [];
    // Sparse props — only near every other mid-path node so the map stays compact
    layout.points.forEach((p, i) => {
      if (i === 0 || i === layout.points.length - 1 || i % 2 === 0) return;
      const side = p.x < layout.width / 2 ? 1 : -1;
      const dx = side * 48;
      const dy = i % 4 === 1 ? -10 : 6;
      items.push({
        key: `d-${i}`,
        type: i % 3 === 0 ? "tree" : i % 3 === 1 ? "bush" : "tuft",
        style: {
          left: `${((p.x + dx) / layout.width) * 100}%`,
          top: `${((p.y + dy) / layout.height) * 100}%`,
          transform: "translate(-50%, -50%)",
        },
      });
    });
    return items;
  }, [layout]);

  useEffect(() => {
    if (!focusId || scrolledForId.current === focusId) return;

    let cancelled = false;
    let timeoutId = 0;

    const tryScroll = () => {
      if (cancelled) return;
      const el = focusRef.current;
      if (!el) {
        timeoutId = window.setTimeout(tryScroll, 50);
        return;
      }
      scrolledForId.current = focusId;
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    };

    // Wait for the map's padding-bottom layout to settle, then center the node.
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(tryScroll);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timeoutId);
    };
  }, [focusId, checkpoints.length]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 420,
        mx: "auto",
        borderRadius: 4,
        overflow: "hidden",
        background: `
          radial-gradient(ellipse 80% 40% at 20% 15%, rgba(167, 213, 120, 0.22), transparent 55%),
          radial-gradient(ellipse 70% 35% at 85% 70%, rgba(255, 186, 120, 0.18), transparent 50%),
          linear-gradient(180deg, #FFF6EA 0%, ${colors.bg} 45%, #F2E8DA 100%)
        `,
        border: "1px solid rgba(61, 48, 40, 0.06)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 0,
          pb: `${(layout.height / layout.width) * 100}%`,
        }}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id="pathEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.primaryDark} />
              <stop offset="100%" stopColor={colors.primary} />
            </linearGradient>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="rgba(61,48,40,0.12)"
            strokeWidth={38}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0, 4)"
          />
          <path
            d={pathD}
            fill="none"
            stroke="url(#pathEdge)"
            strokeWidth={34}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke="#FFF8F0"
            strokeWidth={18}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke={colors.primaryMid}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="10 14"
            strokeLinejoin="round"
            opacity={0.85}
          />
        </svg>

        {decorations.map((d) => (
          <MapDecoration key={d.key} type={d.type} style={d.style} />
        ))}

        <Box sx={{ position: "absolute", inset: 0 }}>
          {checkpoints.map((cp, i) => {
            const pt = layout.points[i];
            if (!pt) return null;
            return (
              <Box
                key={cp.id}
                sx={{
                  position: "absolute",
                  left: `${(pt.x / layout.width) * 100}%`,
                  top: `${(pt.y / layout.height) * 100}%`,
                  width: 0,
                  height: 0,
                }}
              >
                <CheckpointNode
                  checkpoint={cp}
                  point={{ x: 0, y: 0 }}
                  onSelect={onSelectCheckpoint}
                  nodeRef={cp.id === focusId ? focusRef : undefined}
                />
                {cp.kind === "final" && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      top: 28,
                      left: "50%",
                      transform: "translateX(-50%)",
                      whiteSpace: "nowrap",
                      fontWeight: 700,
                      color: colors.textSecondary,
                      fontSize: "0.7rem",
                      pointerEvents: "none",
                    }}
                  >
                    Final
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
