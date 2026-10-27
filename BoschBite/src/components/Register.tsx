import { useEffect, useState } from "react";
import { supabaseClient } from "../providers/supabaseClient";
import { useNavigate } from "react-router";
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";


/* 
   SETTINGS
   Same colours as the login page
 */

const BROWN = "#382322";
const CREAM = "#f1e5d5";

//Pill shaped fields with a cream fill, used by every input on the page
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 999,
    backgroundColor: "#faf6ef",
    "& fieldset": { borderColor: "transparent" },
    "&:hover fieldset": { borderColor: "#d9c7ab" },
    "&.Mui-focused fieldset": { borderColor: BROWN, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: BROWN },
};

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

  //Loads the vendors for the dropdown (only vendors with type 1)
  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabaseClient
        .from("Vendor")
        .select("vendor_id, name")
        .eq("type_id", 1)
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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!firstName || !lastName || !email || !password || !confirmPassword || !role || !vendorId) {
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

    navigate("/pending");

    // setSuccess(
    //   "Account created successfully. Your account is awaiting verification.",
    // );

    // setTimeout(() => {
    //   navigate("/login");
    // }, 1500);
  };

  return (
    /* Soft beige background with a gentle glow behind the card */
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 5,
        background: "radial-gradient(circle at 50% 35%, #fbf4e9 0%, #f1e5d5 55%, #e8d8c0 100%)",
      }}
    >
      {/* Raised rounded card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 5,
          border: "1px solid rgba(56, 35, 34, 0.06)",
          boxShadow: "0 20px 50px rgba(56, 35, 34, 0.12), 0 2px 6px rgba(56, 35, 34, 0.06)",
          padding: { xs: "32px 24px", sm: "44px 40px" },
        }}
      >
        <Typography component="h1" textAlign="center" sx={{ color: BROWN, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>
          Create your BoschBite Account
        </Typography>

        <Typography textAlign="center" sx={{ color: "text.secondary", mt: 1, mb: 3 }}>
          Your account will be reviewed before you get access.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleRegister}>
          {/* Names sit side by side on wider screens */}
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <TextField
              fullWidth
              label="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              margin="normal"
              required
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              margin="normal"
              required
              sx={fieldSx}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            sx={fieldSx}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            sx={fieldSx}
          />

          <TextField
            fullWidth
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            required
            sx={fieldSx}
          />

          <FormControl fullWidth margin="normal" required sx={fieldSx}>
            <InputLabel id="role-label">Role</InputLabel>

            <Select
              labelId="role-label"
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value)}
              MenuProps={{ PaperProps: { sx: { borderRadius: 3, mt: 0.5 } } }}
            >
              <MenuItem value="vendor_admin">Vendor Admin</MenuItem>
              <MenuItem value="vendor_manager">Vendor Manager</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={loadingVendors} sx={fieldSx}>
            <InputLabel id="vendor-label">Vendor</InputLabel>

            <Select
              labelId="vendor-label"
              value={vendorId}
              label="Vendor"
              onChange={(e) => setVendorId(e.target.value)}
              MenuProps={{ PaperProps: { sx: { borderRadius: 3, mt: 0.5 } } }}
            >
              {vendors.map((vendor) => (
                <MenuItem key={vendor.vendor_id} value={vendor.vendor_id.toString()}>
                  {vendor.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Brown button, same as the login page */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || loadingVendors}
            sx={{
              mt: 3,
              mb: 1,
              borderRadius: 999,
              py: 1.25,
              fontWeight: 700,
              letterSpacing: 0.5,
              backgroundColor: BROWN,
              color: CREAM,
              boxShadow: "none",
              "&:hover": { backgroundColor: "#4d3130", boxShadow: "0 6px 16px rgba(56, 35, 34, 0.25)" },
              "&.Mui-disabled": { backgroundColor: BROWN, color: CREAM, opacity: 0.5 },
            }}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <Button
            fullWidth
            variant="text"
            onClick={() => navigate("/login")}
            sx={{ color: BROWN, textTransform: "none", fontWeight: 600 }}
          >
            Already have an account? Log in
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default Register;