import { createTheme, type SxProps, type Theme } from "@mui/material";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { rainbowSurgePalette } from "@mui/x-charts/colorPalettes";
import type { CSSProperties } from "react";

type Sx = SxProps<Theme>;

/*
COLOURS
 */

export const brand = {
  brown: "#382322",
  cream: "#f1e5d5",
  accent: "#F8E8A8",
  red: "#D72C32",
  green: "#2E7D5B",
  blue: "#b1c8ea",
  yellow: "#ffebaa",
  muted: "rgba(56, 35, 34, 0.6)",
};

const { brown, cream, accent, red, green, muted } = brand;

//Soft shadow used on rows and cards, and the stronger one on hover
const shadow = "0 1px 3px rgba(56, 35, 34, 0.06), 0 6px 18px rgba(56, 35, 34, 0.04)";
const shadowHover = "0 2px 6px rgba(56, 35, 34, 0.08), 0 10px 26px rgba(56, 35, 34, 0.08)";


/*
SHARED PIECES
 */

//Pill shaped buttons at the top of each list page (Export, Create)
export const pillButton = {
  borderRadius: 999,
  px: 2.5,
  py: 0.75,
  fontWeight: 700,
  textTransform: "none",
  bgcolor: brown,
  color: cream,
  boxShadow: "none",
  "&:hover": { bgcolor: "#2a1a19", boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: "rgba(56, 35, 34, 0.3)", color: cream },
} as const;

//Page title and the line under it, the same as the list, show and People pages (used by the dashboard and leaderboard)
export const pageTitle = { fontSize: 30, fontWeight: 800, color: brown, lineHeight: 1.1 } as const;
export const pageSubtitle = { color: "text.secondary", mt: 0.5 } as const;

//Small capital labels above columns
const columnLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: "text.secondary",
} as const;

//Column widths for each person row on the People page (on a phone the columns stack)
const personGrid = { xs: "1fr", md: "2.4fr 1.4fr 1.4fr 1fr 1.7fr" };

/*
SIDE NAVIGATION
 */

//Hides the scroll bar, but the menu still scrolls with the mouse wheel or trackpad
const hiddenScrollbar = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": { display: "none" },
} as const;

//A thin, soft brown scroll bar
const slimScrollbar = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(56, 35, 34, 0.25) transparent",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(56, 35, 34, 0.25)", borderRadius: 999 },
} as const;

export const siderStyles = {
  //The part of the side navigation that scrolls (profile block and menu)
  scroll: { flex: 1, minHeight: 0, overflowY: "auto", ...hiddenScrollbar } as Sx,
  //Kept so the slim version is ready to use: change ...hiddenScrollbar above to ...slimScrollbar
  slimScroll: { flex: 1, minHeight: 0, overflowY: "auto", ...slimScrollbar } as Sx,
};


/*
LIST PAGES (Transactions, Students, Calendar, Promotion windows)
 */

export const listStyles = {
  //The card around the whole page
  //overflow visible stops the buttons and the table's shadow being cut off at the edges
  wrapper: { bgcolor: "transparent", boxShadow: "none", backgroundImage: "none", maxWidth: 1200, mx: "auto", overflow: "visible" } as Sx,
  //Title row, including the Export and Create buttons
  header: {
    px: 0,
    pt: 1,
    pb: 3,
    gap: 2,
    "& .MuiCardHeader-content": { minWidth: 0 },
    //Keeps the buttons inside the page and lines them up with the title
    "& .MuiCardHeader-action": { m: 0, alignSelf: "center", flexShrink: 0 },
    "& .MuiButton-root": pillButton,
  } as Sx,
  content: { p: 0, "&:last-child": { pb: 0 } } as Sx,
  title: { fontSize: 30, fontWeight: 800, color: brown, lineHeight: 1.1 } as Sx,
  subtitle: { color: "text.secondary", mt: 0.5 } as Sx,
  headerButtons: { display: "flex", alignItems: "center", gap: 1 } as Sx,
  //Show, Edit and Delete icons side by side in a table row
  actionIcons: { display: "flex", alignItems: "center", gap: 0.25, height: "100%" } as Sx,
};


