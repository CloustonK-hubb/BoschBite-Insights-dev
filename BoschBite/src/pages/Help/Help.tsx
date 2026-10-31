import { useMemo, useState, useEffect, useCallback } from "react";
import { useGetIdentity } from "@refinedev/core";
import { Navigate } from "react-router";
import { Alert, Box, Button, Chip, Paper, Skeleton, TextField, Typography } from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import { supabaseClient } from "../../providers/supabaseClient";


/* 
   SETTINGS
   Same colours as the rest of the app
 */

const BROWN = "#382322";
const CREAM = "#f1e5d5";
const ACCENT = "#F8E8A8";
const GREEN = "#2E7D5B";

//Same rule the database uses to check email addresses
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

//Soft cream fields, pill shaped for short fields and rounded for the big description box
const fieldSx = (radius: number) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: radius,
    backgroundColor: "#fff",
    "& fieldset": { borderColor: "rgba(56, 35, 34, 0.12)" },
    "&:hover fieldset": { borderColor: "#d9c7ab" },
    "&.Mui-focused fieldset": { borderColor: BROWN, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: BROWN },
});

const cardSx = {
  bgcolor: "#fff",
  borderRadius: 3,
  boxShadow: "0 1px 3px rgba(56, 35, 34, 0.06), 0 6px 18px rgba(56, 35, 34, 0.04)",
};


/* 
   HELP FORM
   Everyone can send a request to the BoschBite Admins
 */

export const HelpPage = () => {
  const { data: me } = useGetIdentity<{ id: string; email?: string }>();

  const [email, setEmail] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //Starts with the account email, but it can be changed to another contact address
  const emailValue = email ?? me?.email ?? "";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = emailValue.trim();
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError("Please enter a valid email address so we can reply to you.");
      return;
    }

    if (cleanTitle.length < 3) {
      setError("Please give your request a short title.");
      return;
    }

    if (cleanDescription.length < 10) {
      setError("Please describe the problem in a little more detail (at least 10 characters).");
      return;
    }

    setSending(true);

    const { error: insertError } = await supabaseClient
      .from("support_tickets")
      .insert({ email: cleanEmail, title: cleanTitle, description: cleanDescription });

    setSending(false);

    if (insertError) {
      //42501 means the database refused it, which happens after 5 requests in an hour
      setError(
        insertError.code === "42501"
          ? "You have sent several requests recently. Please wait a while before sending another."
          : `Your request could not be sent: ${insertError.message}`,
      );
      return;
    }

    setSent(true);
  };

  //Clears the form so another request can be sent
  const reset = () => {
    setTitle("");
    setDescription("");
    setEmail(null);
    setSent(false);
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", py: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 800, color: BROWN, lineHeight: 1.1 }}>Help & support</Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
          Something not working? Tell us what happened and a BoschBite Admin will get back to you by email.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ ...cardSx, p: { xs: 3, sm: 4 } }}>
        {sent ? (
          /* Shown after the request has been sent */
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 64, color: GREEN, mb: 2 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: BROWN }}>Request sent</Typography>
            <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>
              Thanks, a BoschBite Admin will reply to {emailValue.trim()} as soon as possible.
            </Typography>
            <Button onClick={reset} sx={{ borderRadius: 999, fontWeight: 700, color: BROWN }}>
              Send another request
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={submit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Your email address"
              type="email"
              value={emailValue}
              onChange={(e) => setEmail(e.target.value)}
              helperText="We will reply to this address."
              inputProps={{ maxLength: 254 }}
              required
              fullWidth
              sx={fieldSx(999)}
            />

            <TextField
              label="Title"
              placeholder="For example: I can't see my vendor's transactions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText={`${title.length}/120`}
              inputProps={{ maxLength: 120 }}
              required
              fullWidth
              sx={fieldSx(999)}
            />

            <TextField
              label="Description"
              placeholder="What were you trying to do, and what happened instead?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText={`${description.length}/2000`}
              inputProps={{ maxLength: 2000 }}
              multiline
              minRows={6}
              required
              fullWidth
              sx={fieldSx(3)}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={sending}
              startIcon={<SupportAgentIcon />}
              sx={{
                borderRadius: 999,
                py: 1.25,
                fontWeight: 700,
                letterSpacing: 0.5,
                backgroundColor: BROWN,
                color: CREAM,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#4d3130", boxShadow: "0 6px 16px rgba(56, 35, 34, 0.25)" },
                "&.Mui-disabled": { backgroundColor: BROWN, color: CREAM, opacity: 0.5 },
              }}
            >
              {sending ? "Sending..." : "Send request"}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};


