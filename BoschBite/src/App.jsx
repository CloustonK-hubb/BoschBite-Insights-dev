import { useEffect, useState } from "react";
import Login from "./Login";
import { supabaseClient } from "./lib/supabaseClient";


function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      setSession(session);

      if (session) {
        const { data, error } = await supabaseClient
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Profile error:", error);
        } else {
          setProfile(data);
        }
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
  }

  if (!profile) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h1>Welcome to BoschBite Insights</h1>

      <p>Logged in as: {session.user.email}</p>
      <p>Role: {profile.role}</p>

      <button onClick={() => supabaseClient.auth.signOut()}>
        Log out
      </button>
    </div>
  );
}

export default App;