/*
SHOW PAGES (one record: Transaction, Student, Calendar, Promotion window)
 */

export const showStyles = {
  //The card around the whole page
  wrapper: { bgcolor: "transparent", boxShadow: "none", backgroundImage: "none", maxWidth: 900, mx: "auto", overflow: "visible" } as Sx,
  //Title row with the back arrow and the Edit and Delete buttons
  header: {
    px: 0,
    pt: 1,
    pb: 3,
    gap: 2,
    "& .MuiCardHeader-avatar": { alignSelf: "center", mr: 1 },
    "& .MuiCardHeader-avatar .MuiIconButton-root": { color: brown, bgcolor: cream, "&:hover": { bgcolor: "#e8d8c3" } },
    "& .MuiCardHeader-content": { minWidth: 0 },
    "& .MuiCardHeader-action": { m: 0, alignSelf: "center", flexShrink: 0 },
  } as Sx,
  //Edit and Delete buttons at the top right
  headerButtons: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 } as Sx,
  editButton: pillButton as Sx,
  deleteButton: { ...pillButton, bgcolor: red, "&:hover": { bgcolor: "#b8242a", boxShadow: "none" } } as Sx,
  //Message shown when a record can't be loaded
  error: { borderRadius: 3, gridColumn: "1 / -1" } as Sx,
  content: { p: 0, "&:last-child": { pb: 0 } } as Sx,
  title: { fontSize: 30, fontWeight: 800, color: brown, lineHeight: 1.1 } as Sx,
  subtitle: { color: "text.secondary", mt: 0.5 } as Sx,
  //White card holding the details, two columns on a wide screen
  card: {
    bgcolor: "#fff",
    borderRadius: 4,
    boxShadow: shadow,
    p: { xs: 2.5, md: 3.5 },
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
    columnGap: 4,
    rowGap: 3,
  } as Sx,
  field: { minWidth: 0 } as Sx,
  //A field that spans both columns (e.g. Address)
  fieldWide: { minWidth: 0, gridColumn: "1 / -1" } as Sx,
  label: { ...columnLabel, mb: 0.5 } as Sx,
  value: { fontSize: 15, fontWeight: 600, color: brown, wordBreak: "break-word" } as Sx,
};


/*
PEOPLE PAGE
 */

