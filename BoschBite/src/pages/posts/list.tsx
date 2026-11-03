import { EditButton, List, useDataGrid, DateField, DeleteButton, ExportButton } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { ShowButton } from "@refinedev/mui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGetIdentity, useExport } from "@refinedev/core";
import { Navigate } from "react-router";
import { Alert, Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, InputAdornment, MenuItem, Select, Skeleton, TextField, Tooltip, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { supabaseClient } from "../../providers/supabaseClient";
import { listStyles, peopleStyles } from "../../providers/theme";


//Page layout around each table: big title, short description, buttons on the right
type ThemedListProps = {
  title: string;
  subtitle: string;
  exportButton?: React.ReactNode;
  children: React.ReactNode;
};

const ThemedList = ({ title, subtitle, exportButton, children }: ThemedListProps) => (
  <List
    breadcrumb={false}
    title={
      <Box>
        <Typography sx={listStyles.title}>{title}</Typography>
        <Typography sx={listStyles.subtitle}>{subtitle}</Typography>
      </Box>
    }
    headerButtons={({ defaultButtons }) => (
      <Box sx={listStyles.headerButtons}>
        {defaultButtons}
        {exportButton}
      </Box>
    )}
    wrapperProps={{ sx: listStyles.wrapper }}
    headerProps={{ disableTypography: true, sx: listStyles.header }}
    contentProps={{ sx: listStyles.content }}
  >
    {children}
  </List>
);


//List object for a transaction

//Splits the transaction date and time into two parts
const txDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";

const txTime = (value?: string) =>
  value ? new Date(value).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "";

//Shows money as R 12.50
const rands = (value?: number | string | null) =>
  value === null || value === undefined || value === "" ? "" : `R ${Number(value).toFixed(2)}`;

//Shows a discount as a percentage. 0.15 and 15 both show as 15%
const percent = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return `${Number((n <= 1 ? n * 100 : n).toFixed(1))}%`;
};

export const TransactionList: React.FC = () => {
  //student_directory(student_no) brings in each student's number from the safe view
  const { dataGridProps } = useDataGrid({ resource: "transaction", meta: { select: "*, vendor(name), student_directory(student_no)" }, 
    queryOptions: { refetchOnMount: "always",}, });

  //enabling an export feature for the trasnaction table which exports all data for this table, not just what is shown in the list
  const { triggerExport, isLoading: exportLoading } = useExport({
    resource: "transaction",
    meta: { select: "*, vendor(name), student_directory(student_no)" },
    pageSize: 1000, 
    mapData: (item) => ({
      ID: item.id,
      Student: item.student_directory?.student_no ?? "",
      "Vendor name": item.vendor?.name ?? item.vendor_id,
      Date: txDate(item.tx_datetime),
      Time: txTime(item.tx_datetime),
      "Transaction value": item.value,
      Discount: item.discount,
    }),
    maxItemCount: 10000,
  });


  const columns = React.useMemo<GridColDef[]>(
    () => [
      //{ field: "id", headerName: "Transaction ID", flex: 1, minWidth: 130 },
      { field: "student_no", headerName: "Student", flex: 0.6, minWidth: 90, sortable: false, renderCell: ({ row }) => row.student_directory?.student_no ?? "—", },
      { field: "vendor_id", headerName: "Vendor name", flex: 1.4, minWidth: 160, renderCell: ({ row }) => row.vendor?.name ?? row.vendor_id, },
      { field: "tx_datetime", headerName: "Date", flex: 0.9, minWidth: 120, renderCell: ({ row }) => txDate(row.tx_datetime) },
      { field: "tx_time", headerName: "Time", flex: 0.6, minWidth: 80, sortable: false, renderCell: ({ row }) => txTime(row.tx_datetime) },
      {field: "value",headerName: "Transaction value", type: "number", flex: 0.9, minWidth: 130, align: "left", headerAlign: "left",
        renderCell: ({ row }) => rands(row.value),},
      { field: "discount", headerName: "Discount", type: "number", flex: 0.7, minWidth: 100, align: "left", headerAlign: "left", renderCell: ({ row }) => percent(row.discount) },
      { field: "actions", headerName: "", sortable: false, width: 64, renderCell: ({ row }) => <ShowButton hideText recordItemId={row.id} />}
    ],
    []
  );

  return (
    <ThemedList title="Transactions" subtitle="Purchases made with BoschCard." exportButton={<ExportButton onClick={triggerExport} loading={exportLoading} />}>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
      />
    </ThemedList>
  );
};

