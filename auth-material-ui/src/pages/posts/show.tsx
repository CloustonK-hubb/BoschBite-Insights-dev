import { useShow, useOne } from "@refinedev/core";
import { Show, TextFieldComponent as TextField, MarkdownField, DateField } from "@refinedev/mui";
import { Stack, Typography } from "@mui/material";
import React from "react";

//Show page for posts table 
export const PostShow: React.FC = () => {
  const { query } = useShow({ resource: "posts" });
  const post = query.data?.data;

  const { query: categoryQuery } = useOne({
    resource: "categories",
    id: post?.category?.id,
    queryOptions: { enabled: !!post?.category?.id },
  });

  return (
    <Show isLoading={query.isLoading}>
      <Stack gap={1}>
        <Typography variant="body1" fontWeight="bold">ID</Typography>
        <TextField value={post?.id} />

        <Typography variant="body1" fontWeight="bold">Title</Typography>
        <TextField value={post?.title} />

        <Typography variant="body1" fontWeight="bold">Category</Typography>
        <TextField value={categoryQuery.data?.data?.title ?? "Loading..."} />

        <Typography variant="body1" fontWeight="bold">Status</Typography>
        <TextField value={post?.status} />

        <Typography variant="body1" fontWeight="bold">Created at</Typography>
        <DateField value={post?.createdAt} />

        <Typography variant="body1" fontWeight="bold">Content</Typography>
        <MarkdownField value={post?.content} />
      </Stack>
    </Show>
  );
};
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