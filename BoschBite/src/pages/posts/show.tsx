import { useShow, useOne } from "@refinedev/core";
import { Show, TextFieldComponent as TextField, MarkdownField, DateField } from "@refinedev/mui";
import { Stack, Typography } from "@mui/material";
import React from "react";

//Show page for transaction table 
export const TransactionShow: React.FC = () => {
  const { query } = useShow({ resource: "transaction", meta : { idColumnName: "id"} });//The filter is natually looking for a column in the table called id.
  //But the transaction tables id column is "transaction_id"
  const transaction = query.data?.data;

  return (
    <Show isLoading={query.isLoading} breadcrumb={false}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Transaction ID</Typography>
        <TextField value={transaction?.id} />

        <Typography variant="body1" fontWeight="bold">Student ID</Typography>
        <TextField value={transaction?.student_id} />

        <Typography variant="body1" fontWeight="bold">Vendor ID</Typography>
        <TextField value={transaction?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Date & time</Typography>
        <DateField value={transaction?.tx_datetime} format="DD MMM YYYY HH:mm" />

        <Typography variant="body1" fontWeight="bold">Value</Typography>
        <TextField value={transaction?.value} />

        <Typography variant="body1" fontWeight="bold">Discount</Typography>
        <TextField value={transaction?.discount} />
      </Stack>
    </Show>
  );
};

//Show page for the Student table
export const StudentShow: React.FC = () => {
  const { query } = useShow({ resource: "student", meta : { idColumnName: "id"}});
  const student = query.data?.data;

  return (
    <Show isLoading={query.isLoading} canEdit={false} breadcrumb={false}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Student ID</Typography>
        <TextField value={student?.id} />

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




//Show object for the Calendar table
export const CalendarShow: React.FC = () => {
  const { query } = useShow({ resource: "calendar_event", meta : { idColumnName: "id"}});
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

//Show object for the Promo_Window table

//Lookup list for the weekday column in the Promo_Window table to return the day of hte week instead of the number 
const WEEKDAYS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

export const PromoWindowShow: React.FC = () => {
  const { query } = useShow({ resource: "promo_window_v2", meta : { idColumnName: "promo_id"}});
  const promo_window_v2 = query.data?.data;

  return (
    <Show isLoading={query.isLoading} breadcrumb={false}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">Promotion ID</Typography>
        <TextField value={promo_window_v2?.promo_id} />

        <Typography variant="body1" fontWeight="bold">Vendor name</Typography>
        <TextField value={promo_window_v2?.vendor_id} />

        <Typography variant="body1" fontWeight="bold">Promo number</Typography>
        <TextField value={promo_window_v2?.promo_number} />

        <Typography variant="body1" fontWeight="bold">Promo type</Typography>
        <TextField value={promo_window_v2?.promo_type} />

        <Typography variant="body1" fontWeight="bold">Discount of promo</Typography>
        <TextField value={promo_window_v2?.discount} />

        <Typography variant="body1" fontWeight="bold">Weekday of promo</Typography>
        <TextField value={WEEKDAYS[promo_window_v2?.promo_weekday] ?? "-"} />

        <Typography variant="body1" fontWeight="bold">Start date</Typography>
        <TextField value={promo_window_v2?.start_date} />

        <Typography variant="body1" fontWeight="bold">End date</Typography>
        <TextField value={promo_window_v2?.end_date} />

        <Typography variant="body1" fontWeight="bold">Duration (days)</Typography>
        <TextField value={promo_window_v2 ?.duration_days} />

        <Typography variant="body1" fontWeight="bold"># Occurence of promo</Typography>
        <TextField value={promo_window_v2?.occurence_count} />

        <Typography variant="body1" fontWeight="bold"># Qualifying days</Typography>
        <TextField value={promo_window_v2?.qualifying_days} />

        <Typography variant="body1" fontWeight="bold"># Discounted transactions</Typography>
        <TextField value={promo_window_v2?.discounted_transactions} />

        <Typography variant="body1" fontWeight="bold">Total promotion value</Typography>
        <TextField value={promo_window_v2?.total_sales_value} />
    
      </Stack>
    </Show>
  );
};