export const peopleStyles = {
  page: { maxWidth: 1100, mx: "auto", py: 1 } as Sx,

  //Title and search
  header: { display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 3 } as Sx,
  title: { fontSize: 30, fontWeight: 800, color: brown, lineHeight: 1.1 } as Sx,
  subtitle: { color: "text.secondary", mt: 0.5 } as Sx,
  search: {
    width: { xs: "100%", sm: 280 },
    "& .MuiOutlinedInput-root": {
      bgcolor: "#fff",
      borderRadius: 999,
      "& fieldset": { border: "none" },
      boxShadow: "0 1px 3px rgba(56, 35, 34, 0.08)",
    },
  } as Sx,
  error: { mb: 3, borderRadius: 3 } as Sx,

  //Pending / Verified / Denied tabs
  tabs: { display: "inline-flex", gap: 0.5, p: 0.5, mb: 3, bgcolor: cream, borderRadius: 999 } as Sx,
  tab: (selected: boolean): Sx => ({
    borderRadius: 999,
    px: 2.5,
    py: 0.75,
    fontWeight: 700,
    textTransform: "none",
    bgcolor: selected ? brown : "transparent",
    color: selected ? cream : brown,
    "&:hover": { bgcolor: selected ? brown : "rgba(56, 35, 34, 0.08)" },
  }),
  tabCount: (selected: boolean): Sx => ({
    ml: 1,
    px: 1,
    minWidth: 22,
    borderRadius: 999,
    fontSize: 12,
    lineHeight: "20px",
    bgcolor: selected ? "rgba(241, 229, 213, 0.2)" : "rgba(56, 35, 34, 0.08)",
  }),

  //Column labels above the list (hidden on phones)
  columnLabels: { display: { xs: "none", md: "grid" }, gridTemplateColumns: personGrid, gap: 2, px: 2.5, pb: 1 } as Sx,
  columnLabel: columnLabel as Sx,

  //The list and its loading / empty states
  list: { display: "flex", flexDirection: "column", gap: 1.5 } as Sx,
  skeleton: { borderRadius: 3 } as Sx,
  empty: { textAlign: "center", py: 8, color: "text.secondary" } as Sx,
  emptyIcon: { fontSize: 44, opacity: 0.4 } as Sx,
  emptyText: { mt: 1 } as Sx,

  //One person
  row: {
    display: "grid",
    gridTemplateColumns: personGrid,
    gap: { xs: 1.5, md: 2 },
    alignItems: "center",
    bgcolor: "#fff",
    borderRadius: 3,
    px: 2.5,
    py: 2,
    boxShadow: shadow,
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
    "&:hover": { boxShadow: shadowHover },
  } as Sx,
  person: { display: "flex", alignItems: "center", gap: 2, minWidth: 0 } as Sx,
  avatar: (hasLogo: boolean): Sx => ({
    width: 44,
    height: 44,
    bgcolor: accent,
    color: brown,
    fontWeight: 700,
    fontSize: 16,
    border: hasLogo ? "1px solid #eee" : "none",
  }),
  avatarImage: { objectFit: "contain", background: "#fff" } as CSSProperties,
  nameText: { minWidth: 0 } as Sx,
  nameLine: { display: "flex", alignItems: "center", gap: 1 } as Sx,
  name: { fontWeight: 700, color: brown } as Sx,
  email: { color: "text.secondary" } as Sx,
  youChip: { height: 20, fontSize: 11, fontWeight: 700, bgcolor: cream, color: brown } as Sx,
  roleSelect: {
    bgcolor: cream,
    color: brown,
    borderRadius: 999,
    pl: 1.75,
    fontSize: 13,
    fontWeight: 700,
    "& .MuiSelect-select": { py: 0.5, "&:focus": { bgcolor: "transparent" } },
  } as Sx,
  roleText: { fontSize: 13, fontWeight: 700, color: brown } as Sx,
  vendor: { fontSize: 14, color: brown } as Sx,
  joined: { fontSize: 13, color: "text.secondary" } as Sx,

  //Buttons on the right of each person
  actions: { display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1 } as Sx,
  verifyButton: { borderRadius: 999, px: 2, fontWeight: 700, bgcolor: green, "&:hover": { bgcolor: "#256a4b" } } as Sx,
  denyButton: { borderRadius: 999, px: 1.5, fontWeight: 700, color: red } as Sx,
  reinstateButton: { borderRadius: 999, px: 1.5, fontWeight: 700, color: green } as Sx,
  awaitingChip: { bgcolor: accent, color: brown, fontWeight: 700 } as Sx,
  removeIcon: { color: "text.secondary", "&:hover": { color: red, bgcolor: "rgba(215, 44, 50, 0.08)" } } as Sx,

  //Remove confirmation box
  dialog: { borderRadius: 4, p: 1 } as Sx,
  dialogTitle: { fontWeight: 800, color: brown } as Sx,
  dialogActions: { px: 3, pb: 2 } as Sx,
  cancelButton: { borderRadius: 999, color: brown, fontWeight: 700 } as Sx,
  removeButton: { borderRadius: 999, fontWeight: 700, bgcolor: red, "&:hover": { bgcolor: "#b8242a" } } as Sx,
};


