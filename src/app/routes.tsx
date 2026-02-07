import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { HomePage } from "../pages/HomePage";
import { AdvancedSearchPage } from "../pages/AdvancedSearchPage";
import { BookDetailPage } from "../pages/BookDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "advanced-search", element: <AdvancedSearchPage /> },
      { path: "book/:workId", element: <BookDetailPage /> },
    ],
  },
]);