//List object for Students
export const StudentList: React.FC = () => {
  //Reads the safe view: names, emails and cell numbers are hidden for everyone
  const { dataGridProps } = useDataGrid({
    resource: "student_directory",
    sorters: { initial: [{ field: "student_no", order: "asc" }] },
  });

//enabling an export feature for the student table which exports all data for this table, not just what is shown in the list
const { triggerExport, isLoading: exportLoading } = useExport({
  resource: "student_directory",
  sorters: [{ field: "student_no", order: "asc" }],
  pageSize: 1000, 
  mapData: (item) => ({
    Student: item.student_no,
    "Date of birth": item.dob,
    Gender: item.gender,
    Address: item.address,
  }),
    maxItemCount: 10000,
  });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      //{ field: "id", headerName: "ID", width: 80 },
      { field: "student_no", headerName: "Student", type: "number", flex: 0.5, minWidth: 90, align: "left", headerAlign: "left" },
      { field: "dob", headerName: "Date of Birth", flex: 0.8, minWidth: 130, renderCell: ({ row }) => row.dob ?? "" },
      { field: "gender", headerName: "Gender", flex: 0.6, minWidth: 100},
      { field: "address", headerName: "Address", flex: 2, minWidth: 200},
      { field: "actions", headerName: "", sortable: false, width: 64, renderCell: ({ row }) => ( <>
        <ShowButton hideText recordItemId={row.id} />
      </>
      )
      },
    ],
    []
  );

  return (
    <ThemedList title="Students" subtitle="Students who use BoschCard." exportButton={<ExportButton onClick={triggerExport} loading={exportLoading} />}>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.id} autoHeight />
    </ThemedList>
  );
};

//List object for the Calendar
export const CalendarList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "calendar_event" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "period_id", headerName: "ID", flex: 0.4, minWidth: 70 },
      { field: "function", headerName: "Calendar function", flex: 1.2, minWidth: 150 },
      { field: "year", headerName: "Year", flex: 0.5, minWidth: 80 },
      { field: "start_date", headerName: "Start date", flex: 0.8, minWidth: 110 },
      { field: "end_date", headerName: "End date", flex: 0.8, minWidth: 110 },
      { field: "period_type", headerName: "Period category", flex: 1, minWidth: 140 },
      { field: "actions", headerName: "", sortable: false, width: 132, renderCell: ({ row }) => ( <Box sx={listStyles.actionIcons}>
        <ShowButton hideText recordItemId={row.period_id} />
        <EditButton hideText recordItemId= {row.period_id}/>
       <DeleteButton hideText recordItemId= {row.period_id} meta ={{ idColumnName: "period_id"}}/>
      </Box>
      )},
    ],
    []
  );

  return (
    <ThemedList title="Calendar" subtitle="Key dates in the academic year.">
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.period_id} autoHeight />
    </ThemedList>
  );
};

//List objetc for the Promo_window table
export const PromoWindowList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "promo_window_v2", meta: { select: "*, vendor(name)" }, });

