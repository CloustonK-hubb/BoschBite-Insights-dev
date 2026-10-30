import { Box, Typography, Button, Chip, Link } from "@mui/material";
import { useList, useGo } from "@refinedev/core";
import { keyframes } from "@emotion/react";

//defined constant terms for the landing page
const cream = "#f1e5d5"
const font = "'Outfit', sans-serif";
const cardColours = ["primary.main", "text.primary", "secondary.main"]; // blue, brown, yellow
const Default_Logo_URL = "https://llvvjvvkwbjnnvmzpdok.supabase.co/storage/v1/object/public/vendor-logos/defaultAvatar.webp"
//How many times the carousel of logos will repeat before it loops back to the start 
const REPEATS = 3;
const scroll = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(-${100 / REPEATS}%); }
`;


export const LandingPage = () => {

  //Constant variable required
  const { result, query } = useList({
    resource: "Vendor_logo",
    pagination: { mode: "off" },

    });
    const logos = (result?.data ?? []).filter(
      (logo) => !logo.logo_url?.includes("defaultAvatar")
    ); //Filter to exclude any default avatar images from showing up in the carousel of brands 
    const isLoading = query.isLoading;  
    const go = useGo();
    const track = Array(REPEATS).fill(logos).flat();

    return (
        <Box sx={{ minHeight: "100vh", p: 4, bgcolor: cream, fontFamily: font }}>
      {/* 1. Logo */}
      <Box>
        <img src="/BoschBites-logo-cropped.png" alt="BoschBite Insights logo" height={150} />
      </Box>

      {/* Centred content */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 3,  minHeight: "100vh",
        p: 4, bgcolor: cream, color: "text.primary", fontFamily: font }}>


        {/* 3. Headline */}
        <Typography variant="h2" color="text.primary" sx={{ fontFamily: font, fontWeight: 800, fontSize: { xs: "2.25rem", md: "3.75rem" }, lineHeight: 1.1 }}>
          Understand Your Student Market.
          <br />
          Make Smarter Decisions.
        </Typography>

        {/* 4. Paragraph */}
        <Typography sx={{ fontFamily: font, fontWeight: 600, fontSize: "1.1rem", maxWidth: 700 }}>
          Join BoschBite and turn student transaction data into valuable insights. Using anonymised BoschCard data, 
          discover who your student customers are, what they want, and how demand changes over time, helping businesses make informed decisions
          with confidence, not assumptions
        </Typography>

        {/* 5. Logo cards */}
        <Box sx={{ width: "100%", overflow: "hidden", py: 4 }}>
  <Box
    sx={{
      display: "flex",
      width: "max-content",
      animation: `${scroll} 40s linear infinite`,
      "&:hover": { animationPlayState: "paused" },
      "@media (prefers-reduced-motion: reduce)": { animation: "none" },
    }}
  >
    {track.map((logo, i) => {
      const originalIndex = i % logos.length;
      const cardColour = cardColours[originalIndex % cardColours.length];
      const isBrownCard = cardColour === "text.primary";
      const url = logo.logo_url;

      return (
        <Box
          key={`${logo.vendor_id}-${i}`}
          sx={{
            width: 220,
            height: 260,
            mr: 3,
            borderRadius: 6,
            bgcolor: cardColour,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Box
            role="img"
            aria-label="Vendor logo"
            sx={{
              width: "80%",
              height: "60%",
              //if the background is brown the colour of the logo will be cream
              bgcolor: isBrownCard ? cream : "text.primary",
              maskImage: `url(${url})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${url})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
        </Box>
      );
    })}
  </Box>
</Box>

        {/* 6. Sign up Button */}
        <Button variant="contained" color="primary" onClick={() => go({ to: "/register" })}
          sx={{
          borderRadius: 999,
          border: "1px solid",
          borderColor: "text.primary",
          boxShadow: "none",
          textTransform: "none",
          fontFamily: font,
          fontWeight: 800,
          fontSize: "1.5rem",
          px: 6,
        }}> Get Started </Button>

        {/* 7. Sign in link */}
        <Typography sx={{ fontFamily: font, fontWeight: 500 }}>
          Already have an account?{" "}
          <Link
            component="button"
            onClick={() => go({ to: "/login" })}
            sx={{
              fontFamily: font,
              fontWeight: 700,
              fontSize: "inherit",
              color: "text.primary",
              textDecorationColor: "inherit",
              verticalAlign: "baseline",
            }}
          >
            Sign in
          </Link>
        </Typography>

      </Box> {/*closing box tag for the centered content */}
      {/* Closing box tag for overall landing page */}
    </Box> 
    
    
  
  );

   
};