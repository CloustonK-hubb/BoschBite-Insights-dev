import { useCallback, useEffect, useRef, useState } from "react";
import { useGetIdentity, useInvalidateAuthStore } from "@refinedev/core";
import { List } from "@refinedev/mui";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { supabaseClient } from "../providers/supabaseClient";

type Role = "boschbite_admin" | "vendor_admin" | "vendor_manager";

type Identity = {
  id: string;
  role: Role | null;
  vendor_id: number | null;
};

type OwnProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  vendor_id: number | null;
  avatar_path: string | null;
};

type VendorDetails = {
  vendor_id: number;
  logo_path: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
};

type Message = { type: "success" | "error"; text: string };

const ROLE_LABELS: Record<Role, string> = {
  boschbite_admin: "BoschBite Admin",
  vendor_admin: "Vendor Admin",
  vendor_manager: "Vendor Manager",
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

const publicUrl = (bucket: string, path: string | null | undefined) =>
  path
    ? supabaseClient.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : undefined;

const checkJpeg = (file: File): string | null => {
  if (file.type !== "image/jpeg") {
    return "Please choose a JPEG image (.jpg or .jpeg).";
  }
  if (file.size > MAX_BYTES) {
    return "The image must be 2 MB or smaller.";
  }
  return null;
};

/* =========================
   IMAGE PICKER
   Shows the blank MUI avatar until something is uploaded.
========================= */

type ImagePickerProps = {
  src?: string;
  label: string;
  busy: boolean;
  variant?: "circular" | "rounded";
  onPick: (file: File) => void;
};

const ImagePicker = ({
  src,
  label,
  busy,
  variant = "circular",
  onPick,
}: ImagePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar src={src} variant={variant} sx={{ width: 96, height: 96 }} />

      <Box>
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : label}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5 }}
        >
          JPEG only, up to 2 MB
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow picking the same file again
            if (file) onPick(file);
          }}
        />
      </Box>
    </Stack>
  );
};

/* =========================
   PAGE
========================= */

