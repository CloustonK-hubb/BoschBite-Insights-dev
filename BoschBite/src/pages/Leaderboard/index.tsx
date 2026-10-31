import { ScoreBreakdownFooter } from "./scoreBreakdownFooter";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";


//Leaderboard page with a placeholder for now, where the leadreboard must go 
export const LeaderboardPage = () => {


  //Function to scroll to the score breakdown footer when the info icon is clicked
  const scrollToBreakdown = () => {
    document
      .getElementById("score-breakdown")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  return (
    <Box sx={{ p: 3 }}>
      {/* Editing the Leaderboard heading to include an info icon that when clicked will scroll down to the score breakdown footer automatically */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="h5" fontWeight={500}>
          Leaderboard
        </Typography>
        <Tooltip
          title="Overall score out of 100: reach 25%, loyalty 25%, efficiency 25% and location 25%. Click to see the full breakdown below."
          arrow
        >
          <IconButton size="small" onClick={scrollToBreakdown} aria-label="How the leaderboard is scored">
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Placeholder until the leaderboard table is built. This section must be replaced with actual data for the leaderboard */}
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
        Leaderboard table coming soon {/*Placeholder text. Can be replaced*/}
      </Box>

      {/* Score breakdown footer. Must remain at the bottom of the leaderboard. DO NOT REMOVE */}
      <ScoreBreakdownFooter />
    </Box>
  );
};