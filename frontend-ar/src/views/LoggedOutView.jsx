function LoggedOutView({
  username,
  password,
  attempts,
  handleUsernameInput,
  handlePasswordInput,
  loggingIn
}) {
  return (
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

      <button className="login" onClick={loggingIn}>
        Log In
      </button>
    </div>
  );
}

export default LoggedOutView;