//enabling an export feature for the student table which exports all data for this table, not just what is shown in the list
const { triggerExport, isLoading: exportLoading } = useExport({
  resource: "promo_window_v2",
  meta: { select: "*, vendor(name)" },
  mapData: (item) => ({
    "Promotion ID": item.promo_id,
    "Vendor name": item.vendor?.name ?? item.vendor_id,
    "Promo number": item.promo_number,
    "Promo type": item.promo_type,
    "Discount of promo": item.discount,
    "Weekday of promo": item.promo_weekday,
    "Start date": item.start_date,
    "End date": item.end_date,
    "Duration (days)": item.duration_days,
    "# Occurrence of promo": item.occurence_count,
    "# Qualifying days": item.qualifying_days,
    "# Discounted transactions": item.discounted_transactions,
    "Total promotion value": item.total_sales_value,
  }),
    maxItemCount: 5000,
  });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      //{ field: "promo_id", headerName: "Promotion ID", width: 90 },
      { field: "vendor_id", headerName: "Vendor name", flex: 1.3, minWidth: 160, renderCell: ({ row }) => row.vendor?.name ?? "-", },
      { field: "promo_name", headerName: "Promotion name", flex: 0.9, minWidth: 130 },
      { field: "promo_number", headerName: "Promotion number", flex: 0.9, minWidth: 130 },
      { field: "promo_type", headerName: "Promotion type", flex: 1, minWidth: 130 },
      { field: "start_date", headerName: "Start date", flex: 0.8, minWidth: 110 },
      { field: "end_date", headerName: "End date", flex: 0.8, minWidth: 110 },
      { field: "duration_days", headerName: "Duration (days)", flex: 0.8, minWidth: 120 },
      { field: "actions", headerName: "", sortable: false, width: 132, renderCell: ({ row }) => ( <Box sx={listStyles.actionIcons}>
        <ShowButton hideText recordItemId={row.promo_id} />
        {/*<DeleteButton hideText recordItemId= {row.promo_id} meta ={{ idColumnName: "promo_id"}}/>*/}
      </Box>
      )},
    ],
    []
  );

  return (
    <ThemedList title="Promotion Windows" subtitle="Promotions run by BoschBite vendors." exportButton={<ExportButton onClick={triggerExport} loading={exportLoading} />}>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.promo_id} autoHeight />
    </ThemedList>
  );
};


// List object for Profiles

type Role = "boschbite_admin" | "vendor_admin" | "vendor_manager";
type Status = "pending" | "verified" | "denied";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  vendor_id: string | null;
  status: Status;
  created_at: string;
};

//Vendor ids are uuids (strings) in the data model
type Identity = {
  id: string;
  role: Role | null;
  vendor_id: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  boschbite_admin: "BoschBite Admin",
  vendor_admin: "Vendor Admin",
  vendor_manager: "Vendor Manager",
};

const VENDOR_ROLES: Role[] = ["vendor_admin", "vendor_manager"];

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

  //Only vendor roles can be picked. BoschBite Admin is never offered in the dropdown
  const roleOptions = VENDOR_ROLES;

  //Nobody can change their own role or remove themselves
  const manage = !isMe && (isBosch || VENDOR_ROLES.includes(p.role));

  //A BoschBite Admin's role is shown as text, because it can't be picked in the dropdown
  const canChangeRole = manage && VENDOR_ROLES.includes(p.role);

  const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <Box sx={peopleStyles.row}>
      {/* Picture, name and email */}
      <Box sx={peopleStyles.person}>
        <Avatar src={logo} imgProps={{ style: peopleStyles.avatarImage }} sx={peopleStyles.avatar(!!logo)}>
          {initials}
        </Avatar>

        <Box sx={peopleStyles.nameText}>
          <Box sx={peopleStyles.nameLine}>
            <Typography noWrap sx={peopleStyles.name}>
              {p.first_name} {p.last_name}
            </Typography>
            {isMe && <Chip label="You" size="small" sx={peopleStyles.youChip} />}
          </Box>
          <Typography noWrap variant="body2" sx={peopleStyles.email}>
            {p.email}
          </Typography>
        </Box>
      </Box>

      {/* Role */}
      <Box>
        {canChangeRole ? (
          <Select
            variant="standard"
            disableUnderline
            value={p.role}
            onChange={(e) => onRole(p, e.target.value as Role)}
            sx={peopleStyles.roleSelect}
          >
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </Select>
        ) : (
          <Typography sx={peopleStyles.roleText}>{ROLE_LABELS[p.role]}</Typography>
        )}
      </Box>

      {/* Vendor */}
      <Typography noWrap sx={peopleStyles.vendor}>
        {vendorName}
      </Typography>

      {/* Joined */}
      <Typography sx={peopleStyles.joined}>
        {new Date(p.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
      </Typography>

      {/* Actions */}
      <Box sx={peopleStyles.actions}>
        {isBosch && p.status === "pending" && (
          <>
            <Button
              size="small"
              disableElevation
              variant="contained"
              onClick={() => onStatus(p, "verified")}
              sx={peopleStyles.verifyButton}
            >
              Verify
            </Button>
            <Button
              size="small"
              onClick={() => onStatus(p, "denied")}
              sx={peopleStyles.denyButton}
            >
              Deny
            </Button>
          </>
        )}

        {isBosch && p.status === "denied" && (
          <Button
            size="small"
            onClick={() => onStatus(p, "verified")}
            sx={peopleStyles.reinstateButton}
          >
            Reinstate
          </Button>
        )}

        {!isBosch && p.status === "pending" && (
          <Chip label="Awaiting BoschBite" size="small" sx={peopleStyles.awaitingChip} />
        )}

        {manage && (
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => onRemove(p)} sx={peopleStyles.removeIcon}>
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
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [vendorLogos, setVendorLogos] = useState<Record<string, string>>({});
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
      supabaseClient.from("vendor").select("id, name"),
      supabaseClient.from("Vendor_logo").select("vendor_id, logo_url"),
    ]);

    if (profilesResult.error) {
      setErrorMessage(`Could not load profiles: ${profilesResult.error.message}`);
      setLoading(false);
      return;
    }

    const list = (profilesResult.data ?? []) as unknown as Profile[];

    setProfiles(list);
    setVendorNames(Object.fromEntries((vendorsResult.data ?? []).map((v: any) => [v.id, v.name])));
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
    <Box sx={peopleStyles.page}>
      {/* Title and search */}
      <Box sx={peopleStyles.header}>
        <Box>
          <Typography sx={peopleStyles.title}>Accounts</Typography>
          <Typography sx={peopleStyles.subtitle}>
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
          sx={peopleStyles.search}
        />
      </Box>

      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage(null)} sx={peopleStyles.error}>
          {errorMessage}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={peopleStyles.tabs}>
        {TABS.map((t) => {
          const selected = tab === t.key;

          return (
            <Button
              key={t.key}
              disableElevation
              onClick={() => setTab(t.key)}
              sx={peopleStyles.tab(selected)}
            >
              {t.label}
              <Box component="span" sx={peopleStyles.tabCount(selected)}>
                {counts[t.key]}
              </Box>
            </Button>
          );
        })}
      </Box>

      {/* Column labels (hidden on phones) */}
      <Box sx={peopleStyles.columnLabels}>
        {["Person", "Role", "Vendor", "Joined", ""].map((label, i) => (
          <Typography key={i} sx={peopleStyles.columnLabel}>
            {label}
          </Typography>
        ))}
      </Box>

      {/* The list */}
      <Box sx={peopleStyles.list}>
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={76} sx={peopleStyles.skeleton} />)
        ) : visible.length === 0 ? (
          <Box sx={peopleStyles.empty}>
            <PeopleOutlineIcon sx={peopleStyles.emptyIcon} />
            <Typography sx={peopleStyles.emptyText}>{search ? "No one matches your search." : EMPTY_TEXT[tab]}</Typography>
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
      <Dialog open={!!toRemove} onClose={() => setToRemove(null)} PaperProps={{ sx: peopleStyles.dialog }}>
        <DialogTitle sx={peopleStyles.dialogTitle}>Remove this person?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toRemove?.first_name} {toRemove?.last_name} ({toRemove?.email}) will lose access to BoschBite Insights.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={peopleStyles.dialogActions}>
          <Button onClick={() => setToRemove(null)} sx={peopleStyles.cancelButton}>
            Cancel
          </Button>
          <Button
            disableElevation
            variant="contained"
            onClick={confirmRemove}
            sx={peopleStyles.removeButton}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};