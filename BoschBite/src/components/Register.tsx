import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabaseClient";
import { useNavigate } from "react-router";

import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

interface Vendor {
  vendor_id: number;
  name: string;
}

function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState("");
  const [vendorId, setVendorId] = useState("");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabaseClient
        .from("Vendor")
        .select("vendor_id, name")
        .order("name");

      if (error) {
  console.error("Vendor loading error:", error);
  setError(`Unable to load vendors: ${error.message}`);
  setLoadingVendors(false);
  return;
}

      setVendors(data || []);
      setLoadingVendors(false);
    };

    fetchVendors();
  }, []);

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !role ||
      !vendorId
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          vendor_id: vendorId,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(
      "Account created successfully. Your account is awaiting verification.",
    );

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            padding: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            textAlign="center"
            gutterBottom
          >
            Create Account
          </Typography>

          <Typography
            variant="body2"
            textAlign="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Create your BoschBite Insights account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleRegister}>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-label">
                Role
              </InputLabel>

              <Select
                labelId="role-label"
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="vendor_admin">
                  Vendor Admin
                </MenuItem>

                <MenuItem value="vendor_manager">
                  Vendor Manager
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl
              fullWidth
              margin="normal"
              required
              disabled={loadingVendors}
            >
              <InputLabel id="vendor-label">
                Vendor
              </InputLabel>

              <Select
                labelId="vendor-label"
                value={vendorId}
                label="Vendor"
                onChange={(e) => setVendorId(e.target.value)}
              >
                {vendors.map((vendor) => (
                  <MenuItem
                    key={vendor.vendor_id}
                    value={vendor.vendor_id.toString()}
                  >
                    {vendor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || loadingVendors}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading
                ? "Creating Account..."
                : "Create Account"}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate("/login")}
            >
              Already have an account? Log in
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;
