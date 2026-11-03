import { useCallback, useEffect, useRef, useState } from "react";
import { useGetIdentity, useInvalidateAuthStore } from "@refinedev/core";
import { Alert, Avatar, Box, Button, Chip, Paper, Skeleton, TextField, Typography } from "@mui/material";
import { supabaseClient } from "../providers/supabaseClient";

const BROWN = "#382322";
const CREAM = "#f1e5d5";
const ACCENT = "#F8E8A8";

// Storage bucket that holds the uploaded logos
const BUCKET = "vendor-logos";

// Largest file allowed (2 MB)
const MAX_BYTES = 2 * 1024 * 1024;

// Field styling
const fieldSx = (radius: number) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: radius,
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "rgba(56, 35, 34, 0.12)" },
    "&:hover fieldset": { borderColor: "#e6d5bd" },
    "&.Mui-focused fieldset": { borderColor: BROWN, borderWidth: 1.5 },
    "&.Mui-disabled": { backgroundColor: "#faf6ef" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: BROWN },
});

const cardSx = {
  bgcolor: "#fff",
  borderRadius: 3,
  boxShadow:
    "0 1px 3px rgba(56, 35, 34, 0.06), 0 6px 18px rgba(56, 35, 34, 0.04)",
};

// Main action button
const primaryButtonSx = {
  borderRadius: 999,
  px: 3,
  py: 1.1,
  fontWeight: 700,
  letterSpacing: 0.5,
  backgroundColor: BROWN,
  color: CREAM,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: "#4d3130",
    boxShadow: "0 6px 16px rgba(56, 35, 34, 0.25)",
  },
  "&.Mui-disabled": {
    backgroundColor: BROWN,
    color: CREAM,
    opacity: 0.5,
  },
};

type Role = "boschbite_admin" | "vendor_admin" | "vendor_manager";

type Identity = {
  id: string;
  role: Role | null;
  vendor_id: string | null;
};

type OwnProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  vendor_id: string | null;
};

type VendorDetails = {
  vendor_id: string;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const ROLE_LABELS: Record<Role, string> = {
  boschbite_admin: "BoschBite Admin",
  vendor_admin: "Vendor Admin",
  vendor_manager: "Vendor Manager",
};

// Only PNG files up to 2 MB are accepted
const checkPng = (file: File): string | null => {
  if (file.type !== "image/png") {
    return "Please choose a PNG image (.png).";
  }

  if (file.size > MAX_BYTES) {
    return "The image must be 2 MB or smaller.";
  }

  return null;
};

// Gets the file path inside our bucket from a saved logo link
const pathFromUrl = (url: string | null): string | null => {
  if (!url) return null;

  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);

  return i === -1 ? null : url.slice(i + marker.length).split("?")[0];
};

/*
LOGO PICKER
*/

type LogoPickerProps = {
  src?: string;
  busy: boolean;
  onPick: (file: File) => void;
};

const LogoPicker = ({ src, busy, onPick }: LogoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
      <Avatar
        src={src}
        variant="rounded"
        imgProps={{
          style: { objectFit: "contain", background: "#fff" },
        }}
        sx={{
          width: 96,
          height: 96,
          bgcolor: "#faf6ef",
          border: "1px solid rgba(56, 35, 34, 0.12)",
          borderRadius: 3,
        }}
      />

      <Box>
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          sx={{
            borderRadius: 999,
            px: 2.5,
            fontWeight: 700,
            textTransform: "none",
            color: BROWN,
            borderColor: BROWN,
            "&:hover": {
              borderColor: BROWN,
              bgcolor: "rgba(56, 35, 34, 0.06)",
            },
          }}
        >
          {busy ? "Uploading…" : "Upload company logo"}
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.75 }}
        >
          PNG only, up to 2 MB
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];

            // Allows the same file to be selected again
            e.target.value = "";

            if (file) onPick(file);
          }}
        />
      </Box>
    </Box>
  );
};

/*
MY PROFILE PAGE
*/

