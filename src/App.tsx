import { Navigate, Route, Routes } from "react-router";
import { lastProfile } from "./lib/drafts";
import { Gallery } from "./pages/Gallery";
import { ProfilePicker } from "./pages/ProfilePicker";

function Home() {
  const last = lastProfile.get();
  return last ? <Navigate to={`/p/${last}`} replace /> : <ProfilePicker />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/players" element={<ProfilePicker />} />
      <Route path="/p/:profileId" element={<Gallery />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
