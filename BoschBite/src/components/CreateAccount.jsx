import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";

function CreateAccount() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [vendorId, setVendorId] = useState("");
  const [vendors, setVendors] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const getVendors = async () => {
      const { data, error } = await supabaseClient
        .from("Vendor")
        .select("vendor_id, name")
        .order("name");

      if (error) {
        setError(error.message);
      } else {
        setVendors(data);
      }
    };

    getVendors();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session) {
      setError("You must be logged in as an administrator.");
      return;
    }

    const { data, error } = await supabaseClient.functions.invoke(
      "create-user",
      {
        body: {
          email,
          password,
          role,
          vendor_id: vendorId === "" ? null : Number(vendorId),
        },
      }
    );

    if (error) {
      setError(error.message);
      return;
    }

    if (data?.error) {
      setError(data.error);
      return;
    }

    setMessage("User created successfully.");

    setEmail("");
    setPassword("");
    setRole("staff");
    setVendorId("");
  };

  return (
    <div>
      <h1>Create User</h1>

      <form onSubmit={handleCreateAccount}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Temporary Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Role</label>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>

        <label>Vendor</label>

        <select
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        >
          <option value="">No Vendor</option>

          {vendors.map((vendor) => (
            <option
              key={vendor.vendor_id}
              value={vendor.vendor_id}
            >
              {vendor.name}
            </option>
          ))}
        </select>

        <button type="submit">
          Create User
        </button>
      </form>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateAccount;