import { useEffect, useState } from "react";
import { useGetIdentity, useLogout, useMenu, type TreeMenuItem } from "@refinedev/core";
import { Link } from "react-router";
import { Avatar, Box, Button, Chip, Collapse, Divider, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography } from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import { supabaseClient } from "../providers/supabaseClient";


/* 
   SETTINGS
   Easy to change colours, sections and labels
 */

//Colour for the avatar and the selected menu item
const ACCENT = "#F8E8A8";
const TEXT = "#2B2B3A";

//Pages shown in the top section, in this order
const INSIGHTS = ["dashboard", "Leaderboard", "CalendarPage"];

//Pages that are reached by clicking the avatar instead
const NOT_IN_MENU = ["my-profile"];

//Heading for the lower section
const ADMIN_LABEL = "ADMIN";

//Text shown on the role chip under the name
const ROLE_CHIP: Record<string, string> = {
  boschbite_admin: "Admin",
  vendor_admin: "Vendor Admin",
  vendor_manager: "Vendor Manager",
};

type Identity = {
  id: string;
  name?: string;
  avatar?: string;
  role: "boschbite_admin" | "vendor_admin" | "vendor_manager" | null;
  vendor_id: number | null;
};


/* 
   SIDE NAVIGATION CONTENT
 */

export const SiderContent = ({ collapsed }: { collapsed: boolean }) => {
  const { data: me } = useGetIdentity<Identity>();
  const { menuItems, selectedKey } = useMenu();
  const { mutate: logout } = useLogout();

  const [vendorName, setVendorName] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  //Vendor users see their vendor's name under their role
  useEffect(() => {
    if (!me?.vendor_id) {
      setVendorName(null);
      return;
    }

    supabaseClient
      .from("Vendor")
      .select("name")
      .eq("vendor_id", me.vendor_id)
      .maybeSingle()
      .then(({ data }) => setVendorName(data?.name ?? null));
  }, [me?.vendor_id]);

  //Only admins can see the User profiles page
  const canSeeProfiles =
    me?.role === "boschbite_admin" || me?.role === "vendor_admin";

  const visible = menuItems.filter(
    (i) =>
      !NOT_IN_MENU.includes(i.name) &&
      (i.name !== "profiles" || canSeeProfiles),
  );

  //Splitting the menu into the top section and the lower section
  const insightsItems = INSIGHTS.map((n) =>
    visible.find((i) => i.name === n),
  ).filter((i): i is TreeMenuItem => !!i);

  const adminItems = visible.filter((i) => !INSIGHTS.includes(i.name));

  //Initials shown on the avatar until a photo is uploaded
  const initials = (me?.name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  /* MENU ITEMS */

  //Styling for each menu button, indented by depth
  const itemSx = (depth: number) => ({
    borderRadius: 999,
    mx: 1.5,
    mb: 0.5,
    py: 0.75,
    pl: collapsed ? 1.5 : 2 + depth * 3,
    justifyContent: collapsed ? "center" : "flex-start",
    color: TEXT,
    "&.Mui-selected, &.Mui-selected:hover": { bgcolor: ACCENT },
  });

  const renderItem = (item: TreeMenuItem, depth = 0) => {
    const key = String(item.key ?? item.name);
    const children = item.children ?? [];
    const hasChildren = children.length > 0;
    const label = item.label ?? item.name;

    //Only the top level items show an icon
    const icon =
      depth === 0 && item.icon ? (
        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: TEXT }}>
          {item.icon}
        </ListItemIcon>
      ) : null;

    const text = collapsed ? null : (
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: 14,
          fontWeight: hasChildren ? 700 : 500,
        }}
      />
    );

    //Groups (e.g. BoschCard data) open and close
    if (hasChildren) {
      const isOpen =
        openGroups[key] ?? children.some((c) => c.key === selectedKey);

      return (
        <Box key={key}>
          <Tooltip title={collapsed ? label : ""} placement="right">
            <ListItemButton
              onClick={() =>
                setOpenGroups((prev) => ({ ...prev, [key]: !isOpen }))
              }
              sx={itemSx(depth)}
            >
              {icon}
              {text}
              {!collapsed &&
                (isOpen ? (
                  <ExpandLess fontSize="small" />
                ) : (
                  <ExpandMore fontSize="small" />
                ))}
            </ListItemButton>
          </Tooltip>

          {!collapsed && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {children.map((c) => renderItem(c, depth + 1))}
              </List>
            </Collapse>
          )}
        </Box>
      );
    }

    //Normal pages link straight to their route
    return (
      <Tooltip key={key} title={collapsed ? label : ""} placement="right">
        <ListItemButton
          component={Link}
          to={item.route ?? "/"}
          selected={selectedKey === item.key}
          sx={itemSx(depth)}
        >
          {icon}
          {text}
        </ListItemButton>
      </Tooltip>
    );
  };

  //A heading with its list of menu items underneath
  const section = (title: string, items: TreeMenuItem[]) =>
    items.length === 0 ? null : (
      <Box sx={{ mt: 1 }}>
        {collapsed ? (
          <Divider sx={{ my: 1 }} />
        ) : (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              px: 3,
              pt: 1.5,
              pb: 0.5,
              fontWeight: 700,
              letterSpacing: 1,
              color: "text.secondary",
            }}
          >
            {title}
          </Typography>
        )}
        <List disablePadding>{items.map((i) => renderItem(i))}</List>
      </Box>
    );

  /* LAYOUT */

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Profile block at the top, click it to open My Profile */}
      <Box
        component={Link}
        to="/my-profile"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          textDecoration: "none",
          color: TEXT,
          px: 2,
          py: 2,
        }}
      >
        <Avatar
          src={me?.avatar}
          sx={{
            width: collapsed ? 40 : 84,
            height: collapsed ? 40 : 84,
            bgcolor: ACCENT,
            color: TEXT,
            fontWeight: 700,
            fontSize: collapsed ? 16 : 28,
          }}
        >
          {initials}
        </Avatar>

        {!collapsed && (
          <>
            <Typography sx={{ fontWeight: 700, mt: 1.5 }}>
              {me?.name ?? ""}
            </Typography>

            {me?.role && (
              <Chip
                label={ROLE_CHIP[me.role] ?? me.role}
                size="small"
                sx={{ mt: 0.75, bgcolor: "#fff", fontWeight: 700 }}
              />
            )}

            <Typography
              variant="caption"
              sx={{ mt: 0.75, color: "text.secondary" }}
            >
              {vendorName ?? "BoschBite Insights"}
            </Typography>
          </>
        )}
      </Box>

      <Divider sx={{ mx: 2 }} />

      {/* The two menu sections */}
      {section("INSIGHTS", insightsItems)}
      {section(ADMIN_LABEL, adminItems)}

      {/* Log out button pinned to the bottom of the side navigation */}
      <Box sx={{ mt: "auto", p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => logout()}
          startIcon={collapsed ? undefined : <LogoutIcon />}
          sx={{
            borderRadius: 999,
            color: TEXT,
            borderColor: TEXT,
            fontWeight: 700,
            minWidth: 0,
          }}
        >
          {collapsed ? <LogoutIcon /> : "Log out"}
        </Button>
      </Box>
    </Box>
  );
};