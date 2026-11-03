import { useState } from "react";
import { supabaseClient } from "../providers/supabaseClient";

//Simple login form that signs a user in with their email and password
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //Message shown when the login fails
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    //Asks Supabase to check the email and password
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Error message, only shown after a failed login */}
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

export default Login;