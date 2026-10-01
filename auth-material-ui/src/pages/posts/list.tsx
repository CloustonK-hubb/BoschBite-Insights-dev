import { useMany } from "@refinedev/core";
import { EditButton, List, useDataGrid } from "@refinedev/mui";
import React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { ICategory, IPost } from "../../interfaces";
import { ShowButton } from "@refinedev/mui";

//List object for a post 
export const PostList: React.FC = () => {
  const { dataGridProps } = useDataGrid<IPost>();

  const categoryIds = dataGridProps.rows.map((item) => item.category.id);
  const {
    result: categoriesData,
    query: { isLoading },
  } = useMany<ICategory>({
    resource: "categories",
    ids: categoryIds,
    queryOptions: {
      enabled: categoryIds.length > 0,
    },
  });

  const columns = React.useMemo<GridColDef<IPost>[]>(
    () => [
      {field: "id", headerName: "ID", type: "number", width: 50,},
      { field: "title", headerName: "Title", minWidth: 400, flex: 1 },
      {field: "category.id", headerName: "Category", type: "number", headerAlign: "left", align: "left", minWidth: 250,
        flex: 0.5, display: "flex", renderCell: function render({ row }) { 
          if (isLoading) {
            return "Loading...";
          }

          const category = categoriesData?.data.find(
            (item) => item.id === row.category.id,
          );
          return category?.title;
        },
      },
      { field: "status", headerName: "Status", minWidth: 120, flex: 0.3 },
      {field: "actions", headerName: "Actions", display: "flex", renderCell: function render({ row }) {return(
      <>
        <ShowButton hideText recordItemId={row.id} />
        <EditButton hideText recordItemId={row.id} />
      </>
     );
       },
        align: "center",
        headerAlign: "center",
        minWidth: 80,
      },
    ],
    [categoriesData, isLoading],
  );

  return (
    <List>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100vh - 320px)",
        }}
      >
        <DataGrid {...dataGridProps} columns={columns} />
      </div>
    </List>
  );
};

//List object for Users
export const UserList: React.FC = () => {
  const { dataGridProps } = useDataGrid({ resource: "users" });

  const columns = React.useMemo<GridColDef[]>(
    () => [
      { field: "id", headerName: "ID", width: 80 },
      { field: "firstName", headerName: "First name", flex: 1 },
      { field: "lastName", headerName: "Last name", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      { field: "birthday", headerName: "Birthday", flex: 1}, 
      { field: "skills", headerName: "Skills", flex: 1}, 
      { field: "avatar", headerName: "Avatar", flex: 1},
      { field: "actions", headerName: "Actions", sortable: false, width: 100,renderCell: ({ row }) => <ShowButton hideText recordItemId={row.id} />},
    ],
    []
  );

  return (
    <List>
      <DataGrid {...dataGridProps} columns={columns} autoHeight />
    </List>
  );
};
