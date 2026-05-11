import { useEffect, useState } from 'react'
import './App.css'
import LoggedOutView from "./views/LoggedOutView";
import LoggedInView from "./views/LoggedInView";
import ARScannerView from "./views/ARScannerView";
import ToolCheckView from "./views/ToolCheckView";

function App() {

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [faults, setFaults] = useState([]);
  const [attempts, setLoginAttempts] = useState(0);
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
      localStorage.setItem("token", recievedToken);
      setToken(recievedToken);
    } else {
      setLoginAttempts(attempts + 1);
    }
  }

  const fetchFaults = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/faults", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.status === 401 || response.status === 400) {
        localStorage.removeItem("token");
        setToken(null);
        setFaults([]);
        return;
      }
      const data = await response.json();
      setFaults(Array.isArray(data) ? data : []);
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

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
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
