import { useCallback, useEffect, useRef, useState } from "react";
import { useGetIdentity, useInvalidateAuthStore } from "@refinedev/core";
import { List } from "@refinedev/mui";
import { Alert, Avatar, Box, Button, Card, CardContent, Chip, Stack, TextField, Typography } from "@mui/material";
import { supabaseClient } from "../providers/supabaseClient";


/* 
   SETTINGS
 */

//Storage bucket that holds the uploaded logos
const BUCKET = "vendor-logos";

//Largest file allowed (2 MB)
const MAX_BYTES = 2 * 1024 * 1024;

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
};

type VendorDetails = {
  vendor_id: number;
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

//Only JPEG files up to 2 MB are accepted
const checkJpeg = (file: File): string | null => {
  if (file.type !== "image/jpeg") {
    return "Please choose a JPEG image (.jpg or .jpeg).";
  }
  if (file.size > MAX_BYTES) {
    return "The image must be 2 MB or smaller.";
  }
  return null;
};

//Works out the file path inside our bucket from a saved logo link
const pathFromUrl = (url: string | null): string | null => {
  if (!url) return null;
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length).split("?")[0];
};


/* 
   LOGO PICKER
   Shows a blank avatar until a logo is uploaded.
 */

type LogoPickerProps = {
  src?: string;
  busy: boolean;
  onPick: (file: File) => void;
};

const LogoPicker = ({ src, busy, onPick }: LogoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        src={src}
        variant="rounded"
        imgProps={{ style: { objectFit: "contain" } }}
        sx={{ width: 96, height: 96 }}
      />

      <Box>
        <Button
          variant="outlined"
          size="small"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Upload company logo"}
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
            //Lets the same file be picked again
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </Box>
    </Stack>
  );
};


/* 
   PAGE
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
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"logo" | "personal" | "vendor" | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

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

    if (p.vendor_id !== null) {
      const [vendorResult, detailsResult, logoResult] = await Promise.all([
        supabaseClient
          .from("Vendor")
          .select("name")
          .eq("vendor_id", p.vendor_id)
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
    }

    setLoading(false);
  }, [myId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ACTIONS */

  //Uploads the new logo, saves its link, then deletes the old file
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
    const newPath = `${vendorId}/${Date.now()}.jpg`;
    const oldPath = pathFromUrl(logoUrl);

    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(newPath, file, { contentType: "image/jpeg" });

    if (uploadError) {
      setBusy(null);
      setMessage({ type: "error", text: `Upload failed: ${uploadError.message}` });
      return;
    }

    const newUrl = supabaseClient.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;

    //Creates the vendor's row if it does not exist yet, otherwise updates it
    const { error: saveError } = await supabaseClient
      .from("Vendor_logo")
      .upsert({ vendor_id: vendorId, logo_url: newUrl }, { onConflict: "vendor_id" });

    if (saveError) {
      await supabaseClient.storage.from(BUCKET).remove([newPath]);
      setBusy(null);
      setMessage({ type: "error", text: saveError.message });
      return;
    }

    //Only removes files this page uploaded (kept in the vendor's own folder), never the team's original logos
    if (oldPath && oldPath.startsWith(`${vendorId}/`)) {
      await supabaseClient.storage.from(BUCKET).remove([oldPath]);
    }

    setBusy(null);
    setMessage({ type: "success", text: "The company logo was updated." });
    await load();
    //Refreshes the picture in the side navigation
    invalidateAuthStore();
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
    //Refreshes the name in the side navigation
    invalidateAuthStore();
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

  /* PAGE LAYOUT */

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

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <List title="My Profile">
      <Stack spacing={4} sx={{ maxWidth: 720 }}>
        {message && (
          <Alert severity={message.type} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        {/* Personal information */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h5">Personal information</Typography>
                <Chip label={ROLE_LABELS[profile.role]} size="small" />
              </Box>

              {/* Company logo shown here but not edited here */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  src={logoUrl ?? undefined}
                  imgProps={{ style: { objectFit: "contain" } }}
                  sx={{ width: 72, height: 72 }}
                >
                  {initials}
                </Avatar>

                {profile.vendor_id !== null}
              </Stack>

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

        {/* Vendor information */}
        {profile.vendor_id !== null && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="h5">{vendorName ?? "Your vendor"}</Typography>

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
                    imgProps={{ style: { objectFit: "contain" } }}
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