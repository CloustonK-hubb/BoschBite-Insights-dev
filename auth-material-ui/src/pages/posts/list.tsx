import { useMany } from "@refinedev/core";
import { EditButton, List, useDataGrid, DateField } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ICategory, IPost } from "../../interfaces";
import { ShowButton } from "@refinedev/mui";

//List object for a transaction 

export const TransactionList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "Transaction" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "transaction_id", headerName: "ID", type: "number", width: 90 },
      { field: "student_id", headerName: "Student ID", flex: 1, minWidth: 130 },
      { field: "vendor_id", headerName: "Vendor ID", type: "number", width: 110 },
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

//List object for Users
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
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} getRowId={(row)=> row.id_number}autoHeight />
    </List>
  );
};
