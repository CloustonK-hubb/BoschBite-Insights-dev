// Initiated App
import {Refine, WelcomePage} from "@refinedev/core";
// Connecting database
import { dataProvider } from "@refinedev/supabase";
import { supabaseClient } from "./lib/supabaseClient";

// Data connection test
import { useEffect } from "react";



function App() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabaseClient
        .from("Vendor")
        .select("*")
        .limit(5);

      console.log("Vendor:", data);
      console.log("Error:", error);
    };

    testConnection();
  }, []);

  return <h1>Supabase Connection Test</h1>;
}

export default App;
