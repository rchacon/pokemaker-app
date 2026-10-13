import { Navigate, Route, Routes } from "react-router";
import { UnlockProvider } from "./components/UnlockProvider";
import { lastProfile } from "./lib/drafts";
import { Editor } from "./pages/Editor";
import { Gallery } from "./pages/Gallery";
import { PrintSheet } from "./pages/PrintSheet";
import { ProfilePicker } from "./pages/ProfilePicker";

function Home() {
  const last = lastProfile.get();
  return last ? <Navigate to={`/p/${last}`} replace /> : <ProfilePicker />;
}

export function App() {
  return (
    <UnlockProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<ProfilePicker />} />
        <Route path="/p/:profileId" element={<Gallery />} />
        <Route path="/p/:profileId/cards/new" element={<Editor key="new" />} />
        <Route path="/p/:profileId/cards/:cardId" element={<Editor />} />
        <Route path="/p/:profileId/print" element={<PrintSheet />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UnlockProvider>
  );
}