/* 
   HELP REQUESTS INBOX
   Only BoschBite Admins can open this page
 */

type Ticket = {
  id: number;
  created_at: string;
  email: string;
  title: string;
  description: string;
  status: "open" | "resolved";
  profiles: { first_name: string; last_name: string } | null;
};

const TABS: { key: Ticket["status"]; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

export const HelpRequests = () => {
  const { data: me, isLoading: identityLoading } = useGetIdentity<{ role: string | null }>();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<Ticket["status"]>("open");

  const isBosch = me?.role === "boschbite_admin";

  const fetchTickets = useCallback(async () => {
    if (!isBosch) return;

    setLoading(true);

    const { data, error } = await supabaseClient
      .from("support_tickets")
      .select("id, created_at, email, title, description, status, profiles(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(`Could not load help requests: ${error.message}`);
      setLoading(false);
      return;
    }

    setTickets((data ?? []) as unknown as Ticket[]);
    setLoading(false);
  }, [isBosch]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  //Marks a request as resolved, or opens it again
  const setStatus = async (ticket: Ticket, status: Ticket["status"]) => {
    setErrorMessage(null);

    const { data, error } = await supabaseClient
      .from("support_tickets")
      .update({ status })
      .eq("id", ticket.id)
      .select("id");

    if (error || !data || data.length === 0) {
      setErrorMessage(error?.message ?? "You are not allowed to change this request.");
      return;
    }

    await fetchTickets();
  };

  const counts = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "open").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
    }),
    [tickets],
  );

  const visible = tickets.filter((t) => t.status === tab);

  //Checks after all hooks
  if (identityLoading || !me) return null;

  if (!isBosch) return <Navigate to="/" replace />;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 30, fontWeight: 800, color: BROWN, lineHeight: 1.1 }}>Help requests</Typography>
        <Typography sx={{ color: "text.secondary", mt: 0.5 }}>Requests sent by people using BoschBite Insights.</Typography>
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

      {/* The list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 3 }} />)
        ) : visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <InboxOutlinedIcon sx={{ fontSize: 44, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>{tab === "open" ? "No open requests. All caught up!" : "No resolved requests yet."}</Typography>
          </Box>
        ) : (
          visible.map((t) => (
            <Paper key={t.id} elevation={0} sx={{ ...cardSx, p: 2.5 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: BROWN, fontSize: 17 }}>{t.title}</Typography>
                <Chip
                  label={t.status === "open" ? "Open" : "Resolved"}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: t.status === "open" ? ACCENT : "rgba(46, 125, 91, 0.15)", color: t.status === "open" ? BROWN : GREEN }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.5 }}>
                {t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name} · ` : ""}
                {t.email} · {new Date(t.created_at).toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Typography>

              {/* Keeps the line breaks the person typed */}
              <Typography sx={{ color: BROWN, whiteSpace: "pre-wrap", wordBreak: "break-word", mb: 2 }}>{t.description}</Typography>

              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  startIcon={<MailOutlineIcon />}
                  href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: ${t.title}`)}`}
                  sx={{ borderRadius: 999, fontWeight: 700, color: BROWN }}
                >
                  Reply by email
                </Button>

                {t.status === "open" ? (
                  <Button
                    size="small"
                    disableElevation
                    variant="contained"
                    onClick={() => setStatus(t, "resolved")}
                    sx={{ borderRadius: 999, px: 2, fontWeight: 700, bgcolor: GREEN, "&:hover": { bgcolor: "#256a4b" } }}
                  >
                    Mark resolved
                  </Button>
                ) : (
                  <Button size="small" onClick={() => setStatus(t, "open")} sx={{ borderRadius: 999, fontWeight: 700, color: BROWN }}>
                    Reopen
                  </Button>
                )}
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
};