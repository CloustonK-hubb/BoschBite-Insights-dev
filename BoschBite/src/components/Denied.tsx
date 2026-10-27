import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import BlockIcon from "@mui/icons-material/Block";
import { supabaseClient } from "../providers/supabaseClient";


/* 
   SETTINGS
   Same colours as the login page
 */

const BROWN = "#382322";
const CREAM = "#f1e5d5";
const RED = "#D72C32";

function Denied() {
  const navigate = useNavigate();

  //Signs the person out once they arrive, so a denied account never keeps a live session
  useEffect(() => {
    supabaseClient.auth.signOut({ scope: "local" });
  }, []);

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
          padding: { xs: "36px 24px", sm: "48px 40px" },
          textAlign: "center",
        }}
      >
        {/* Red block icon */}
        <BlockIcon sx={{ fontSize: 64, color: RED, mb: 2 }} />

        <Typography component="h1" sx={{ color: BROWN, fontSize: 26, fontWeight: 800, lineHeight: 1.25 }}>
          Account access denied
        </Typography>

        <Typography sx={{ color: "text.secondary", mt: 1.5, mb: 1.5 }}>
          Your BoschBite Insights account has not been approved for access.
        </Typography>

        <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
          If you believe this was a mistake, please contact a BoschBite Admin.
        </Typography>

        {/* Brown button, same as the login page */}
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate("/login")}
          sx={{
            borderRadius: 999,
            py: 1.25,
            fontWeight: 700,
            letterSpacing: 0.5,
            backgroundColor: BROWN,
            color: CREAM,
            boxShadow: "none",
            "&:hover": { backgroundColor: "#4d3130", boxShadow: "0 6px 16px rgba(56, 35, 34, 0.25)" },
          }}
        >
          Back to login
        </Button>
      </Paper>
    </Box>
  );
}

export default Denied;