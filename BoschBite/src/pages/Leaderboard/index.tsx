import { ScoreBreakdownFooter } from "./scoreBreakdownFooter";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

//Leaderboard page placeholder for now 
export const LeaderboardPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={500} sx={{ mb: 2 }}>
        Leaderboard
      </Typography>

      {/* Placeholder until the leaderboard table is built */}
      <Box
        sx={{
          height: 300,
          border: 1,
          borderColor: "divider",
          borderStyle: "dashed",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        Leaderboard table coming soon
      </Box>

    {/* Score breakdown footer. Must remain at the bottom of the leaderboard. DO NOT REMOVE */}
      <ScoreBreakdownFooter />
    </Box>
  );
};