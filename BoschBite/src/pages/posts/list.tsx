import { useMany } from "@refinedev/core";
import { EditButton, List, useDataGrid, DateField, DeleteButton } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ICategory, IPost } from "../../interfaces";
import { ShowButton } from "@refinedev/mui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Select, Skeleton, TextField, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { supabaseClient } from "../../providers/supabaseClient";

//List object for a transaction 

export const TransactionList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Transaction", meta: { select: "*, Vendor(name), Student(first_name, last_name)"  }, });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "transaction_id", headerName: "ID", type: "number", width: 90 },
      { field: "student_id", headerName: "Student name", flex: 1, minWidth: 130, renderCell: ({ row }) => row.Student?`${row.Student.first_name} ${row.Student.last_name}` : row.id_number, },
      { field: "vendor_id", headerName: "Vendor name", type: "number", width: 110, renderCell: ({ row }) => row.Vendor?.name ?? row.vendor_id, },
      { field: "datetime", headerName: "Date & time", flex: 1, minWidth: 180, renderCell: ({ row }) => (
          <DateField value={row.datetime} format="DD MMM YYYY HH:mm" />),},
      {field: "value",headerName: "Transaction value", type: "number", width: 110,
        renderCell: ({ row }) => Number(row.value).toFixed(2),},
      { field: "discount", headerName: "Discount", type: "number", width: 110 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.transaction_id} />}
    ],
    []
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        getRowId={(row) => row.transaction_id}
        autoHeight
      />
    </List>
  );
};

//List object for Students
export const StudentList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Student" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "id_number", headerName: "ID", width: 80 },
      { field: "first_name", headerName: "First name", flex: 1 },
      { field: "last_name", headerName: "Last name", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "dob", headerName: "Date of Birth", flex: 1, renderCell: ({ row }) => (<DateField value={row.dob} format="YYYY-MM-DD" />)}, 
      { field: "gender", headerName: "Gender", flex: 1}, 
      { field: "phone", headerName: "Cell number", flex: 1},
      { field: "address", headerName: "Address", felx: 1},
      { field: "actions", headerName: "Actions", sortable: false, width: 100, renderCell: ({ row }) => ( <>
        <ShowButton hideText recordItemId={row.id_number} />
        <EditButton hideText recordItemId= {row.id_number}/>
      </>
      )
      },
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.id_number}autoHeight />
    </List>
  );
};

//List object for Vendors
export const VendorList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Vendor", meta: { select: "*, Vendor_Type(name)" },});

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "vendor_id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Vendor name", flex: 1 },
      { field: "address", headerName: "Address", flex: 1 },
      { field: "gps", headerName: "GPS coordinates", flex: 1 },
      { field: "type_id", headerName: "Vendor type", flex: 1, sortable: false, renderCell: ({ row }) => row.Vendor_Type?.name ?? "-",}, 
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.vendor_id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.vendor_id}autoHeight />
    </List>
  );
};

//List object for Vendor Types
export const VendorTypesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Vendor_Type" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "type_id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Vendor type", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.type_id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.type_id}autoHeight />
    </List>
  );
};

//List object for the Calendar
export const CalendarList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Calendar" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "period_id", headerName: "ID", width: 80 },
      { field: "function", headerName: "Calendar function", flex: 1 },
      { field: "year", headerName: "Year", flex: 1 },
      { field: "start_date", headerName: "Start date", flex: 1 },
      { field: "end_date", headerName: "End date", flex: 1 },
      { field: "period_type", headerName: "Period category", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 150, renderCell: ({ row }) => ( <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
        <ShowButton hideText recordItemId={row.period_id} />
        <EditButton hideText recordItemId= {row.period_id}/>
       <DeleteButton hideText recordItemId= {row.period_id} meta ={{ idColumnName: "period_id"}}/>
      </Box>
      )},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.period_id}autoHeight />
    </List>
  );
};

//List objetc for the Promo_window table
export const PromoWindowList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Promo_Window", meta: { select: "*, Vendor(name)" }, });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "promo_id", headerName: "Promotion ID", width: 150 },
      { field: "vendor_id", headerName: "Vendor name", width: 240, renderCell: ({ row }) => row.Vendor?.name ?? "-", },
      { field: "promo_number", headerName: "Promotion number", width: 150 },
      { field: "start_date", headerName: "Start date", flex: 1 },
      { field: "end_date", headerName: "End date", flex: 1 },
      { field: "duration_days", headerName: "Duration (days)", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 150, renderCell: ({ row }) => ( <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, height: "100%" }}>
        <ShowButton hideText recordItemId={row.promo_id} />
        <EditButton hideText recordItemId= {row.promo_id}/>
        <DeleteButton hideText recordItemId= {row.promo_id} meta ={{ idColumnName: "promo_id"}}/>
      </Box>
      )},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.promo_id}autoHeight />
    </List>
  );
};


