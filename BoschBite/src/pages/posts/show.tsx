import { useShow, useResourceParams } from "@refinedev/core";
import { Show, EditButton, DeleteButton } from "@refinedev/mui";
import { Alert, Box, Typography } from "@mui/material";
import React from "react";
import { showStyles } from "../../providers/theme";


/*
SHARED PIECES
 */

//One label with its value underneath. Empty values show as a dash
type FieldProps = { label: string; value?: React.ReactNode; wide?: boolean };

const Field = ({ label, value, wide }: FieldProps) => (
  <Box sx={wide ? showStyles.fieldWide : showStyles.field}>
    <Typography sx={showStyles.label}>{label}</Typography>
    <Typography sx={showStyles.value}>{value === null || value === undefined || value === "" ? "—" : value}</Typography>
  </Box>
);

//Page layout for one record: big title, short description, Edit and Delete on the right, details in a white card
type ThemedShowProps = {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  //Message to show when the record can't be loaded
  errorMessage?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  //Tells Delete which column holds the id, when it isn't "id"
  idColumnName?: string;
  children: React.ReactNode;
};

const ThemedShow = ({ title, subtitle, isLoading, errorMessage, canEdit, canDelete, idColumnName, children }: ThemedShowProps) => (
  <Show
    isLoading={isLoading}
    canEdit={canEdit}
    canDelete={canDelete}
    deleteButtonProps={idColumnName ? { meta: { idColumnName } } : undefined}
    breadcrumb={false}
    title={
      <Box>
        <Typography sx={showStyles.title}>{title}</Typography>
        {subtitle && <Typography sx={showStyles.subtitle}>{subtitle}</Typography>}
      </Box>
    }
    //Only Edit and Delete, styled as pill buttons from the theme
    headerButtons={({ editButtonProps, deleteButtonProps }) => (
      <Box sx={showStyles.headerButtons}>
        {editButtonProps && <EditButton {...editButtonProps} sx={showStyles.editButton} />}
        {deleteButtonProps && <DeleteButton {...deleteButtonProps} sx={showStyles.deleteButton} />}
      </Box>
    )}
    wrapperProps={{ sx: showStyles.wrapper }}
    headerProps={{ disableTypography: true, sx: showStyles.header }}
    contentProps={{ sx: showStyles.content }}
  >
    <Box sx={showStyles.card}>
      {errorMessage ? <Alert severity="error" sx={showStyles.error}>{errorMessage}</Alert> : children}
    </Box>
  </Show>
);

//Works out what to say when a record doesn't load
const loadError = (query: { isLoading: boolean; isError: boolean; error: unknown; data?: { data?: unknown } }) => {
  if (query.isLoading) return undefined;
  if (query.isError) return `Could not load this record: ${(query.error as { message?: string })?.message ?? "unknown error"}`;
  if (!query.data?.data) return "This record could not be found, or you do not have access to it.";
  return undefined;
};

//Splits a date and time into two parts
const txDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";

const txTime = (value?: string) =>
  value ? new Date(value).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) : "";

//Shows money as R 12.50
const rands = (value?: number | string | null) =>
  value === null || value === undefined || value === "" ? "" : `R ${Number(value).toFixed(2)}`;

//Shows a discount as a percentage. 0.15 and 15 both show as 15%
const percent = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return `${Number((n <= 1 ? n * 100 : n).toFixed(1))}%`;
};


//Show page for transaction table
export const TransactionShow: React.FC = () => {
  //vendor(name) and student_directory(student_no) bring in the vendor name and the student's number
  const { query } = useShow({ resource: "transaction", meta: { select: "*, vendor(name), student_directory(student_no)" } });
  const transaction = query.data?.data;

  return (
    <ThemedShow title="Transaction" subtitle="One BoschCard purchase." isLoading={query.isLoading} errorMessage={loadError(query)} canEdit={false} canDelete={false}>
      <Field label="Transaction ID" value={transaction?.id} />
      <Field label="Student" value={transaction?.student_directory?.student_no} />
      <Field label="Vendor name" value={transaction?.vendor?.name} />
      <Field label="Transaction value" value={rands(transaction?.value)} />
      <Field label="Discount" value={percent(transaction?.discount)} />
      <Field label="Date" value={txDate(transaction?.tx_datetime)} />
      <Field label="Time" value={txTime(transaction?.tx_datetime)} />
    </ThemedShow>
  );
};

//Show page for the Student table
export const StudentShow: React.FC = () => {
  //The page is /student/show/:id but the data comes from student_directory,
  //so Refine won't pass the id on by itself. This reads it from the page address
  const { id } = useResourceParams();

  //Reads the safe view: names, emails and cell numbers are hidden for everyone
  const { query } = useShow({ resource: "student_directory", id, meta: { idColumnName: "id" } });
  const student = query.data?.data;

  return (
    <ThemedShow title="Student" subtitle="Personal details are kept private." isLoading={query.isLoading} errorMessage={loadError(query)} canEdit={false} canDelete={false}>
      <Field label="Student" value={student?.student_no} />
      <Field label="Date of birth" value={student?.dob} />
      <Field label="Gender" value={student?.gender} />
      <Field label="Address" value={student?.address} wide />
    </ThemedShow>
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
  //vendor(name) brings in the vendor name instead of its id
  const { query } = useShow({ resource: "promo_window_v2", meta: { idColumnName: "promo_id", select: "*, vendor(name)" } });
  const promo = query.data?.data;

  return (
    <ThemedShow title="Promotion window" subtitle="One promotion run by a BoschBite vendor." isLoading={query.isLoading} errorMessage={loadError(query)} idColumnName="promo_id">
      <Field label="Vendor name" value={promo?.vendor?.name} />
      <Field label="Promotion name" value={promo?.promo_name} />
      <Field label="Promotion number" value={promo?.promo_number} />
      <Field label="Promotion type" value={promo?.promo_type} />
      <Field label="Discount of promo" value={percent(promo?.discount)} />
      <Field label="Weekday of promo" value={WEEKDAYS[promo?.promo_weekday]} />
      <Field label="Duration (days)" value={promo?.duration_days} />
      <Field label="Start date" value={promo?.start_date} />
      <Field label="End date" value={promo?.end_date} />
      <Field label="# Occurrence of promo" value={promo?.occurence_count} />
      <Field label="# Qualifying days" value={promo?.qualifying_days} />
      <Field label="# Discounted transactions" value={promo?.discounted_transactions} />
      <Field label="Total promotion value" value={rands(promo?.total_sales_value)} />
    </ThemedShow>
  );
};