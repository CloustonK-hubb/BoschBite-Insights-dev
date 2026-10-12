import { useEffect, useState } from "react";
import { Refine,type AuthProvider,Authenticated,} from "@refinedev/core";
import {ThemedLayout, ErrorComponent, RefineThemes, useNotificationProvider, RefineSnackbarProvider,AuthPage,} from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { ThemeProvider } from "@mui/material/styles";
import routerProvider, {NavigateToResource, UnsavedChangesNotifier,DocumentTitleHandler,} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import { dataProvider } from "./providers/dataProvider";
import { ProfileList } from "./pages/Profile/ProfileList";
import { TransactionList, StudentList, VendorList, VendorTypesList} from "../src/pages/posts";
import { TransactionShow, StudentShow, VendorShow, VendorTypeShow } from "./pages/posts/show";
import { StudentEdit } from "./pages/posts/edit";
import StorageIcon from "@mui/icons-material/Storage";
import { DashboardPage } from "./pages/dashboard";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { customTheme } from "./providers/theme";
import { Box, Typography } from "@mui/material";
import { supabaseClient } from "./lib/supabaseClient";
import Register from "./components/Register";
import Pending from "./components/Pending";
import Denied from "./components/Denied";
import CalendarPage from "./pages/calendar";


/* =========================
   ACCESS REDIRECT
   Used when someone is not allowed into the app.
   Sends pending / denied users to their status page
   and everyone else to the login page.
========================= */

const AccessRedirect = () => {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const decide = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        setTarget("/login");
        return;
      }

      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (profile?.status === "pending") {
        setTarget("/pending");
        return;
      }

      if (profile?.status === "denied") {
        setTarget("/denied");
        return;
      }

      setTarget("/login");
    };

    decide();
  }, []);

  return target ? <Navigate to={target} replace /> : null;
};


const App: React.FC = () => {

  /* =========================
     SUPABASE AUTH PROVIDER
  ========================= */

  //Auth Provider 
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

      // The Pending and Denied pages sign the user out themselves
      // once they have arrived, so the redirect is not interrupted.

      if (profile.status === "pending") {
        return {
          success: true,
          redirectTo: "/pending",
        };
      }

      if (profile.status === "denied") {
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

    //Option to register 
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
        redirectTo: "/pending",
      };
    },


    /* FORGOT PASSWORD */

    //Forgot password option on login page 
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

    //Update password option on login page 
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

    //logout option: clears storage and redirects to login page 
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

    //called on navigation to decide whether the user is logged in
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

      // No `logout: true` for pending / denied, otherwise Refine
      // logs the user out and sends them to /login instead.

      if (profile.status === "pending") {
        return {
          authenticated: false,
          error: {
            message: "Your account is awaiting verification.",
            name: "Account pending",
          },
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
          redirectTo: "/denied",
        };
      }

      return {
        authenticated: true,
      };
    },


    /* USER PERMISSIONS */

    //Both getPermissions and getIdentity feed role checks and the avatar/name in the header
    //Can replace these values with the columns that hold the required information 
    getPermissions: async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return null;

      const { data } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      return data?.role ?? null;
    },


    /* USER IDENTITY */

    getIdentity: async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

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

    //runs when any data request fails and a 401 triggers a logout.
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

