import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export const MainLayout = () => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-panel">
      <Header />
      <Outlet />
    </main>
  </div>
);
