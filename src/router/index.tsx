import { createBrowserRouter } from "react-router-dom";
import { ChatView } from "../components/chat/ChatView";
import { CoderView } from "../components/coder/CoderView";
import { MainLayout } from "../components/layout/MainLayout";
import { SettingsPage } from "../components/settings/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <ChatView /> },
      { path: "chat", element: <ChatView /> },
      { path: "chat/:sessionId", element: <ChatView /> },
      { path: "coder", element: <CoderView /> },
      { path: "coder/:sessionId", element: <CoderView /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  }
]);