export const MyProfile = () => {
  const { data: me } = useGetIdentity<Identity>();
  const invalidateAuthStore = useInvalidateAuthStore();
  const myId = me?.id;

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [details, setDetails] = useState<VendorDetails | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<
    "avatar" | "logo" | "personal" | "vendor" | null
  >(null);
  const [message, setMessage] = useState<Message | null>(null);

  const load = useCallback(async () => {
    if (!myId) return;

    setLoading(true);

    const { data: p, error } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name, email, role, vendor_id, avatar_path")
      .eq("id", myId)
      .single();

    if (error || !p) {
      setMessage({
        type: "error",
        text: `Could not load your profile: ${error?.message ?? "not found"}`,
      });
      setLoading(false);
      return;
    }

    setProfile(p as OwnProfile);
    setFirstName(p.first_name ?? "");
    setLastName(p.last_name ?? "");

    if (p.vendor_id !== null) {
      const [vendorResult, detailsResult] = await Promise.all([
        supabaseClient
          .from("Vendor")
          .select("name")
          .eq("vendor_id", p.vendor_id)
          .maybeSingle(),
        supabaseClient
          .from("vendor_details")
          .select("vendor_id, logo_path, contact_email, contact_phone, description")
          .eq("vendor_id", p.vendor_id)
          .maybeSingle(),
      ]);

      const d = detailsResult.data as VendorDetails | null;

      setVendorName(vendorResult.data?.name ?? null);
      setDetails(d);
      setContactEmail(d?.contact_email ?? "");
      setContactPhone(d?.contact_phone ?? "");
      setDescription(d?.description ?? "");
    }

    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---------- helpers ---------- */

  // Uploads the new file, saves its path, then deletes the old file.
  // `save` returns an error message, or null when the database update worked.
  const uploadReplacing = async (
    bucket: string,
    folder: string,
    oldPath: string | null,
    file: File,
    save: (newPath: string) => Promise<string | null>,
  ): Promise<string | null> => {
    const newPath = `${folder}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(newPath, file, { contentType: "image/jpeg" });

    if (uploadError) return `Upload failed: ${uploadError.message}`;

    const saveError = await save(newPath);

    if (saveError) {
      await supabaseClient.storage.from(bucket).remove([newPath]);
      return saveError;
    }

    if (oldPath) {
      await supabaseClient.storage.from(bucket).remove([oldPath]);
    }

    return null;
  };

  /* ---------- actions ---------- */

  const uploadAvatar = async (file: File) => {
    if (!profile) return;

    const problem = checkJpeg(file);
    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }

    setBusy("avatar");
    setMessage(null);

    const errorText = await uploadReplacing(
      "avatars",
      profile.id,
      profile.avatar_path,
      file,
      async (newPath) => {
        const { data, error } = await supabaseClient
          .from("profiles")
          .update({ avatar_path: newPath })
          .eq("id", profile.id)
          .select("id");

        if (error || !data || data.length === 0) {
          return error?.message ?? "Could not save your photo.";
        }
        return null;
      },
    );

    setBusy(null);

    if (errorText) {
      setMessage({ type: "error", text: errorText });
      return;
    }

    setMessage({ type: "success", text: "Your photo was updated." });
    await load();
    invalidateAuthStore(); // refreshes the header avatar
  };

  const savePersonal = async () => {
    if (!profile) return;

    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setMessage({ type: "error", text: "First and last name are required." });
      return;
    }

    setBusy("personal");
    setMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({ first_name: first, last_name: last })
      .eq("id", profile.id)
      .select("id");

    setBusy(null);

    if (error || !data || data.length === 0) {
      setMessage({
        type: "error",
        text: error?.message ?? "Could not save your details.",
      });
      return;
    }

    setMessage({ type: "success", text: "Your details were saved." });
    await load();
    invalidateAuthStore(); // refreshes the header name
  };

  const uploadLogo = async (file: File) => {
    if (!profile || profile.vendor_id === null) return;

    const problem = checkJpeg(file);
    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }

    setBusy("logo");
    setMessage(null);

    const vendorId = profile.vendor_id;

    const errorText = await uploadReplacing(
      "vendor-logos",
      String(vendorId),
      details?.logo_path ?? null,
      file,
      async (newPath) => {
        const { error } = await supabaseClient
          .from("vendor_details")
          .upsert(
            {
              vendor_id: vendorId,
              logo_path: newPath,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "vendor_id" },
          );

        return error ? error.message : null;
      },
    );

    setBusy(null);

    if (errorText) {
      setMessage({ type: "error", text: errorText });
      return;
    }

    setMessage({ type: "success", text: "The company logo was updated." });
    await load();
  };

  const saveVendor = async () => {
    if (!profile || profile.vendor_id === null) return;

    const email = contactEmail.trim();

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      setMessage({
        type: "error",
        text: "Please enter a valid contact email address.",
      });
      return;
    }

    setBusy("vendor");
    setMessage(null);

    const { error } = await supabaseClient.from("vendor_details").upsert(
      {
        vendor_id: profile.vendor_id,
        contact_email: email || null,
        contact_phone: contactPhone.trim() || null,
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vendor_id" },
    );

    setBusy(null);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({ type: "success", text: "Vendor details were saved." });
    await load();
  };

  /* ---------- render ---------- */

  if (!me || loading) {
    return (
      <List title="My Profile">
        <Typography>Loading your profile…</Typography>
      </List>
    );
  }

  if (!profile) {
    return (
      <List title="My Profile">
        {message && <Alert severity={message.type}>{message.text}</Alert>}
      </List>
    );
  }

  const canManageVendor =
    profile.role === "vendor_admin" && profile.vendor_id !== null;

  return (
    <List title="My Profile">
      <Stack spacing={4} sx={{ maxWidth: 720 }}>
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* PERSONAL */}

        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Typography variant="h5">Personal information</Typography>
                <Chip label={ROLE_LABELS[profile.role]} size="small" />
              </Box>

              <ImagePicker
                src={publicUrl("avatars", profile.avatar_path)}
                label="Upload photo"
                busy={busy === "avatar"}
                onPick={uploadAvatar}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  required
                />
              </Stack>

              <TextField
                label="Email"
                value={profile.email}
                disabled
                helperText="Your email can't be changed here."
                fullWidth
              />

              <Box>
                <Button
                  variant="contained"
                  onClick={savePersonal}
                  disabled={busy === "personal"}
                >
                  {busy === "personal" ? "Saving…" : "Save changes"}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* VENDOR */}

        {profile.vendor_id !== null && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h5">
                  {vendorName ?? "Your vendor"}
                </Typography>

                {canManageVendor ? (
                  <ImagePicker
                    src={publicUrl("vendor-logos", details?.logo_path)}
                    label="Upload company logo"
                    variant="rounded"
                    busy={busy === "logo"}
                    onPick={uploadLogo}
                  />
                ) : (
                  <Avatar
                    src={publicUrl("vendor-logos", details?.logo_path)}
                    variant="rounded"
                    sx={{ width: 96, height: 96 }}
                  />
                )}

                <TextField
                  label="Contact email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  disabled={!canManageVendor}
                  fullWidth
                />

                <TextField
                  label="Contact phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  disabled={!canManageVendor}
                  fullWidth
                />

                <TextField
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canManageVendor}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${description.length}/500`}
                  multiline
                  minRows={3}
                  fullWidth
                />

                {canManageVendor ? (
                  <Box>
                    <Button
                      variant="contained"
                      onClick={saveVendor}
                      disabled={busy === "vendor"}
                    >
                      {busy === "vendor" ? "Saving…" : "Save vendor details"}
                    </Button>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Only a Vendor Admin can edit these details.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </List>
  );
};