// List object for Profiles 

/* 
   SETTINGS
 */

const BROWN = "#382322";
const CREAM = "#f1e5d5";
const ACCENT = "#F8E8A8";
const RED = "#D72C32";
const GREEN = "#2E7D5B";

//Column widths for each row (on a phone the columns stack)
const ROW_GRID = { xs: "1fr", md: "2.4fr 1.4fr 1.4fr 1fr 1.7fr" };

type Role = "boschbite_admin" | "vendor_admin" | "vendor_manager";
type Status = "pending" | "verified" | "denied";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  vendor_id: number | null;
  status: Status;
  created_at: string;
};

type Identity = {
  id: string;
  role: Role | null;
  vendor_id: number | null;
};

const ROLE_LABELS: Record<Role, string> = {
  boschbite_admin: "BoschBite Admin",
  vendor_admin: "Vendor Admin",
  vendor_manager: "Vendor Manager",
};

const VENDOR_ROLES: Role[] = ["vendor_admin", "vendor_manager"];
const ALL_ROLES: Role[] = ["boschbite_admin", ...VENDOR_ROLES];

const TABS: { key: Status; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "verified", label: "Verified" },
  { key: "denied", label: "Denied" },
];

const EMPTY_TEXT: Record<Status, string> = {
  pending: "No one is waiting for approval.",
  verified: "No verified people yet.",
  denied: "No denied sign-ups.",
};


/* 
   ONE PERSON
 */

type PersonRowProps = {
  p: Profile;
  me: Identity;
  isBosch: boolean;
  vendorName: string;
  logo?: string;
  onStatus: (profile: Profile, status: "verified" | "denied") => void;
  onRole: (profile: Profile, role: Role) => void;
  onRemove: (profile: Profile) => void;
};

const PersonRow = ({ p, me, isBosch, vendorName, logo, onStatus, onRole, onRemove }: PersonRowProps) => {
  const isMe = p.id === me.id;
  const roleOptions = isBosch ? ALL_ROLES : VENDOR_ROLES;

  //Nobody can change their own role or remove themselves
  const manage = !isMe && (isBosch || VENDOR_ROLES.includes(p.role));

  const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: ROW_GRID,
        gap: { xs: 1.5, md: 2 },
        alignItems: "center",
        bgcolor: "#fff",
        borderRadius: 3,
        px: 2.5,
        py: 2,
        boxShadow: "0 1px 3px rgba(56, 35, 34, 0.06), 0 6px 18px rgba(56, 35, 34, 0.04)",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 6px rgba(56, 35, 34, 0.08), 0 10px 26px rgba(56, 35, 34, 0.08)",
        },
      }}
    >
      {/* Picture, name and email */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <Avatar
          src={logo}
          imgProps={{ style: { objectFit: "contain", background: "#fff" } }}
          sx={{ width: 44, height: 44, bgcolor: ACCENT, color: BROWN, fontWeight: 700, fontSize: 16, border: logo ? "1px solid #eee" : "none" }}
        >
          {initials}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography noWrap sx={{ fontWeight: 700, color: BROWN }}>
              {p.first_name} {p.last_name}
            </Typography>
            {isMe && <Chip label="You" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: CREAM, color: BROWN }} />}
          </Box>
          <Typography noWrap variant="body2" sx={{ color: "text.secondary" }}>
            {p.email}
          </Typography>
        </Box>
      </Box>

      {/* Role */}
      <Box>
        {manage ? (
          <Select
            variant="standard"
            disableUnderline
            value={p.role}
            onChange={(e) => onRole(p, e.target.value as Role)}
            sx={{
              bgcolor: CREAM,
              color: BROWN,
              borderRadius: 999,
              pl: 1.75,
              fontSize: 13,
              fontWeight: 700,
              "& .MuiSelect-select": { py: 0.5, "&:focus": { bgcolor: "transparent" } },
            }}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: BROWN }}>{ROLE_LABELS[p.role]}</Typography>
        )}
      </Box>

      {/* Vendor */}
      <Typography noWrap sx={{ fontSize: 14, color: BROWN }}>
        {vendorName}
      </Typography>

      {/* Joined */}
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        {new Date(p.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: { xs: "flex-start", md: "flex-end" }, gap: 1 }}>
        {isBosch && p.status === "pending" && (
          <>
            <Button
              size="small"
              disableElevation
              variant="contained"
              onClick={() => onStatus(p, "verified")}
              sx={{ borderRadius: 999, px: 2, fontWeight: 700, bgcolor: GREEN, "&:hover": { bgcolor: "#256a4b" } }}
            >
              Verify
            </Button>
            <Button
              size="small"
              onClick={() => onStatus(p, "denied")}
              sx={{ borderRadius: 999, px: 1.5, fontWeight: 700, color: RED }}
            >
              Deny
            </Button>
          </>
        )}

        {isBosch && p.status === "denied" && (
          <Button
            size="small"
            onClick={() => onStatus(p, "verified")}
            sx={{ borderRadius: 999, px: 1.5, fontWeight: 700, color: GREEN }}
          >
            Reinstate
          </Button>
        )}

        {!isBosch && p.status === "pending" && (
          <Chip label="Awaiting BoschBite" size="small" sx={{ bgcolor: ACCENT, color: BROWN, fontWeight: 700 }} />
        )}

        {manage && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => onRemove(p)} sx={{ color: "text.secondary", "&:hover": { color: RED, bgcolor: "rgba(215, 44, 50, 0.08)" } }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};


