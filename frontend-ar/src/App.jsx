import { useEffect, useState } from 'react'
import './App.css'
import LoggedOutView from "./views/LoggedOutView";
import LoggedInView from "./views/LoggedInView";

function App() {

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [color, setColor] = useState();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [faults, setFaults] = useState([])
  const [attempts, setLoginAttempts] = useState(0)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark"
  })

  // fetches login url using POST method, sends username and password to backend
  async function loggingIn(){
    const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
    })

    const data = await response.json()
    if (data.success){
      const recievedToken = data.token
      localStorage.setItem("token", recievedToken);
      setToken(recievedToken)
    } else {
      const nextAttempt = attempts + 1
      setLoginAttempts(nextAttempt)
    }
  }

  const fetchFaults = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/faults", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    // token expired / invalid
    if (response.status === 401 || response.status === 400) {
      localStorage.removeItem("token");
      setToken(null);
      setFaults([]);
      return;
    }

    const data = await response.json();

    // make sure data is always an array
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
    // fetch the fault list once the token is validated
    if (token && token !== null && token.length > 20) {
      fetchFaults();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("theme", theme)
  }, [theme]);

  // handle username typing
  function handleUsernameInput(e){
    setUsername(e.target.value)
  }

  // handle password typing
  function handlePasswordInput(e){
    setPassword(e.target.value)
  }

  // handle theme toggle between light and dark
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const nextTheme = prevTheme === "light" ? "dark" : "light"
      localStorage.setItem("theme", nextTheme)
      return nextTheme
    })
  };

// jsx return block
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
    ) : (
      <LoggedInView
        faults={faults}
        refreshFaults={fetchFaults}
        logout={() => {
          localStorage.clear();
          setToken(null);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    )}
  </div>
);
}

export default App