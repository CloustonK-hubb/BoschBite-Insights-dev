import { useShow } from "@refinedev/core";
import { Show, TextFieldComponent as TextField } from "@refinedev/mui";
import { Stack, Typography } from "@mui/material";
import React from "react";

export const UserShow: React.FC = () => {
  const { query } = useShow({ resource: "users" });
  const user = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={user?.id} />

        <Typography variant="body1" fontWeight="bold">First name</Typography>
        <TextField value={user?.firstName} />

        <Typography variant="body1" fontWeight="bold">Last name</Typography>
        <TextField value={user?.lastName} />

        <Typography variant="body1" fontWeight="bold">Email</Typography>
        <TextField value={user?.email} />
      </Stack>
    </Show>
  );
};