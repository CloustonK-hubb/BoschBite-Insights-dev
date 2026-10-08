import {
  Refine,
  type AuthProvider,
  Authenticated,
} from "@refinedev/core";

import {
  ThemedLayout,
  ErrorComponent,
  useNotificationProvider,
  RefineSnackbarProvider,
  AuthPage,
} from "@refinedev/mui";

import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";

import routerProvider, {
  NavigateToResource,
  CatchAllNavigate,
  UnsavedChangesNotifier,
  DocumentTitleHandler,
} from "@refinedev/react-router";

import { BrowserRouter, Routes, Route, Outlet } from "react-router";

import { dataProvider } from "./providers/dataProvider";

import { ProfileList } from "./pages/Profile/ProfileList";

import {
  TransactionList,
  StudentList,
  VendorList,
  VendorTypesList,
} from "./pages/posts";

import {
  TransactionShow,
  StudentShow,
  VendorShow,
  VendorTypeShow,
} from "./pages/posts/show";

import { StudentEdit } from "./pages/posts/edit";

import StorageIcon from "@mui/icons-material/Storage";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { DashboardPage } from "./pages/dashboard";

import { createTheme } from "@mui/material";

import { supabaseClient } from "./lib/supabaseClient";

import Register from "./components/Register";

import Pending from "./components/Pending";
import Denied from "./components/Denied";


/* =========================
   THEME
========================= */

const customTheme = createTheme({
  palette: {
    primary: {
      main: "#2B3F72",
    },
    secondary: {
      main: "#D72C32",
    },
  },
});


/* =========================
   APP
========================= */

