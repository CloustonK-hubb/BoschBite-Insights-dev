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

//Show object fro the Student table 
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

//Show object for the Vendor table
export const VendorShow: React.FC = () => {
  const { query } = useShow({ resource: "Vendor", meta : { idColumnName: "vendor_id"}});
  const vendor = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={vendor?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Vendor name</Typography>
        <TextField value={vendor?.name} />

        <Typography variant="body1" fontWeight="bold">Address</Typography>
        <TextField value={vendor?.address} />

        <Typography variant="body1" fontWeight="bold">GPS coordinates</Typography>
        <TextField value={vendor?.gps} />

        <Typography variant="body1" fontWeight="bold">Vendor type </Typography>
        <TextField value={vendor?.type_id} />

      </Stack>
    </Show>
  );
};

//Show object for the Vendor_Type table
export const VendorTypeShow: React.FC = () => {
  const { query } = useShow({ resource: "Vendor_Type", meta : { idColumnName: "type_id"}});
  const vendor_type = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={vendor_type?.type_id} />

        <Typography variant="body1" fontWeight="bold">Vendor name</Typography>
        <TextField value={vendor_type?.name} />

      </Stack>
    </Show>
  );
};

//Show object for the Calendar table
export const CalendarShow: React.FC = () => {
  const { query } = useShow({ resource: "Calendar", meta : { idColumnName: "period_id"}});
  const calendar = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={calendar?.period_id} />

        <Typography variant="body1" fontWeight="bold">Calendar function</Typography>
        <TextField value={calendar?.function} />

        <Typography variant="body1" fontWeight="bold">Year</Typography>
        <TextField value={calendar?.year} />

        <Typography variant="body1" fontWeight="bold">Start date</Typography>
        <TextField value={calendar?.start_date} />

        <Typography variant="body1" fontWeight="bold">End date</Typography>
        <TextField value={calendar?.end_date} />

        <Typography variant="body1" fontWeight="bold">Period category</Typography>
        <TextField value={calendar?.period_type} />
    
      </Stack>
    </Show>
  );
};

//Show object fro the Promo_Window table
export const PromoWindowShow: React.FC = () => {
  const { query } = useShow({ resource: "Promo_Window", meta : { idColumnName: "promo_id"}});
  const promo_window = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Promotion ID</Typography>
        <TextField value={promo_window?.promo_id} />

        <Typography variant="body1" fontWeight="bold">Vendor name</Typography>
        <TextField value={promo_window?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Promo number</Typography>
        <TextField value={promo_window?.promo_number} />

        <Typography variant="body1" fontWeight="bold">Start date</Typography>
        <TextField value={promo_window?.start_date} />

        <Typography variant="body1" fontWeight="bold">End date</Typography>
        <TextField value={promo_window?.end_date} />

        <Typography variant="body1" fontWeight="bold">Duration</Typography>
        <TextField value={promo_window?.duration_days} />
    
      </Stack>
    </Show>
  );
};

//Show object for the KPI table
export const KPIShow: React.FC = () => {
  const { query } = useShow({ resource: "kpi_tx_base", meta : { idColumnName: "transaction_id"}});
  const kpi_tx_base = query.data?.data;

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Promotion ID</Typography>
        <TextField value={kpi_tx_base?.transaction_id} />

        <Typography variant="body1" fontWeight="bold">Vendor name</Typography>
        <TextField value={kpi_tx_base?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Long date</Typography>
        <TextField value={kpi_tx_base?.datetime} />

        <Typography variant="body1" fontWeight="bold">Short date</Typography>
        <TextField value={kpi_tx_base?.local_date} />

        <Typography variant="body1" fontWeight="bold">Hour of day</Typography>
        <TextField value={kpi_tx_base?.hour_of_day} />

        <Typography variant="body1" fontWeight="bold">Meal category</Typography>
        <TextField value={kpi_tx_base?.meal_period} />

        <Typography variant="body1" fontWeight="bold">Value</Typography>
        <TextField value={kpi_tx_base?.value} />

        <Typography variant="body1" fontWeight="bold">Discount(%)</Typography>
        <TextField value={kpi_tx_base?.discount} />
    
    
    
      </Stack>
    </Show>
  );
};