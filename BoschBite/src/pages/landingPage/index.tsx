import { Box, Typography, Button, Chip } from "@mui/material";


export const LandingPage = () => {
    return (
        <Box sx={{ minHeight: "100vh", p: 4 }}>
      {/* 1. Logo */}
      <Box>
        <img src="/BoschBites-logo-cropped.png" alt="BoschBite Insights logo" height={80} />
      </Box>

      {/* Centred content */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 3,  minHeight: "100vh",
        p: 4, bgcolor: "background.default", color: "text.primary", fontFamily: "'Outfit', sans-serif", }}>

        {/* 2. Pill */}
        <Chip label="JOIN YOUR FELLOW HAPPY EATERY BRANDS" />

        {/* 3. Headline */}
        <Typography variant="h2" color="text.primary">
          Understand Your Student Market.
          <br />
          Make Smarter Decisions.
        </Typography>

        {/* 4. Paragraph */}
        <Typography sx={{ maxWidth: 700 }}>
          Join BoschBite and turn student transaction data into valuable insights. Using anonymised BoschCard data, 
          discover who your student customers are, what they want, and how demand changes over time, helping businesses make informed decisions
          with confidence, not assumptions
        </Typography>

        {/* 5. Logo cards (placeholder for now) */}
        <Box sx={{ width: "100%", height: 200, border: "1px dashed grey" }}>
          Logo cards go here
        </Box>

        {/* 6. Sign up Button */}
        <Button variant="contained">Get Started</Button>
      </Box> {/*closing box tag for the centered content */}
      {/* Closing box tag for overall landing page */}
    </Box> 
    );
};