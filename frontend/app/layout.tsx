"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Sidebar, SidebarToggle } from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Track navigation to preserve chat history
  useEffect(() => {
    // Set flag when navigating
    sessionStorage.setItem('navigating', 'true');

    // Clear flag after navigation completes
    const timer = setTimeout(() => {
      sessionStorage.removeItem('navigating');
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Hide sidebar on auth pages
  const isAuthPage = pathname?.startsWith("/signin") || pathname?.startsWith("/signup") || pathname?.startsWith("/verify");

  return (
    <html lang="en">
      <head>
        <title>HR Nexus - AI-Powered HR Management Platform</title>
        <meta name="description" content="Complete HR management system with AI-powered document search, policy assistant, and 8 HR pillars covering recruiting, onboarding, payroll, benefits, and more." />
        <meta name="keywords" content="HR management, AI assistant, HR policies, employee management, document search, HR automation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <ToastProvider>
          {isAuthPage ? (
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          ) : (
            <div className="flex h-screen overflow-hidden">
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

              <main className="flex-1 overflow-y-auto lg:ml-64">
                <SidebarToggle onClick={() => setSidebarOpen(true)} />
                {children}
              </main>
            </div>
          )}
        </ToastProvider>
      </body>
    </html>
  );
}