//Refine component 
//Here you will edit the pages that appear in the navigation 
//Must add the page content to the routes otherwise will throw an error 
  return (
    <BrowserRouter>
      <ThemeProvider theme={customTheme}>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              { name: "dashboard", list: "/", meta: { label: "Business Dashboard", icon: <DashboardIcon /> } },
              //Creating the grouping for the navigation: 
              { name: "BoschCard-data", meta: { label: "BoschCard data", icon: <StorageIcon/>}},
              { name: "BoschBites-data", meta: { label: "BoschBites data", icon: <StorageIcon/>}},
              //Adding the relevant CRUD pages to the first grouping using: meta: {parent: "BoschCard-data"}
              { name: "Transaction", list: "/transaction", show: "/transaction/show/:id", meta: {parent: "BoschCard-data"}},
              { name: "Student", list: "/student", show: "/student/show/:id", edit: "/student/edit/:id", meta: {parent: "BoschCard-data"}},
              { name: "Vendor", list: "/vendor", show: "/vendor/show/:id", meta: {parent: "BoschCard-data"}},
              { name: "Vendor_Type", list: "/vendor_type", show: "/vendor_type/show/:id", meta: {parent: "BoschCard-data"}},
              //Adding the relevant CRUD pages to the second grouping using: meta: { label: "BoschBites data"}
              { name: "Calendar", list: "/calendar", show: "/calendar/show/:id", edit: "/calendar/edit/:id", 
                meta: {label: "Calendar", parent: "BoschBites-data", canDelete: true}},
              { name: "Promo_Window", list: "/promo_window", show: "/promo_window/show/:id", edit: "/promo_window/edit/:id", 
                meta: {label: "Promotion Window", parent: "BoschBites-data", canDelete: true}},
              { name: "kpi_tx_base", list: "/kpi_tx_base", show: "/kpi_tx_base/show/:id", meta: {parent: "BoschBites-data"}},
              { name: "profiles", list: "/profiles", meta: { label: "User Profiles" } },
            ]}
          options={{
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  title: { text: "BoschBite Insights", icon: (
      <image href= "/BoschBites-logo-cropped.png" width= "25" height="25"/> )},
}}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<AccessRedirect />}
                  >
                    {/* Editing the header of the app */}
                    <ThemedLayout Title= {({ collapsed }) => (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <img src= "BoschBites-logo-cropped.png" alt="BoschBites logo" style={{ height: collapsed ? 50 : 63}} />
                        {!collapsed && (
                      <Typography fontWeight={500} fontSize={16} color="#382322">BoschBite Insights</Typography> )}
                      </Box>
                      )}
                      >
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
               <Route index element={<DashboardPage />} />
       
                {/* Example: 
                <Route path="/posts"> 
                  <Route index element={<PostList />} />
                  <Route path="show/:id" element={<PostShow />} />
                  <Route path="create" element={<PostCreate />} />
                  <Route path="edit/:id" element={<PostEdit />} />
                </Route>*/}
               <Route path = "/transaction"> 
                <Route index element={<TransactionList/>}/>
                <Route path="show/:id" element={<TransactionShow />} />
              </Route> 
              
              <Route path="/student">
                <Route index element={<StudentList />} />
                <Route path="show/:id" element={<StudentShow />} />
                <Route path="edit/:id" element={<StudentEdit />} />
              </Route>

              <Route path="/vendor">
                <Route index element={<VendorList />} />
                <Route path="show/:id" element={<VendorShow />}/>
              </Route>

              <Route path="/vendor_type">
                <Route index element={<VendorTypesList />} />
                <Route path="show/:id" element={<VendorTypeShow />} />
              </Route>

              <Route path="/calendar" element={<CalendarPage />} />

              {/* <Route path="/promo_window">
                <Route index element={<PromoWindowList />} />
                <Route path="show/:id" element={<PromoWindowShow />} />
                <Route path="edit/:id" element={<PromoWindowEdit />} />
              </Route>

              <Route path="/kpi_tx_base">
                <Route index element={<KPIList />} />
                <Route path="show/:id" element={<KPIShow />} />
              </Route> */}

              <Route path="/profiles" element={<ProfileList />} />
          </Route> {/* End of major naivgation. All routes must be out in here to show the same layout*/}

              {/* =========================
                  PUBLIC ACCOUNT STATUS PAGES
              ========================= */}

              <Route path="/pending" element={<Pending />} />

              <Route path="/denied" element={<Denied />} />

              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route
                  path="/login"
                  element={
                    <AuthPage type="login"
                      rememberMe={<></>}
                    />
                  }
                />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/forgot-password"
                  element={<AuthPage type="forgotPassword" />}
                />
                <Route
                  path="/update-password"
                  element={<AuthPage type="updatePassword" />}
                />
              </Route>

              <Route
                element={
                  <Authenticated
                    key="catch-all"
                    fallback={<AccessRedirect />}
                  >
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route path="*" element={<ErrorComponent />} />
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