/* 
   PAGE
 */

export const ProfileList = () => {
  const { data: me, isLoading: identityLoading } = useGetIdentity<Identity>();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [vendorNames, setVendorNames] = useState<Record<number, string>>({});
  const [vendorLogos, setVendorLogos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Status>("pending");
  const [search, setSearch] = useState("");

  //Used to pick the starting tab only once
  const startTabChosen = useRef(false);

  const isBosch = me?.role === "boschbite_admin";
  const isVendorAdmin = me?.role === "vendor_admin";
  const allowed = isBosch || isVendorAdmin;

  const fetchProfiles = useCallback(async () => {
    if (!me || !allowed) return;

    setLoading(true);

    let profilesQuery = supabaseClient
      .from("profiles")
      .select("id, first_name, last_name, email, role, vendor_id, status, created_at")
      .order("created_at", { ascending: true });

    //The database enforces this too, filtering here keeps the screen consistent
    if (isVendorAdmin) {
      profilesQuery = profilesQuery.eq("vendor_id", me.vendor_id);
    }

    const [profilesResult, vendorsResult, logosResult] = await Promise.all([
      profilesQuery,
      supabaseClient.from("Vendor").select("vendor_id, name"),
      supabaseClient.from("Vendor_logo").select("vendor_id, logo_url"),
    ]);

    if (profilesResult.error) {
      setErrorMessage(`Could not load profiles: ${profilesResult.error.message}`);
      setLoading(false);
      return;
    }

    const list = (profilesResult.data ?? []) as unknown as Profile[];

    setProfiles(list);
    setVendorNames(Object.fromEntries((vendorsResult.data ?? []).map((v: any) => [v.vendor_id, v.name])));
    setVendorLogos(Object.fromEntries((logosResult.data ?? []).map((l: any) => [l.vendor_id, String(l.logo_url).trim()])));

    //Opens on Pending, or on Verified when nobody is waiting
    if (!startTabChosen.current) {
      startTabChosen.current = true;
      if (!list.some((p) => p.status === "pending")) setTab("verified");
    }

    setLoading(false);
  }, [me, allowed, isVendorAdmin]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /* ACTIONS */

  const updateStatus = async (profile: Profile, status: "verified" | "denied") => {
    setErrorMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ status })
      .eq("id", profile.id)
      .select("id");

    //The database can block a change without an error, in that case no rows come back
    if (error || !data || data.length === 0) {
      setErrorMessage(error?.message ?? "You are not allowed to change this profile.");
      return;
    }

    await fetchProfiles();
  };

  const updateRole = async (profile: Profile, role: Role) => {
    if (role === profile.role) return;
    setErrorMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ role })
      .eq("id", profile.id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErrorMessage(error?.message ?? "You are not allowed to change this role.");
      return;
    }

    await fetchProfiles();
  };

  const confirmRemove = async () => {
    if (!toRemove) return;
    setErrorMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", toRemove.id)
      .select("id");

    setToRemove(null);

    if (error || !data || data.length === 0) {
      setErrorMessage(error?.message ?? "You are not allowed to remove this profile.");
      return;
    }

    await fetchProfiles();
  };

  /* WHAT IS SHOWN */

  const counts = useMemo(
    () => ({
      pending: profiles.filter((p) => p.status === "pending").length,
      verified: profiles.filter((p) => p.status === "verified").length,
      denied: profiles.filter((p) => p.status === "denied").length,
    }),
    [profiles],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return profiles.filter((p) => {
      if (p.status !== tab) return false;
      if (!term) return true;

      const vendor = p.vendor_id !== null ? (vendorNames[p.vendor_id] ?? "") : "";
      return `${p.first_name} ${p.last_name} ${p.email} ${vendor}`.toLowerCase().includes(term);
    });
  }, [profiles, tab, search, vendorNames]);

  //Checks after all hooks
  if (identityLoading || !me) return null;

  if (!allowed) return <Navigate to="/" replace />;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", py: 1 }}>
      {/* Title and search */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ fontSize: 30, fontWeight: 800, color: BROWN, lineHeight: 1.1 }}>People</Typography>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            {isBosch ? "Approve new sign-ups and manage who has access." : "Manage the people in your company."}
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 280 },
            "& .MuiOutlinedInput-root": {
              bgcolor: "#fff",
              borderRadius: 999,
              "& fieldset": { border: "none" },
              boxShadow: "0 1px 3px rgba(56, 35, 34, 0.08)",
            },
          }}
        />
      </Box>

      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={{ mb: 3, borderRadius: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ display: "inline-flex", gap: 0.5, p: 0.5, mb: 3, bgcolor: CREAM, borderRadius: 999 }}>
        {TABS.map((t) => {
          const selected = tab === t.key;

          return (
            <Button
              key={t.key}
              disableElevation
              onClick={() => setTab(t.key)}
              sx={{
                borderRadius: 999,
                px: 2.5,
                py: 0.75,
                fontWeight: 700,
                textTransform: "none",
                bgcolor: selected ? BROWN : "transparent",
                color: selected ? CREAM : BROWN,
                "&:hover": { bgcolor: selected ? BROWN : "rgba(56, 35, 34, 0.08)" },
              }}
            >
              {t.label}
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  minWidth: 22,
                  borderRadius: 999,
                  fontSize: 12,
                  lineHeight: "20px",
                  bgcolor: selected ? "rgba(241, 229, 213, 0.2)" : "rgba(56, 35, 34, 0.08)",
                }}
              >
                {counts[t.key]}
              </Box>
            </Button>
          );
        })}
      </Box>

      {/* Column labels (hidden on phones) */}
      <Box sx={{ display: { xs: "none", md: "grid" }, gridTemplateColumns: ROW_GRID, gap: 2, px: 2.5, pb: 1 }}>
        {["Person", "Role", "Vendor", "Joined", ""].map((label, i) => (
          <Typography key={i} sx={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "text.secondary" }}>
            {label}
          </Typography>
        ))}
      </Box>

      {/* The list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={76} sx={{ borderRadius: 3 }} />)
        ) : visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <PeopleOutlineIcon sx={{ fontSize: 44, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>{search ? "No one matches your search." : EMPTY_TEXT[tab]}</Typography>
          </Box>
        ) : (
          visible.map((p) => (
            <PersonRow
              key={p.id}
              p={p}
              me={me}
              isBosch={isBosch}
              vendorName={p.vendor_id !== null ? (vendorNames[p.vendor_id] ?? "—") : "—"}
              logo={p.vendor_id !== null ? vendorLogos[p.vendor_id] : undefined}
              onStatus={updateStatus}
              onRole={updateRole}
              onRemove={setToRemove}
            />
          ))
        )}
      </Box>

      {/* Remove confirmation */}
      <Dialog open={!!toRemove} onClose={() => setToRemove(null)} PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: BROWN }}>Remove this person?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toRemove?.first_name} {toRemove?.last_name} ({toRemove?.email}) will lose access to BoschBite Insights.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToRemove(null)} sx={{ borderRadius: 999, color: BROWN, fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            disableElevation
            variant="contained"
            onClick={confirmRemove}
            sx={{ borderRadius: 999, fontWeight: 700, bgcolor: RED, "&:hover": { bgcolor: "#b8242a" } }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};