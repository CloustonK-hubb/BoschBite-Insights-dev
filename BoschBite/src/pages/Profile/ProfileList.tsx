import { useEffect, useState } from "react";
import { List } from "@refinedev/mui";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { supabaseClient } from "./../../lib/supabaseClient";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  vendor_id: number | null;
  vendor_name: string | null;
  status: "pending" | "verified" | "denied";
  created_at: string;
};

export const ProfileList = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    setLoading(true);

    const { data, error } = await supabaseClient
      .from("profiles")
      .select(
        "id, first_name, last_name, email, role, vendor_id, vendor_name, status, created_at",
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching profiles:", error);
      setLoading(false);
      return;
    }

    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const updateStatus = async (
    profileId: string,
    status: "verified" | "denied",
  ) => {
    const { error } = await supabaseClient
      .from("profiles")
      .update({ status })
      .eq("id", profileId);

    if (error) {
      console.error("Error updating profile:", error);
      return;
    }

    await fetchProfiles();
  };

  const pendingProfiles = profiles.filter(
    (profile) => profile.status === "pending",
  );

  const verifiedProfiles = profiles.filter(
    (profile) => profile.status === "verified",
  );

  const deniedProfiles = profiles.filter(
    (profile) => profile.status === "denied",
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case "boschbite_admin":
        return "BoschBite Admin";
      case "vendor_admin":
        return "Vendor Admin";
      case "vendor_manager":
        return "Vendor Manager";
      default:
        return role;
    }
  };

  const ProfileTable = ({
    profiles,
    showActions = false,
  }: {
    profiles: Profile[];
    showActions?: boolean;
  }) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell>Created</TableCell>
            {showActions && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>

        <TableBody>
          {profiles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showActions ? 6 : 5}
                align="center"
              >
                No profiles in this section.
              </TableCell>
            </TableRow>
          ) : (
            profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  {profile.first_name} {profile.last_name}
                </TableCell>

                <TableCell>{profile.email}</TableCell>

                <TableCell>
                  {roleLabel(profile.role)}
                </TableCell>

                <TableCell>
                  {profile.vendor_name ?? "—"}
                </TableCell>

                <TableCell>
                  {new Date(
                    profile.created_at,
                  ).toLocaleDateString()}
                </TableCell>

                {showActions && (
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() =>
                          updateStatus(
                            profile.id,
                            "verified",
                          )
                        }
                      >
                        Verify
                      </Button>

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() =>
                          updateStatus(
                            profile.id,
                            "denied",
                          )
                        }
                      >
                        Deny
                      </Button>
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <List title="Profile Management">
      {/* PENDING */}

      <Box sx={{ mb: 5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h5">
            Pending
          </Typography>

          <Chip
            label={pendingProfiles.length}
            color="warning"
            size="small"
          />
        </Box>

        <ProfileTable
          profiles={pendingProfiles}
          showActions
        />
      </Box>

      {/* VERIFIED */}

      <Box sx={{ mb: 5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h5">
            Verified
          </Typography>

          <Chip
            label={verifiedProfiles.length}
            color="success"
            size="small"
          />
        </Box>

        <ProfileTable profiles={verifiedProfiles} />
      </Box>

      {/* DENIED */}

      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h5">
            Denied
          </Typography>

          <Chip
            label={deniedProfiles.length}
            color="error"
            size="small"
          />
        </Box>

        <ProfileTable profiles={deniedProfiles} />
      </Box>
    </List>
  );
};