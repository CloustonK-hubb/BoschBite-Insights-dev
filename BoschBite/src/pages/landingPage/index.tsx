import { Box, Typography, Button, Chip } from "@mui/material";
import { useList, useGo } from "@refinedev/core";

const cream = "#f1e5d5"
const font = "'Outfit', sans-serif";
const cardColours = ["primary.main", "text.primary", "secondary.main"]; // blue, brown, yellow
const Default_Logo_URL = "https://llvvjvvkwbjnnvmzpdok.supabase.co/storage/v1/object/public/vendor-logos/defaultAvatar.webp"

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

    return (
        <Box sx={{ minHeight: "100vh", p: 4, bgcolor: cream, fontFamily: font }}>
      {/* 1. Logo */}
      <Box>
        <img src="/BoschBites-logo-cropped.png" alt="BoschBite Insights logo" height={100} />
      </Box>

      {/* Centred content */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 3,  minHeight: "100vh",
        p: 4, bgcolor: cream, color: "text.primary", fontFamily: font }}>

        {/* 2. Pill */}
        <Chip label="JOIN YOUR FELLOW HAPPY EATERY BRANDS" 
          sx={{
          bgcolor: "text.primary",
          color: "secondary.main",
          border: "1px solid",
          borderColor: "text.primary",
          fontFamily: font,
          fontWeight: 700,
          px: 2,
          py: 2.5,
          }}/>

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

        {/* 5. Logo cards (placeholder for now) */}
        <Box sx={{ display: "flex", gap: 3, justifyContent: "safe center", width: "100%", overflow: "auto", perspective: "1200px", py: 4 }}>
          {logos.map((logo, index) => {
                const cardColour = cardColours[index % cardColours.length];
                const isBrownCard = cardColour === "text.primary";
                const url = logo.logo_url;

                return (
                  <Box
                    key={logo.vendor_id}
                    sx={{
                      width: 220,
                      height: 260,
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

        {/* 6. Sign up Button */}
        <Button variant="contained" color="primary" onClick={() => go({ to: "/login" })}
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
      </Box> {/*closing box tag for the centered content */}
      {/* Closing box tag for overall landing page */}
    </Box> 
    );
};