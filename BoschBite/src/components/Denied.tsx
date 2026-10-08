import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router";

function Denied() {
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
          Account Access Denied
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Your BoschBite Insights account has not been approved
          for access.
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          If you believe this was a mistake, please contact a
          BoschBite Admin.
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

export default Denied;