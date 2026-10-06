import type { HttpError } from "@refinedev/core";
import { Edit, useAutocomplete } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm } from "@refinedev/react-hook-form";
import React from "react"

import { Controller } from "react-hook-form";

import type { IPost, ICategory, IStatus, Nullable } from "../../interfaces";

{/*Example of Edit page from template 
  export const PostEdit: React.FC = () => {
  const {
    saveButtonProps,
    refineCore: { query: queryResult },
    register,
    control,
    formState: { errors },
  } = useForm<IPost, HttpError, Nullable<IPost>>();

  const { autocompleteProps } = useAutocomplete<ICategory>({
    resource: "categories",
    defaultValue: queryResult?.data?.data.category.id,
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column" }}
        autoComplete="off"
      >
        <TextField
          {...register("title", {
            required: "This field is required",
          })}
          error={!!errors.title}
          helperText={errors.title?.message}
          margin="normal"
          fullWidth
          label="Title"
          name="title"
          autoFocus
        />
        <Controller
          control={control}
          name="status"
          rules={{ required: "This field is required" }}
          // eslint-disable-next-line
          defaultValue={null as any}
          render={({ field }) => (
            <Autocomplete<IStatus>
              options={["published", "draft", "rejected"]}
              {...field}
              onChange={(_, value) => {
                field.onChange(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Status"
                  margin="normal"
                  variant="outlined"
                  error={!!errors.status}
                  helperText={errors.status?.message}
                  required
                />
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="category"
          rules={{ required: "This field is required" }}
          // eslint-disable-next-line
          defaultValue={null as any}
          render={({ field }) => (
            <Autocomplete
              {...autocompleteProps}
              {...field}
              onChange={(_, value) => {
                field.onChange(value);
              }}
              getOptionLabel={(item) => {
                return (
                  autocompleteProps?.options?.find(
                    (p) => p?.id?.toString() === item?.id?.toString(),
                  )?.title ?? ""
                );
              }}
              isOptionEqualToValue={(option, value) =>
                value === undefined ||
                option?.id?.toString() === (value?.id ?? value)?.toString()
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  margin="normal"
                  variant="outlined"
                  error={!!errors.category}
                  helperText={errors.category?.message}
                  required
                />
              )}
            />
          )}
        />
        <TextField
          {...register("content", {
            required: "This field is required",
          })}
          error={!!errors.content}
          helperText={errors.content?.message}
          margin="normal"
          label="Content"
          multiline
          rows={4}
        />
      </Box>
    </Edit>
  );
};*/}

export const StudentEdit: React.FC = () => {
  const { saveButtonProps, register, formState: { errors },
  } = useForm({
    refineCoreProps: { resource: "Student", meta: { idColumnName: "id_number" },
    },
  });

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      deleteButtonProps={{ meta: { idColumnName: "id_number" } }}
    >
      <Box component="form" sx={{ display: "flex", flexDirection: "column" }} autoComplete="off">
        <TextField
          {...register("first_name", { required: "This field is required" })}
          error={!!errors.first_name} //true or false statement that will turn the boarder red if true. Just visual 
          helperText={errors.first_name?.message as string} //small line of text under the input field. Displays the validation message 
          margin="normal"
          fullWidth
          label="First name"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("last_name", { required: "This field is required" })}
          error={!!errors.last_name}
          helperText={errors.last_name?.message as string}
          margin="normal"
          fullWidth
          label="Last name"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("email")}
          margin="normal"
          fullWidth
          label="Email"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("dob")}
          type="date"
          margin="normal"
          fullWidth
          label="Date of birth"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("gender")}
          margin="normal"
          fullWidth
          label="Gender"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("phone")}
          margin="normal"
          fullWidth
          label="Cell number"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("address")}
          margin="normal"
          fullWidth
          label="Address"
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  );
};
