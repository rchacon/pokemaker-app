import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { App } from "../App";

export function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

/** Render the real app routes at `path`. */
export function renderApp(path: string, options: { advanceTimers?: (ms: number) => void } = {}) {
  const user = userEvent.setup(options.advanceTimers ? { advanceTimers: options.advanceTimers } : {});
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
  return { user, ...result };
}
