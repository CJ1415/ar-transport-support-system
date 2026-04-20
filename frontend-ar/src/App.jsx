import { useEffect, useState } from 'react'
import './App.css'

function App() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState();
  const [token, setToken] = useState(() => {
    // check if we have a token in storage already
    const saved = localStorage.getItem("token")
    return (saved && saved !== "undefined" && saved !== "null") ? saved : null;});
  const [loggedIn, isLoggedIn] = useState(false);
  const [faults, setFaults] = useState([])
  const [attempts, setLoginAttempts] = useState(0)
  const [theme, setTheme] = useState("dark")

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
      isLoggedIn(true)
    } else {
      const nextAttempt = attempts + 1
      setLoginAttempts(nextAttempt)
    }
  }

  const fetchFaults = async () => {
    // skip fetch if token looks broken
    if (!token || token === "null" || token === "undefined"){
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/faults", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
    
      // make sure we actually got an array back before setting state
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
    setTheme(prevTheme => (prevTheme === "light" ? "dark" : "light"));
  };

  // values for the color coding of fault severity
  const severityColors = {
  "Very High": "#ff0000",
  "High": "#ff6600",
  "Medium": "#ffcc00",
  "Low": "#00ff00",
  "None": "#ffffff"       
};

// jsx return block
return (
  <div className={`dashboard-container ${theme}`}>
    <h1>AR Fault System</h1>
    
    <button className='theme-btn' onClick={toggleTheme}>
      Switch Theme
    </button>

    <hr style={{ width: '100%', maxWidth: '600px', opacity: '0.2' }} />

    {!token ? (
      // logged out view, this is known as login-form for reference in other files such as css
      <div className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={handleUsernameInput}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordInput}
        />
        {attempts > 0 && (
          <p style={{ color: 'red', fontWeight: 'bold' }}>
            Login failed. Attempt: {attempts}
          </p>
        )}
        <button className='login' onClick={loggingIn}>
          Log In
        </button>
      </div>
    ) : (
      // logged in view, this is known as 'fault-list' for reference in other files such as css 
      <div className="fault-list">
        <h2>Active Transport Faults</h2>
        <ul>
          {faults.length > 0 ? (
            faults.map((fault) => (
              <li key={fault.id} className="fault-item">
                <strong className="location-name">{fault.location}</strong>
                <span>Type: {fault.type}</span> | 
                <span style={{ 
                  color: severityColors[fault.severity] || "white",
                  fontWeight: 'bold' 
                }}> Severity: {fault.severity}</span>
              </li>
            ))
          ) : (
            <p>No faults found in the system</p>
          )}
        </ul>
        <button className="logout" onClick={() => { localStorage.clear(); setToken(null); }}>
          Log Out
        </button>
      </div>
    )}
  </div>
);
}

export default App