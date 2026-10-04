import { useShow, useOne } from "@refinedev/core";
import { Show, TextFieldComponent as TextField, MarkdownField, DateField } from "@refinedev/mui";
import { Stack, Typography } from "@mui/material";
import React from "react";

//Show page for transaction table 
export const TransactionShow: React.FC = () => {
  const { query } = useShow({ resource: "Transaction", meta : { idColumnName: "transaction_id"} });//The filter is natually looking for a column in the table called id.
  //But the transaction tables id column is "transaction_id"
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
  const { query } = useShow({ resource: "Student", meta : { idColumnName: "id_number"}});
  const student = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={student?.id_number} />

        <Typography variant="body1" fontWeight="bold">First name</Typography>
        <TextField value={student?.first_name} />

        <Typography variant="body1" fontWeight="bold">Last name</Typography>
        <TextField value={student?.last_name} />

        <Typography variant="body1" fontWeight="bold">Email</Typography>
        <TextField value={student?.email} />

        <Typography variant="body1" fontWeight="bold">Date of Birth</Typography>
        <TextField value={student?.dob} />

        <Typography variant="body1" fontWeight="bold">Gender</Typography>
        <TextField value={student?.gender} />

        <Typography variant="body1" fontWeight="bold">Cell number</Typography>
        <TextField value={student?.phone} />

        <Typography variant="body1" fontWeight="bold">Address</Typography>
        <TextField value={student?.address} />
      </Stack>
    </Show>
  );
};