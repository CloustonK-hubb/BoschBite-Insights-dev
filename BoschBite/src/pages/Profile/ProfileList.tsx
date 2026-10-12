import { useCallback, useEffect, useState } from "react";
import { useGetIdentity } from "@refinedev/core";
import { List } from "@refinedev/mui";
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

import { supabaseClient } from "./../../lib/supabaseClient";

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

/* =========================
   TABLE (defined outside the page
   component so it is not remounted
   on every render)
========================= */

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

/* =========================
   PAGE
========================= */

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

  /* ---------- guards (after all hooks) ---------- */

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