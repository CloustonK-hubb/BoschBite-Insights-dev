import { useMany } from "@refinedev/core";
import { EditButton, List, useDataGrid, DateField } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ICategory, IPost } from "../../interfaces";
import { ShowButton } from "@refinedev/mui";

//List object for a transaction 

export const TransactionList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Transaction", meta: { select: "*, Vendor(name), Student(first_name, last_name)"  }, });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "transaction_id", headerName: "ID", type: "number", width: 90 },
      { field: "student_id", headerName: "Student name", flex: 1, minWidth: 130, renderCell: ({ row }) => row.Student?`${row.Student.first_name} ${row.Student.last_name}` : row.id_number, },
      { field: "vendor_id", headerName: "Vendor name", type: "number", width: 110, renderCell: ({ row }) => row.Vendor?.name ?? row.vendor_id, },
      { field: "datetime", headerName: "Date & time", flex: 1, minWidth: 180, renderCell: ({ row }) => (
          <DateField value={row.datetime} format="DD MMM YYYY HH:mm" />),},
      {field: "value",headerName: "Transaction value", type: "number", width: 110,
        renderCell: ({ row }) => Number(row.value).toFixed(2),},
      { field: "discount", headerName: "Discount", type: "number", width: 110 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.transaction_id} />}
    ],
    []
  );

  return (
    <List>
      <DataGrid
        {...dataGridProps}
        columns={columns}
        getRowId={(row) => row.transaction_id}
        autoHeight
      />
    </List>
  );
};

//List object for Students
export const StudentList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Student" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "id_number", headerName: "ID", width: 80 },
      { field: "first_name", headerName: "First name", flex: 1 },
      { field: "last_name", headerName: "Last name", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "dob", headerName: "Date of Birth", flex: 1, renderCell: ({ row }) => (<DateField value={row.dob} format="YYYY-MM-DD" />)}, 
      { field: "gender", headerName: "Gender", flex: 1}, 
      { field: "phone", headerName: "Cell number", flex: 1},
      { field: "address", headerName: "Address", felx: 1},
      { field: "actions", headerName: "Actions", sortable: false, width: 100, renderCell: ({ row }) => ( <>
        <ShowButton hideText recordItemId={row.id_number} />
        <EditButton hideText recordItemId= {row.id_number}/>
      </>
      )
      },
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.id_number}autoHeight />
    </List>
  );
};

//List object for Vendors
export const VendorList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Vendor", meta: { select: "*, Vendor_Type(name)" },});

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "vendor_id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Vendor name", flex: 1 },
      { field: "address", headerName: "Address", flex: 1 },
      { field: "gps", headerName: "GPS coordinates", flex: 1 },
      { field: "type_id", headerName: "Vendor type", flex: 1, sortable: false, renderCell: ({ row }) => row.Vendor_Type?.name ?? "-",}, 
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.vendor_id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.vendor_id}autoHeight />
    </List>
  );
};

//List object for Vendor Types
export const VendorTypesList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Vendor_Type" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "type_id", headerName: "ID", width: 80 },
      { field: "name", headerName: "Vendor type", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.type_id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.type_id}autoHeight />
    </List>
  );
};

//List object for the Calendar
export const CalendarList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Calendar" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "period_id", headerName: "ID", width: 80 },
      { field: "function", headerName: "Calendar function", flex: 1 },
      { field: "year", headerName: "Year", flex: 1 },
      { field: "start_date", headerName: "Start date", flex: 1 },
      { field: "end_date", headerName: "End date", flex: 1 },
      { field: "period_type", headerName: "Period category", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100, renderCell: ({ row }) => ( <>
        <ShowButton hideText recordItemId={row.period_id} />
        <EditButton hideText recordItemId= {row.period_id}/>
      </>
      )},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.period_id}autoHeight />
    </List>
  );
};

//List objetc for the Promo_window table
export const PromoWindowList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Promo_Window", meta: { select: "*, Vendor(name)" }, });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "promo_id", headerName: "Promotion ID", width: 150 },
      { field: "vendor_id", headerName: "Vendor name", width: 240, renderCell: ({ row }) => row.Vendor?.name ?? "-", },
      { field: "promo_number", headerName: "Promotion number", width: 150 },
      { field: "start_date", headerName: "Start date", flex: 1 },
      { field: "end_date", headerName: "End date", flex: 1 },
      { field: "duration_days", headerName: "Duration (days)", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100, renderCell: ({ row }) => ( <>
        <ShowButton hideText recordItemId={row.promo_id} />
        <EditButton hideText recordItemId= {row.promo_id}/>
      </>
      )},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.promo_id}autoHeight />
    </List>
  );
};

//List object for the KPI table
export const KPIList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "kpi_tx_base", meta: { select: "*, Vendor(name)" }, });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "transaction_id", headerName: "Transaction ID", width: 150 },
      { field: "vendor_id", headerName: "Vendor name", width: 240, renderCell: ({ row }) => row.Vendor?.name ?? "-", },
      { field: "datetime", headerName: "Long date", width: 150 },
      { field: "local_date", headerName: "Short date", flex: 1 },
      { field: "hour_of_day", headerName: "Hour of the day", flex: 1 },
      { field: "meal_period", headerName: "Meal category", flex: 1 },
      { field: "value", headerName: "Value", flex: 1 },
      { field: "discount", headerName: "Discount(%)", flex: 1 },
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.promo_id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.transaction_id}autoHeight />
    </List>
  );
};
