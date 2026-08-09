import { Navigate } from "react-router-dom";

/** Legacy route — survey journey now lives on /survey. */
export default function SurveyProgress() {
  return <Navigate to="/survey" replace />;
}
