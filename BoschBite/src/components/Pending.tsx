import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router";

function Pending() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 500,
          width: "100%",
          padding: 5,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Account Pending
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Your BoschBite Insights account has been created
          successfully, but it is still awaiting verification.
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          A BoschBite Admin will review your account and grant
          access once it has been verified.
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/login")}
        >
          Back to Login
        </Button>
      </Paper>
    </Box>
  );
}

export default Pending;