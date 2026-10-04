import { useShow, useOne } from "@refinedev/core";
import { Show, TextFieldComponent as TextField, MarkdownField, DateField } from "@refinedev/mui";
import { Stack, Typography } from "@mui/material";
import React from "react";

//Show page for posts table 
export const TransactionShow: React.FC = () => {
  const { query } = useShow({ resource: "Transaction", meta : { idColumnName: "transaction_id"} });
  const transaction = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Transaction ID</Typography>
        <TextField value={transaction?.transaction_id} />

        <Typography variant="body1" fontWeight="bold">Student ID</Typography>
        <TextField value={transaction?.student_id} />

        <Typography variant="body1" fontWeight="bold">Vendor ID</Typography>
        <TextField value={transaction?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Date & time</Typography>
        <DateField value={transaction?.datetime} format="DD MMM YYYY HH:mm" />

        <Typography variant="body1" fontWeight="bold">Value</Typography>
        <TextField value={transaction?.value} />

        <Typography variant="body1" fontWeight="bold">Discount</Typography>
        <TextField value={transaction?.discount} />
      </Stack>
    </Show>
  );
};


export const StudentShow: React.FC = () => {
  const { query } = useShow({ resource: "Student" });
  const student = query.data?.data;

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