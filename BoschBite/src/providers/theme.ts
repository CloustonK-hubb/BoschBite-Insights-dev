import { createTheme } from "@mui/material";

export const customTheme = createTheme({
  palette: {
    primary: { main: "#b1c8ea", contrastText: "#382322" },
    secondary: { main: "#ffebaa", contrastText: "#382322" },
    text: { primary: "#382322" },
  },
  components: {
    //Styles the side bar navigation as a whole including the panel, the background colour and its boarder 
     MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#b1c8ea",
          borderRight: "none",
          //Changing the colour and shape (pill shaped) of the title block
          "& .MuiPaper-root": {
            backgroundColor: "#f1e5d5",
            borderRadius: 24,
            margin: "2px 2px 2px",
            width: "auto",
            boxShadow: "none",
          }, 
          "& .MuiListItemText-primary": {
          color: "#382322",
          fontWeight: 550,
          },
          //Navigation icons: match the text colour
          "& .MuiListItemIcon-root": {
          color: "#382322",
          },
        },
      },
    },
    // MuiListItemButton styles each clickable row inside it
    // Sidebar items: hover and selected (clicked) states
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,     // fully rounded ends
          margin: "4px 12px",    // space above/below, and in from the sides
          width: "auto",         // shrink to fit inside the margins
          paddingLeft: 16,       // keeps icons nicely spaced from the rounded edge
          "&:hover": {
            backgroundColor: "rgba(253, 235, 222, 0.5)", // faded #fdebde
          },
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: "#f1e5d5",
            color: "#382322",
          },
        },
      },
    },
  },
});