export const MyProfile = () => {
  const { data: me } = useGetIdentity<Identity>();
  const invalidateAuthStore = useInvalidateAuthStore();

  const myId = me?.id;

  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Editable authentication email
  const [email, setEmail] = useState("");

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState<
    "logo" | "personal" | "vendor" | "email" | null
  >(null);

  const [message, setMessage] = useState<Message | null>(null);

  /*
  LOAD PROFILE
  */

  const load = useCallback(async () => {
    if (!myId) return;

    setLoading(true);

    const { data: p, error } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name, email, role, vendor_id")
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
    setEmail(p.email ?? "");

    if (p.vendor_id !== null) {
      const [vendorResult, detailsResult, logoResult] = await Promise.all([
        supabaseClient
          .from("vendor")
          .select("name")
          .eq("id", p.vendor_id)
          .maybeSingle(),

        supabaseClient
          .from("vendor_details")
          .select("vendor_id, contact_email, contact_phone, description")
          .eq("vendor_id", p.vendor_id)
          .maybeSingle(),

        supabaseClient
          .from("Vendor_logo")
          .select("logo_url")
          .eq("vendor_id", p.vendor_id)
          .maybeSingle(),
      ]);

      const d = detailsResult.data as VendorDetails | null;

      setVendorName(vendorResult.data?.name ?? null);
      setLogoUrl(logoResult.data?.logo_url?.trim() ?? null);
      setContactEmail(d?.contact_email ?? "");
      setContactPhone(d?.contact_phone ?? "");
      setDescription(d?.description ?? "");
    } else {
      setVendorName(null);
      setLogoUrl(null);
      setContactEmail("");
      setContactPhone("");
      setDescription("");
    }

    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  /*
  ACTIONS
  */

  // Uploads the new logo, saves its link, then deletes the old file
  const uploadLogo = async (file: File) => {
    if (!profile || profile.vendor_id === null) return;

    const problem = checkPng(file);

    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }

    setBusy("logo");
    setMessage(null);

    const vendorId = profile.vendor_id;
    const newPath = `${vendorId}/${Date.now()}.png`;
    const oldPath = pathFromUrl(logoUrl);

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(newPath, file, { contentType: "image/png" });

    if (uploadError) {
      setBusy(null);
      setMessage({
        type: "error",
        text: `Upload failed: ${uploadError.message}`,
      });
      return;
    }

    const newUrl = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(newPath).data.publicUrl;

    // Creates the vendor's row if it does not exist, otherwise updates it
    const { error: saveError } = await supabaseClient
      .from("Vendor_logo")
      .upsert(
        { vendor_id: vendorId, logo_url: newUrl },
        { onConflict: "vendor_id" },
      );

    if (saveError) {
      await supabaseClient.storage.from(BUCKET).remove([newPath]);

      setBusy(null);
      setMessage({ type: "error", text: saveError.message });
      return;
    }

    // Only removes files uploaded by this page
    if (oldPath && oldPath.startsWith(`${vendorId}/`)) {
      await supabaseClient.storage.from(BUCKET).remove([oldPath]);
    }

    setBusy(null);

    setMessage({
      type: "success",
      text: "The company logo was updated.",
    });

    await load();
    invalidateAuthStore();
  };

  // Save first and last name
  const savePersonal = async () => {
    if (!profile) return;

    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setMessage({
        type: "error",
        text: "First and last name are required.",
      });
      return;
    }

    setBusy("personal");
    setMessage(null);

    const { data, error } = await supabaseClient
      .from("profiles")
      .update({
        first_name: first,
        last_name: last,
      })
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

    setMessage({
      type: "success",
      text: "Your details were saved.",
    });

    await load();
    invalidateAuthStore();
  };

  /*
  CHANGE AUTHENTICATION EMAIL
  */

  const saveEmail = async () => {
    if (!profile) return;

    const newEmail = email.trim().toLowerCase();
    const currentEmail = profile.email?.trim().toLowerCase() ?? "";

    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      return;
    }

    if (newEmail === currentEmail) {
      setMessage({
        type: "error",
        text: "This is already your current email address.",
      });
      return;
    }

    setBusy("email");
    setMessage(null);

    const { error } = await supabaseClient.auth.updateUser(
      { email: newEmail },
      {
        emailRedirectTo: `${window.location.origin}/`,
      }
    );

    setBusy(null);

    if (error) {
      setMessage({
        type: "error",
        text: error.message,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Confirmation email sent. Please check your inbox.",
    });
  };

  // Save vendor information
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

    const { error } = await supabaseClient
      .from("vendor_details")
      .upsert(
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
      setMessage({
        type: "error",
        text: error.message,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Vendor details were saved.",
    });

    await load();
  };

  /*
  PAGE LAYOUT
  */

  const pageHeader = (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontSize: 30,
          fontWeight: 800,
          color: BROWN,
          lineHeight: 1.1,
        }}
      >
        My profile
      </Typography>

      <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
        Update your details and your company's information.
      </Typography>
    </Box>
  );

  if (!me || loading) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", py: 1 }}>
        {pageHeader}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton
            variant="rounded"
            height={320}
            sx={{ borderRadius: 3 }}
          />

          <Skeleton
            variant="rounded"
            height={380}
            sx={{ borderRadius: 3 }}
          />
        </Box>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto", py: 1 }}>
        {pageHeader}

        {message && (
          <Alert severity={message.type} sx={{ borderRadius: 3 }}>
            {message.text}
          </Alert>
        )}
      </Box>
    );
  }

  const canManageVendor =
    profile.role === "vendor_admin" && profile.vendor_id !== null;

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", py: 1 }}>
      {pageHeader}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ borderRadius: 3 }}
          >
            {message.text}
          </Alert>
        )}

        {/* PERSONAL INFORMATION */}

        <Paper
          elevation={0}
          sx={{ ...cardSx, p: { xs: 3, sm: 4 } }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Picture, name and role */}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar
                src={logoUrl ?? undefined}
                imgProps={{
                  style: { objectFit: "contain", background: "#fff" },
                }}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: ACCENT,
                  color: BROWN,
                  fontWeight: 700,
                  fontSize: 26,
                  border: logoUrl ? "1px solid #eee" : "none",
                }}
              >
                {initials}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: BROWN,
                  }}
                >
                  {firstName} {lastName}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    label={ROLE_LABELS[profile.role]}
                    size="small"
                    sx={{
                      bgcolor: CREAM,
                      color: BROWN,
                      fontWeight: 700,
                    }}
                  />

                  {vendorName && (
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      {vendorName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Typography
              sx={{ fontSize: 18, fontWeight: 800, color: BROWN }}
            >
              Personal information
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                fullWidth
                required
                sx={fieldSx(999)}
              />

              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                fullWidth
                required
                sx={fieldSx(999)}
              />
            </Box>

            {/* EDITABLE AUTHENTICATION EMAIL */}

            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              helperText="Changing your email address requires confirmation."
              sx={fieldSx(999)}
            />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                onClick={savePersonal}
                disabled={busy !== null}
                sx={primaryButtonSx}
              >
                {busy === "personal" ? "Saving…" : "Save changes"}
              </Button>

              <Button
                variant="contained"
                onClick={saveEmail}
                disabled={busy !== null}
                sx={primaryButtonSx}
              >
                {busy === "email" ? "Updating email…" : "Update email"}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* VENDOR INFORMATION */}

        {profile.vendor_id !== null && (
          <Paper
            elevation={0}
            sx={{ ...cardSx, p: { xs: 3, sm: 4 } }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: BROWN }}
              >
                {vendorName ?? "Your vendor"}
              </Typography>

              {canManageVendor ? (
                <LogoPicker
                  src={logoUrl ?? undefined}
                  busy={busy === "logo"}
                  onPick={uploadLogo}
                />
              ) : (
                <Avatar
                  src={logoUrl ?? undefined}
                  variant="rounded"
                  imgProps={{
                    style: { objectFit: "contain", background: "#fff" },
                  }}
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: "#faf6ef",
                    border: "1px solid rgba(56, 35, 34, 0.12)",
                    borderRadius: 3,
                  }}
                />
              )}

              <TextField
                label="Contact email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!canManageVendor}
                fullWidth
                sx={fieldSx(999)}
              />

              <TextField
                label="Contact phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!canManageVendor}
                fullWidth
                sx={fieldSx(999)}
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
                sx={fieldSx(3)}
              />

              {canManageVendor ? (
                <Box>
                  <Button
                    variant="contained"
                    onClick={saveVendor}
                    disabled={busy !== null}
                    sx={primaryButtonSx}
                  >
                    {busy === "vendor"
                      ? "Saving…"
                      : "Save vendor details"}
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Only a Vendor Admin can edit these details.
                </Typography>
              )}
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};
