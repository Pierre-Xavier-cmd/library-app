import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div data-app>
      <Header />
      <main data-container>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
