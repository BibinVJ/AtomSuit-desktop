import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import api from "../../services/api";
import { useMemo, useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";

export default function SignIn() {
  const currentTenant = useMemo(() => localStorage.getItem("tenant") || "", []);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const handleChangeTenant = () => {
    try {
      // Clear tenant & auth state
      localStorage.removeItem("tenant");
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      delete (api.defaults.headers.common as any)["x-tenant"];
      delete (api.defaults.headers.common as any)["Authorization"];
    } finally {
      // Reload app to show TenantSetup
      window.location.reload();
    }
  };

  return (
    <>
      <AuthLayout>
        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggleButton />

          {/* Settings menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
                  Signed into: <span className="font-medium text-gray-800 dark:text-gray-100">{currentTenant || "—"}</span>
                </div>
                <button
                  type="button"
                  onClick={handleChangeTenant}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                >
                  Change site domain
                </button>
              </div>
            )}
          </div>
        </div>

        <SignInForm />
      </AuthLayout>
    </>
  );
}
