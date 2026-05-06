import { useEffect, useState } from 'react'
import './App.css'
import LoggedOutView from "./views/LoggedOutView";
import LoggedInView from "./views/LoggedInView";

function App() {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState();
  const [token, setToken] = useState(() => {
    // check if we have a token in storage already
  const saved = localStorage.getItem("token")
    return (saved && saved !== "undefined" && saved !== "null") ? saved : null;});
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

// jsx return block
return (
  <div className={`dashboard-container ${theme}`}>
    <h1>AR Fault System</h1>

    <button className='theme-btn' onClick={toggleTheme}>
      Switch Theme
    </button>

    {!token ? (
      <LoggedOutView
        username={username}
        password={password}
        attempts={attempts}
        handleUsernameInput={handleUsernameInput}
        handlePasswordInput={handlePasswordInput}
        loggingIn={loggingIn}
      />
    ) : (
      <LoggedInView
        faults={faults}
        logout={() => {
          localStorage.clear();
          setToken(null);
        }}
      />
    )}
  </div>
);
}

export default App