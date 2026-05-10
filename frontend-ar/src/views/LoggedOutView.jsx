function LoggedOutView({
  username,
  password,
  attempts,
  handleUsernameInput,
  handlePasswordInput,
  loggingIn,
  theme,
  toggleTheme
}) {
  return (
    <div className="login-shell">
      <div key={attempts} className={`login-card${attempts > 0 ? ' shake' : ''}`}>
        <button className='theme-btn theme-toggle' onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          Switch Theme
        </button>
        <div className="login-brand">
          <span className="brand-tag">AR HUB</span>
          <h2>Tunnel Inspection Console</h2>
          <p className="brand-copy">Secure access to fault reporting, network status, and civil infrastructure monitoring.</p>
        </div>

        <form
          className="login-form"
          onSubmit={(e) => {
            e.preventDefault()
            loggingIn()
          }}
        >
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
            <p className="login-error">
              Login failed. Attempt: {attempts}
            </p>
          )}

          <button className="login" type="submit">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoggedOutView;