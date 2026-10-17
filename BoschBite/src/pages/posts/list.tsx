import { useMany } from "@refinedev/core";
import { EditButton, List, useDataGrid, DateField, DeleteButton } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ICategory, IPost } from "../../interfaces";
import { ShowButton } from "@refinedev/mui";
import { useCallback, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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
type Role = "boschbite_admin" | "vendor_admin" | "vendor_manager";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  vendor_id: number | null;
  Vendor: { name: string } | null;
  status: "pending" | "verified" | "denied";
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

const roleLabel = (role: string) => ROLE_LABELS[role as Role] ?? role;

/* 
   TABLE (defined outside the page
   component so it is not remounted
   on every render)
 */

type ProfileTableProps = {
  profiles: Profile[];
  me: Identity;
  isBosch: boolean;
  showVerifyDeny?: boolean;
  onStatus: (profile: Profile, status: "verified" | "denied") => void;
  onRole: (profile: Profile, role: Role) => void;
  onRemove: (profile: Profile) => void;
};

const ProfileTable = ({
  profiles,
  me,
  isBosch,
  showVerifyDeny = false,
  onStatus,
  onRole,
  onRemove,
}: ProfileTableProps) => {
  const roleOptions = isBosch ? ALL_ROLES : VENDOR_ROLES;

  // Can this viewer change the role of / remove this row?
  const canManage = (p: Profile) => {
    if (p.id === me.id) return false; // never yourself
    if (isBosch) return true;
    return VENDOR_ROLES.includes(p.role); // vendor admin: vendor roles only
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Vendor Name</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No profiles in this section.
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((p) => {
              const manage = canManage(p);

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.first_name} {p.last_name}
                  </TableCell>

                  <TableCell>{p.email}</TableCell>

                  <TableCell>
                    {manage ? (
                      <Select
                        size="small"
                        value={p.role}
                        onChange={(e) => onRole(p, e.target.value as Role)}
                        sx={{ minWidth: 160 }}
                      >
                        {roleOptions.map((r) => (
                          <MenuItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      roleLabel(p.role)
                    )}
                  </TableCell>

                  <TableCell>{p.Vendor?.name ?? "—"}</TableCell>

                  <TableCell>
                    {new Date(p.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {isBosch && showVerifyDeny && (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => onStatus(p, "verified")}
                          >
                            Verify
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => onStatus(p, "denied")}
                          >
                            Deny
                          </Button>
                        </>
                      )}

                      {isBosch && p.status === "denied" && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onStatus(p, "verified")}
                        >
                          Verify
                        </Button>
                      )}

                      {manage && (
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={() => onRemove(p)}
                        >
                          Remove
                        </Button>
                      )}

                      {!isBosch && showVerifyDeny && (
                        <Typography variant="body2" color="text.secondary">
                          Awaiting BoschBite approval
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* 
   PAGE
 */

export const ProfileList = () => {
  const { data: me, isLoading: identityLoading } = useGetIdentity<Identity>();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<Profile | null>(null);

  const isBosch = me?.role === "boschbite_admin";
  const isVendorAdmin = me?.role === "vendor_admin";
  const allowed = isBosch || isVendorAdmin;

  const fetchProfiles = useCallback(async () => {
    if (!me || !allowed) return;

    setLoading(true);

    let query = supabaseClient
      .from("profiles")
      .select(
        "id, first_name, last_name, email, role, vendor_id, status, created_at, Vendor(name)",
      )
      .order("created_at", { ascending: true });

    // RLS enforces this too; filtering here keeps the UI consistent.
    if (isVendorAdmin) {
      query = query.eq("vendor_id", me.vendor_id);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(`Could not load profiles: ${error.message}`);
      setLoading(false);
      return;
    }

    setProfiles((data ?? []) as unknown as Profile[]);
    setLoading(false);
  }, [me, allowed, isVendorAdmin]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  /* ---------- actions ---------- */

  const updateStatus = async (
    profile: Profile,
    status: "verified" | "denied",
  ) => {
    setErrorMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ status })
      .eq("id", profile.id)
      .select("id");

    // RLS can block a write without an error: zero rows come back.
    if (error || !data || data.length === 0) {
      setErrorMessage(
        error?.message ?? "You are not allowed to change this profile.",
      );
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
      setErrorMessage(
        error?.message ?? "You are not allowed to change this role.",
      );
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
      setErrorMessage(
        error?.message ?? "You are not allowed to remove this profile.",
      );
      return;
    }

    await fetchProfiles();
  };

  /*  guards (after all hooks)  */

  if (identityLoading || !me) return null;

  if (!allowed) return <Navigate to="/" replace />;

  const pending = profiles.filter((p) => p.status === "pending");
  const verified = profiles.filter((p) => p.status === "verified");
  const denied = profiles.filter((p) => p.status === "denied");

  const section = (
    title: string,
    list: Profile[],
    color: "warning" | "success" | "error",
    showVerifyDeny = false,
    isLast = false,
  ) => (
    <Box sx={{ mb: isLast ? 0 : 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Typography variant="h5">{title}</Typography>
        <Chip label={list.length} color={color} size="small" />
      </Box>

      <ProfileTable
        profiles={list}
        me={me}
        isBosch={isBosch}
        showVerifyDeny={showVerifyDeny}
        onStatus={updateStatus}
        onRole={updateRole}
        onRemove={setToRemove}
      />
    </Box>
  );

  return (
    <List title="Profile Management">
      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage(null)}
          sx={{ mb: 3 }}
        >
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading profiles…</Typography>
      ) : (
        <>
          {section("Pending", pending, "warning", true)}
          {section("Verified", verified, "success")}
          {section("Denied", denied, "error", false, true)}
        </>
      )}

      <Dialog open={!!toRemove} onClose={() => setToRemove(null)}>
        <DialogTitle>Remove profile?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toRemove?.first_name} {toRemove?.last_name} ({toRemove?.email})
            will lose access to BoschBite Insights.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToRemove(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmRemove}>
            Remove profile
          </Button>
        </DialogActions>
      </Dialog>
    </List>
  );
};