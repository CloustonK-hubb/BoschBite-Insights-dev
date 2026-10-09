import type { HttpError } from "@refinedev/core";
import { DateField, Edit, NumberField, useAutocomplete } from "@refinedev/mui";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm } from "@refinedev/react-hook-form";
import React from "react"
import { Controller } from "react-hook-form";
import type { IPost, ICategory, IStatus, Nullable } from "../../interfaces";
import { MenuItem } from "@mui/material";

{/* Example of an Edit object fro the Student Table 
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
*/}

//Edit object for the Calendar
const periodTypes = ["Lecture", "Exam", "Recess", "Social Event"]
export const CalendarEdit: React.FC = () => {
  const { saveButtonProps, register, control, formState: { errors },
  } = useForm({
    refineCoreProps: { resource: "Calendar", meta: { idColumnName: "period_id" },
    },
  });

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      deleteButtonProps={{ meta: { idColumnName: "period_id" } }}
    >
      <Box component="form" sx={{ display: "flex", flexDirection: "column" }} autoComplete="off">
        <TextField
          {...register("start_date", { required: "This field is required" })}
          type= "date"
          error={!!errors.start_date} //true or false statement that will turn the boarder red if true. Just visual 
          helperText={errors.start_date?.message as string} //small line of text under the input field. Displays the validation message 
          margin="normal"
          fullWidth
          label="Start date"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("end_date", { required: "This field is required" })}
          type ="date"
          error={!!errors.end_date}
          helperText={errors.end_date?.message as string}
          margin="normal"
          fullWidth
          label="End date"
          InputLabelProps={{ shrink: true }}
        />
        <Controller
          control={control}
          name="period_type"
          defaultValue=""
          rules={{ required: "Please choose a period category" }}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              select
              margin="normal"
              fullWidth
              label="Period Category"
              InputLabelProps={{ shrink: true }}
              error={!!errors.period_type}
              helperText={errors.period_type?.message as string}
            >
              {periodTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <TextField
          {...register("function")}
          margin="normal"
          fullWidth
          label="Function name"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("year")}
          type="number"
          margin="normal"
          fullWidth
          label="Year"
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  );
};


//Edit object for the Promo_Window table
export const PromoWindowEdit: React.FC = () => {
  const { saveButtonProps, register, formState: { errors },
  } = useForm({
    refineCoreProps: { resource: "Promo_Window", meta: { idColumnName: "promo_id" },
    },
  });

  return (
    <Edit
      saveButtonProps={saveButtonProps}
      deleteButtonProps={{ meta: { idColumnName: "promo_id" } }}
    >
      <Box component="form" sx={{ display: "flex", flexDirection: "column" }} autoComplete="off">
        <TextField
          {...register("vendor_id", { required: "This field is required" })}
          error={!!errors.vendor_id} //true or false statement that will turn the boarder red if true. Just visual 
          helperText={errors.vendor_id?.message as string} //small line of text under the input field. Displays the validation message 
          margin="normal"
          fullWidth
          label="Vendor ID"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("promo_number", { required: "This field is required" })}
          error={!!errors.promo_number}
          helperText={errors.promo_number?.message as string}
          margin="normal"
          fullWidth
          label="Promo number"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("start_date", {required: "This field is required"})}
          error={!!errors.start_date}
          helperText={errors.start_date?.message as string}
          type="date"
          margin="normal"
          fullWidth
          label="Start date"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("end_date", { required: "This field is required"})}
          error={!!errors.end_date}
          helperText={errors.end_date?.message as string}
          type="date"
          margin="normal"
          fullWidth
          label="End date"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          {...register("duration_days")}
          type="number"
          margin="normal"
          fullWidth
          label="Duration (in days)"
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Edit>
  );
};