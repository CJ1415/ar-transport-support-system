import { useEffect, useState } from 'react';
import './App.css';
import LoggedOutView from "./views/LoggedOutView";
import LoggedInView from "./views/LoggedInView";
import ARScannerView from "./views/ARScannerView";
import ToolCheckView from "./views/ToolCheckView";

function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  // MERGED: Using sessionStorage and userRole from the DB branch
  const [token, setToken] = useState(() => {
    const saved = sessionStorage.getItem("token");
    return (saved && saved !== "undefined" && saved !== "null") ? saved : null;
  });
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem("userRole") || null);

  const [faults, setFaults] = useState([]);
  const [attempts, setLoginAttempts] = useState(0);

  // MERGED: Keeping activeView for AR/ToolCheck routing
  const [activeView, setActiveView] = useState("dashboard");

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });

  async function loggingIn() {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (data.success) {
      const recievedToken = data.token;
      // MERGED: Saving to sessionStorage as requested by DB branch
      sessionStorage.setItem("token", recievedToken);
      sessionStorage.setItem("userRole", data.role || "");
      setToken(recievedToken);
      setUserRole(data.role || null);
    } else {
      setLoginAttempts(attempts + 1);
    }
  }

  const fetchFaults = async () => {
    // MERGED: Skip fetch if token looks broken
    if (!token || token === "null" || token === "undefined") {
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/faults", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 401 || response.status === 400) {
        sessionStorage.removeItem("token");
        setToken(null);
        setFaults([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setFaults(data);
      } else {
        setFaults([]);
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setFaults([]);
    }
  };

  useEffect(() => {
    if (token && token.length > 20) fetchFaults();
  }, [token]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleUsernameInput(e) { setUsername(e.target.value); }
  function handlePasswordInput(e) { setPassword(e.target.value); }

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  // MERGED: Comprehensive logout that clears all state and storage
  const handleLogout = () => {
    setUsername("");
    setPassword("");
    sessionStorage.clear();
    setToken(null);
    setUserRole(null);
    setLoginAttempts(0);
    setFaults([]);
    setActiveView("dashboard");
  };

  return (
    <div className={`dashboard-container ${theme}`}>
      {!token ? (
        <LoggedOutView
          username={username}
          password={password}
          attempts={attempts}
          handleUsernameInput={handleUsernameInput}
          handlePasswordInput={handlePasswordInput}
          loggingIn={loggingIn}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : activeView === "scanner" ? (
        <ARScannerView onBack={() => setActiveView("dashboard")} />
      ) : activeView === "toolcheck" ? (
        <ToolCheckView onBack={() => setActiveView("dashboard")} />
      ) : (
        <LoggedInView
          faults={faults}
          refreshFaults={fetchFaults}
          logout={handleLogout}
          role={userRole}
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAR={() => setActiveView("scanner")}
          onOpenToolCheck={() => setActiveView("toolcheck")}
        />
      )}
    </div>
  );
}

export default App;