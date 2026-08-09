/** Exactly 3 bends (R → L → R) between start and end. */
function buildBendAnchors(width, height, padX, padY) {
  const midX = width / 2;
  const leftX = padX;
  const rightX = width - padX;
  const usableH = height - 2 * padY;

  return [
    { x: midX, y: height - padY },
    { x: rightX, y: height - padY - usableH * 0.28 },
    { x: leftX, y: height - padY - usableH * 0.54 },
    { x: rightX, y: height - padY - usableH * 0.78 },
    { x: midX, y: padY },
  ];
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

/** Dense samples along a Catmull-Rom-style cubic through the bend anchors. */
function sampleSpline(anchors, samplesPerSeg = 20) {
  const tension = 0.32;
  const pts = [];

  for (let i = 0; i < anchors.length - 1; i++) {
    const p0 = anchors[i - 1] || anchors[i];
    const p1 = anchors[i];
    const p2 = anchors[i + 1];
    const p3 = anchors[i + 2] || p2;
    const cp1 = {
      x: p1.x + (p2.x - p0.x) * tension,
      y: p1.y + (p2.y - p0.y) * tension,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) * tension,
      y: p2.y - (p3.y - p1.y) * tension,
    };

    for (let s = 0; s < samplesPerSeg; s++) {
      if (i > 0 && s === 0) continue;
      pts.push(cubicPoint(p1, cp1, cp2, p2, s / samplesPerSeg));
    }
  }

  pts.push(anchors[anchors.length - 1]);
  return pts;
}

function placeAlongPolyline(poly, count) {
  if (!poly.length) return [];
  if (count <= 1) return [{ ...poly[0] }];

  const lengths = [0];
  let total = 0;
  for (let i = 1; i < poly.length; i++) {
    total += Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y);
    lengths.push(total);
  }

  if (total === 0) {
    return Array.from({ length: count }, () => ({ ...poly[0] }));
  }

  const out = [];
  for (let i = 0; i < count; i++) {
    const target = (i / (count - 1)) * total;
    let j = 1;
    while (j < lengths.length - 1 && lengths[j] < target) j += 1;
    const a = poly[j - 1];
    const b = poly[j];
    const segStart = lengths[j - 1];
    const segLen = Math.max(lengths[j] - segStart, 1e-6);
    const t = (target - segStart) / segLen;
    out.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    });
  }
  return out;
}

/**
 * Compact map: fixed 3-bend road, with checkpoint nodes spaced along it.
 */
export function buildWaypointLayout(nodeCount, width = 360, padX = 68, padY = 64) {
  const count = Math.max(2, nodeCount);
  const segment = 96;
  const height = padY * 2 + segment * (count - 1);
  const pathPoints = buildBendAnchors(width, height, padX, padY);
  const points = placeAlongPolyline(sampleSpline(pathPoints), count);

  return { points, pathPoints, width, height };
}

/** Smooth cubic path through waypoints (Catmull-Rom → Bezier). */
export function pathFromPoints(points) {
  if (!points.length) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const tension = 0.32;
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

export function buildCheckpointModels({
  totalStudyWeeks,
  weeklyCompletedCount,
  initialCompleted,
  finalTriggered,
  finalCompleted,
  weeklyDue = false,
}) {
  const weeks = Math.max(1, totalStudyWeeks || 1);
  const completed = Math.max(0, weeklyCompletedCount || 0);
  const checkpoints = [];

  for (let week = 1; week <= weeks; week += 1) {
    let status = "locked";
    if (completed >= week) {
      status = "completed";
    } else if (initialCompleted && completed === week - 1) {
      // Only pulse when the check-in can actually be opened
      status = weeklyDue ? "current" : "upcoming";
    }

    checkpoints.push({
      id: `week-${week}`,
      kind: "week",
      week,
      label: String(week),
      title: `Week ${week}`,
      status,
    });
  }

  let finalStatus = "locked";
  if (finalCompleted) {
    finalStatus = "completed";
  } else if (finalTriggered || completed >= weeks) {
    finalStatus = "current";
  }

  checkpoints.push({
    id: "final",
    kind: "final",
    week: null,
    label: "★",
    title: "Final survey",
    status: finalStatus,
  });

  return checkpoints;
}