const App: React.FC = () => {

  /* =========================
     SUPABASE AUTH PROVIDER
  ========================= */

  const authProvider: AuthProvider = {

    /* LOGIN */

   login: async ({ email, password }) => {

  if (!email || !password) {
    return {
      success: false,
      error: {
        message: "Please enter your email and password.",
        name: "Missing credentials",
      },
    };
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    return {
      success: false,
      error: {
        message: error.message,
        name: "Login failed",
      },
    };
  }

  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .single();

  if (profileError || !profile) {
    await supabaseClient.auth.signOut();

    return {
      success: false,
      error: {
        message: "Your profile could not be found.",
        name: "Profile not found",
      },
    };
  }

  if (profile.status === "pending") {
    return {
      success: true,
      redirectTo: "/pending",
    };
  }

  if (profile.status === "denied") {
  await supabaseClient.auth.signOut();

  return {
    success: true,
    redirectTo: "/denied",
  };
}

  return {
    success: true,
    redirectTo: "/",
  };
},


    /* REGISTER */

    register: async ({
      email,
      password,
      first_name,
      last_name,
    }) => {

      if (!email || !password || !first_name || !last_name) {
        return {
          success: false,
          error: {
            message: "Please complete all required fields.",
            name: "Missing information",
          },
        };
      }

      const { error } =
        await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name,
              last_name,
            },
          },
        });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            name: "Registration failed",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },


    /* FORGOT PASSWORD */

    forgotPassword: async ({ email }) => {

      if (!email) {
        return {
          success: false,
          error: {
            message: "Please enter your email address.",
            name: "Missing email",
          },
        };
      }

      const { error } =
        await supabaseClient.auth.resetPasswordForEmail(
          email,
          {
            redirectTo:
              `${window.location.origin}/update-password`,
          }
        );

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            name: "Password reset failed",
          },
        };
      }

      return {
        success: true,
      };
    },


    /* UPDATE PASSWORD */

    updatePassword: async ({ password }) => {

      if (!password) {
        return {
          success: false,
          error: {
            message: "Please enter a new password.",
            name: "Missing password",
          },
        };
      }

      const { error } =
        await supabaseClient.auth.updateUser({
          password,
        });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            name: "Password update failed",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },


    /* LOGOUT */

    logout: async () => {

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            name: "Logout failed",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    },


    /* CHECK AUTHENTICATION */

    check: async () => {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  if (!session) {
    return {
      authenticated: false,
      error: {
        message: "You are not authenticated.",
        name: "Not authenticated",
      },
      logout: true,
      redirectTo: "/login",
    };
  }

  const { data: profile, error } = await supabaseClient
    .from("profiles")
    .select("status")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    await supabaseClient.auth.signOut();

    return {
      authenticated: false,
      error: {
        message: "Your profile could not be found.",
        name: "Profile not found",
      },
      logout: true,
      redirectTo: "/login",
    };
  }

  if (profile.status === "pending") {
    return {
      authenticated: false,
      error: {
        message: "Your account is awaiting verification.",
        name: "Account pending",
      },
      logout: true,
      redirectTo: "/pending",
    };
  }

  if (profile.status === "denied") {
    return {
      authenticated: false,
      error: {
        message: "Your account access has been denied.",
        name: "Account denied",
      },
      logout: true,
      redirectTo: "/denied",
    };
  }

  return {
    authenticated: true,
  };
},


    /* USER PERMISSIONS */

    getPermissions: async () => {

      // TEMPORARY
      // We will connect this to the profiles/roles
      // table once the basic authentication works.

      return ["admin"];
    },


    /* USER IDENTITY */

    getIdentity: async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data: p } = await supabaseClient
    .from("profiles")
    .select("first_name, last_name, role, vendor_id")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: p ? `${p.first_name} ${p.last_name}` : user.email,
    email: user.email,
    role: p?.role ?? null,
    vendor_id: p?.vendor_id ?? null,
  };
},


    /* HANDLE AUTH ERRORS */

    onError: async (error) => {

      if (error.response?.status === 401) {
        return {
          logout: true,
        };
      }

      return {
        error,
      };
    },
  };


  /* =========================
     APPLICATION
  ========================= */

  return (
    <BrowserRouter>

      <ThemeProvider theme={customTheme}>

        <CssBaseline />

        <GlobalStyles
          styles={{
            html: {
              WebkitFontSmoothing: "auto",
            },
          }}
        />

        <RefineSnackbarProvider>

          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}

            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: {
                  label: "Business Dashboard",
                  icon: <DashboardIcon />,
                },
              },

              {
                name: "data-management",
                meta: {
                  label: "Data Management",
                  icon: <StorageIcon />,
                },
              },

              {
                name: "Transaction",
                list: "/transaction",
                show: "/transaction/show/:id",
                meta: {
                  parent: "data-management",
                },
              },

              {
                name: "Student",
                list: "/student",
                show: "/student/show/:id",
                edit: "student/edit/:id",
                meta: {
                  parent: "data-management",
                },
              },

              {
                name: "Vendor",
                list: "/vendor",
                show: "/vendor/show/:id",
                meta: {
                  parent: "data-management",
                },
              },

              {
                name: "profiles",
                list: "/profiles",
                meta: {
                  label: "User Profiles",
                },
              },

              {
                name: "Vendor_Type",
                list: "/vendor_type",
                show: "/vendor_type/show/:id",
                meta: {
                  parent: "data-management",
                },
              },
            ]}

            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              title: {
                text: "BoschBite Insights",
              },
            }}
          >

            <Routes>

              {/* =========================
                  PROTECTED APPLICATION
              ========================= */}

              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={
                      <CatchAllNavigate to="/login" />
                    }
                  >
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >

                <Route
                  index
                  element={<DashboardPage />}
                />

                {/* TRANSACTIONS */}

                <Route path="/transaction">

                  <Route
                    index
                    element={<TransactionList />}
                  />

                  <Route
                    path="show/:id"
                    element={<TransactionShow />}
                  />

                </Route>


                {/* STUDENTS */}

                <Route path="/student">

                  <Route
                    index
                    element={<StudentList />}
                  />

                  <Route
                    path="show/:id"
                    element={<StudentShow />}
                  />

                  <Route
                    path="edit/:id"
                    element={<StudentEdit />}
                  />

                </Route>


                {/* VENDORS */}

                <Route path="/vendor">

                  <Route
                    index
                    element={<VendorList />}
                  />

                  <Route
                    path="show/:id"
                    element={<VendorShow />}
                  />

                </Route>


                {/* VENDOR TYPES */}

                <Route path="/vendor_type">

                  <Route
                    index
                    element={<VendorTypesList />}
                  />

                  <Route
                    path="show/:id"
                    element={<VendorTypeShow />}
                  />

                </Route>
                
                <Route path="/profiles" element={<ProfileList />} />

              </Route>

              {/* =========================
    PUBLIC ACCOUNT STATUS PAGES
========================= */}

<Route path="/pending" element={<Pending />} />

<Route path="/denied" element={<Denied />} /> 


              {/* =========================
                  AUTHENTICATION PAGES
              ========================= */}

              <Route
                element={
                  <Authenticated
                    key="auth-pages"
                    fallback={<Outlet />}
                  >
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >

                {/* LOGIN */}

                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      rememberMe={<></>}
                    />
                  }
                />


                {/* REGISTER */}

                <Route path="/register" element={<Register />} />


                {/* FORGOT PASSWORD */}

                <Route
                  path="/forgot-password"
                  element={
                    <AuthPage
                      type="forgotPassword"
                    />
                  }
                />


                {/* UPDATE PASSWORD */}

                <Route
                  path="/update-password"
                  element={
                    <AuthPage
                      type="updatePassword"
                    />
                  }
                />

              </Route>


              {/* =========================
                  CATCH ALL
              ========================= */}

              <Route
                element={
                  <Authenticated key="catch-all">
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >

                <Route
                  path="*"
                  element={<ErrorComponent />}
                />

              </Route>

            </Routes>

            <UnsavedChangesNotifier />

            <DocumentTitleHandler />

          </Refine>

        </RefineSnackbarProvider>

      </ThemeProvider>

    </BrowserRouter>
  );
};

export default App;