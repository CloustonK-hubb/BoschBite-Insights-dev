import { createTheme } from "@mui/material";

export const customTheme = createTheme({
  palette: {
    primary: { main: "#b1c8ea", contrastText: "#382322" },
    secondary: { main: "#ffebaa", contrastText: "#382322" },
    text: { primary: "#382322" },
  },
  components: {
    //Stykes the side bar navigation as a whole inclusing the panel, the background colour and its boarder 
     MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#b1c8ea",
          borderRight: "none",
          //Changing the colour of the title block
          "& .MuiPaper-root": {
            backgroundColor: "#f1e5d5"
          }
        },
      },
    },
    // MuiListItemButton styles each clickable row inside it
    // Sidebar items: hover and selected (clicked) states
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(253, 235, 222, 0.5)", // faded #fdebde
          },
          "&.Mui-selected, &.Mui-selected:hover": {
            backgroundColor: "#fdebde",
            color: "#382322",
          },
        },
      },
    },
  },
});