/*
   DASHBOARD AND LEADERBOARD
   Colours and margins shared by the business dashboard and the leaderboard.
   Change them here and both pages update.
 */

//Colours used on both pages (brown, blue and yellow come from brand above)
export const insightsColours = {
  blue: brand.blue,
  yellow: brand.yellow,
  brown: brand.brown,
  //Lighter cream than brand.cream, used for chips, the week strip and rank badges
  cream: "#FDEBDE",
  midBlue: "#5F7FB5",
  taupe: "#8A7370",
  //Soft brown outline around the cards
  border: "rgba(56, 35, 34, 0.15)",
  //Green for an increase and red for a decrease
  up: "#2E7D32",
  down: "#C62828",
};

//Chart colours from the MUI rainbow surge palette
const chartPalette = rainbowSurgePalette("light");

//Dashboard charts: market bars and the vendor's own orders
export const chartColours = { market: chartPalette[0], you: chartPalette[1] };

//Dashboard week strip: exams, term dates and other events
export const eventColours = { exam: chartPalette[2], term: chartPalette[3], event: chartPalette[4] };

//Leaderboard: one colour per part of the score
export const scorePartColours = {
  reach: chartPalette[0],
  loyalty: chartPalette[1],
  efficiency: chartPalette[2],
  location: chartPalette[3],
};

//Page margins for the dashboard and the leaderboard
export const insightsLayout = {
  //Height taken by Refine's top bar and the layout's own padding
  //If the dashboard still scrolls or leaves a gap at the bottom, adjust this number
  offsetPx: 112,
  //Extra white space left and right of the content
  sideMargin: { xs: 1, md: 4, lg: 8 },
};


/*
   APP THEME
 */

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
          ...hiddenScrollbar,
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

    //Tables (DataGrid): settings every table in the app uses
    MuiDataGrid: {
      defaultProps: {
        rowHeight: 48,
        columnHeaderHeight: 52,
        disableRowSelectionOnClick: true,
        disableColumnMenu: true,
      },
      //Tables: one white rounded card with thin lines between the rows (matches the People page)
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: "#fff",
          boxShadow: shadow,
          color: brown,
          //Light cream strip behind the column labels
          "--DataGrid-containerBackground": "#faf5ee",
          //Thin line between rows
          "--DataGrid-rowBorderColor": "rgba(56, 35, 34, 0.08)",

          //Column labels: small, bold, capitals
          "& .MuiDataGrid-columnHeader": { padding: "0 16px" },
          "& .MuiDataGrid-columnHeaderTitleContainer": { overflow: "visible" },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: muted,
            //Long labels go onto a second line instead of being cut off
            whiteSpace: "normal",
            lineHeight: 1.2,
            overflow: "visible",
          },
          "& .MuiDataGrid-columnSeparator": { display: "none" },
          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
          "& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton": { color: muted },

          //Rows: faint cream when you hover over one
          "& .MuiDataGrid-row:hover, & .MuiDataGrid-row.Mui-selected, & .MuiDataGrid-row.Mui-selected:hover": {
            backgroundColor: "rgba(241, 229, 213, 0.35)",
          },

          //Cells: text centred in the row
          "& .MuiDataGrid-cell": {
            padding: "0 16px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
          },
          "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": { outline: "none" },

          //Show, Edit and Delete icons
          "& .MuiDataGrid-cell .MuiButton-root": {
            minWidth: 0,
            padding: 4,
            borderRadius: 999,
            color: brown,
            "&:hover": { backgroundColor: cream },
          },
          "& .MuiDataGrid-cell .MuiButton-colorError": {
            color: red,
            "&:hover": { backgroundColor: "rgba(215, 44, 50, 0.08)" },
          },

          //Page controls at the bottom
          "& .MuiTablePagination-root": { color: brown },
          "& .MuiDataGrid-overlay": { backgroundColor: "transparent", color: muted },
        },
      },
    },
  },
});