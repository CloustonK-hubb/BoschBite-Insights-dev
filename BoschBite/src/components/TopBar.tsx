import { useBreadcrumb, useMenu, type TreeMenuItem } from "@refinedev/core";
import { useThemedLayoutContext } from "@refinedev/mui";
import { Link } from "react-router";
import { Box, Breadcrumbs, IconButton, Tooltip, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import { INSIGHTS } from "./SideContents";

const BROWN = "#382322";
const MUTED = "rgba(56, 35, 34, 0.6)";

//Works out the section name shown at the top left
const sectionFor = (name?: string) => {
  if (!name) return "BoschBite Insights";
  if (INSIGHTS.includes(name)) return "Insights";
  if (name === "my-profile") return "Account";
  return "Admin tools";
};

//Flattens the menu tree so the page you are on can be found by its key
const flatten = (items: TreeMenuItem[]): TreeMenuItem[] =>
  items.flatMap((item) => [item, ...flatten(item.children ?? [])]);


/* 
   TOP BAR: Menu button, section name, then the breadcrumbs underneath
*/

export const TopBar = () => {
  const { menuItems, selectedKey } = useMenu();
  const { breadcrumbs } = useBreadcrumb();
  const { siderCollapsed, setSiderCollapsed, mobileSiderOpen, setMobileSiderOpen } = useThemedLayoutContext();

  //Finds the menu item for the page you are on, then names its section
  const current = flatten(menuItems).find((item) => item.key === selectedKey);
  const section = sectionFor(current?.name);

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1100,
        bgcolor: "#fff",
      }}
    >
      {/* Menu button and section name */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          height: 64,
          px: 3,
          borderBottom: "1px solid rgba(56, 35, 34, 0.1)",
        }}
      >
        {/* Desktop: collapses and expands the side navigation */}
        <Tooltip title={siderCollapsed ? "Show menu" : "Hide menu"}>
          <IconButton
            onClick={() => setSiderCollapsed(!siderCollapsed)}
            sx={{ display: { xs: "none", md: "inline-flex" }, color: BROWN, ml: -1 }}
          >
            {siderCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Tooltip>

        {/* Phones: opens the side navigation */}
        <IconButton
          onClick={() => setMobileSiderOpen(!mobileSiderOpen)}
          sx={{ display: { xs: "inline-flex", md: "none" }, color: BROWN, ml: -1 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography sx={{ fontWeight: 700, fontSize: 16, color: BROWN }}>{section}</Typography>
      </Box>

      {/* Breadcrumbs */}
      <Breadcrumbs separator="/" sx={{ px: 3, py: 1.5, fontSize: 13, "& .MuiBreadcrumbs-separator": { color: MUTED } }}>
        <Typography
          component={Link}
          to="/dashboard"
          sx={{ fontSize: 13, color: MUTED, textDecoration: "none", "&:hover": { color: BROWN } }}
        >
          Home
        </Typography>

        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;

          return crumb.href && !isLast ? (
            <Typography
              key={`${crumb.label}-${i}`}
              component={Link}
              to={crumb.href}
              sx={{ fontSize: 13, color: MUTED, textDecoration: "none", "&:hover": { color: BROWN } }}
            >
              {crumb.label}
            </Typography>
          ) : (
            <Typography
              key={`${crumb.label}-${i}`}
              sx={{ fontSize: 13, color: isLast ? BROWN : MUTED, fontWeight: isLast ? 700 : 400 }}
            >
              {crumb.label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};