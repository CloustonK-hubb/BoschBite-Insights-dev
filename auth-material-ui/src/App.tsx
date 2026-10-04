import { Refine,type AuthProvider,Authenticated,} from "@refinedev/core";
import {ThemedLayout, ErrorComponent, RefineThemes, useNotificationProvider, RefineSnackbarProvider,AuthPage,} from "@refinedev/mui";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { ThemeProvider } from "@mui/material/styles";
import routerProvider, {NavigateToResource, CatchAllNavigate,UnsavedChangesNotifier,DocumentTitleHandler,} from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet } from "react-router";
import { useFormContext } from "react-hook-form";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import { dataProvider } from "./providers/dataProvider";
import { TransactionList, PostCreate, PostEdit, StudentList,} from "../src/pages/posts";
import { TransactionShow, UserShow } from "./pages/posts/show";

/**
 *  mock auth credentials to simulate authentication
 */
//Auth Provider 
//Setting default credential values 
//Can replace the default values with generalised values from the database once they are created 
const authCredentials = {
  email: "demo@refine.dev",
  password: "demodemo",
};

const App: React.FC = () => {
  const authProvider: AuthProvider = {
    login: async ({ providerName, email }) => {
      //Login through Google option
      if (providerName === "google") {
        window.location.href = "https://accounts.google.com/o/oauth2/v2/auth";
        return {
          success: true,
        };
      }
      //Log in with Github option 
      if (providerName === "github") {
        window.location.href = "https://github.com/login/oauth/authorize";
        return {
          success: true,
        };
      }
      //Log in with Email
      if (email === authCredentials.email) {
        localStorage.setItem("email", email); //Would need to replace localStorage with a real call to your database
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          message: "Login failed",
          name: "Invalid email or password",
        },
      };
    },
    //Option to register 
    register: async (params) => {
      if (params.email === authCredentials.email && params.password) {
        localStorage.setItem("email", params.email);
        return {
          success: true,
          redirectTo: "/",
        };
      }
      return {
        success: false,
        error: {
          message: "Register failed",
          name: "Invalid email or password",
        },
      };
    },
    //Update password option on login page 
    updatePassword: async (params) => {
      if (params.password === authCredentials.password) {
        //we can update password here
        return {
          success: true,
        };
      }
      return {
        success: false,
        error: {
          message: "Update password failed",
          name: "Invalid password",
        },
      };
    },
    //Forgot password option on login page 
    forgotPassword: async (params) => {
      if (params.email === authCredentials.email) {
        //we can send email with reset password link here
        return {
          success: true,
        };
      }
      return {
        success: false,
        error: {
          message: "Forgot password failed",
          name: "Invalid email",
        },
      };
    },
    //logout option: clears storage and redirects to login page 
    logout: async () => {
      localStorage.removeItem("email");
      return {
        success: true,
        redirectTo: "/login",
      };
    },
    //runs when any data request fails and a 401 triggers a logout.
    onError: async (error) => {
      if (error.response?.status === 401) {
        return {
          logout: true,
        };
      }

      return { error };
    },
    //called on navigation to decide whether the user is logged in
    check: async () =>
      localStorage.getItem("email")
        ? {
            authenticated: true,
          }
        : {
            authenticated: false,
            error: {
              message: "Check failed",
              name: "Not authenticated",
            },
            logout: true,
            redirectTo: "/login",
          },
    //Both getPermissions and getIdentity feed role checks and the avatar/name in the header
    //Can replace these values with the columns that hold the required information 
    getPermissions: async () => ["admin"],
    getIdentity: async () => ({
      id: 1,
      name: "Kaitlyn Clouston",
      avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaKEl-u9RPdgXv1JO4sPnJCAo1Kcpvd8KdldReLnujxQ&s=10"
        //"https://unsplash.com/photos/IWLOvomUmWU/download?force=true&w=640",
    }),
  };

  //Optional for the login page 
  //If chosen to remove, delete the rememberMe prop as well 
  const RememeberMe = () => {
    const { register } = useFormContext();

    return (
      <FormControlLabel
        sx={{
          span: {
            fontSize: "12px",
            color: "text.secondary",
          },
        }}
        color="secondary"
        control={
          <Checkbox size="small" id="rememberMe" {...register("rememberMe")} />
        }
        label="Remember me"
      />
    );
  };

//Refine component 
//Here you will edit the pages that appear in the navigation 
//Must add the page content to the routes otherwise will throw an error 
  return (
    <BrowserRouter>
      <ThemeProvider theme={RefineThemes.Blue}>
        <CssBaseline />
        <GlobalStyles styles={{ html: { WebkitFontSmoothing: "auto" } }} />
        <RefineSnackbarProvider>
          <Refine
            authProvider={authProvider}
            dataProvider={dataProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {name: "Transaction", list: "/transaction", show: "/transaction/show/:id",}, //show: "/posts/show/id", edit: "/posts/edit/:id",create: "/posts/create",},
              {name: "Student", list: "/student", show: "/users/show/:id"}
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            <Routes>
              <Route
                element={
                  <Authenticated
                    key="authenticated-routes"
                    fallback={<CatchAllNavigate to="/login" />}
                  >
                    <ThemedLayout>
                      <Outlet />
                    </ThemedLayout>
                  </Authenticated>
                }
              >
                <Route
                  index
                  element={<NavigateToResource resource="posts" />}
                />
       
                {/*<Route path="/posts"> 
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
                <Route path="show/:id" element={<UserShow />} />
              </Route>
          </Route> {/* End of major naivgation. All routes must be out in here to show the same layout*/}

              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="posts" />
                  </Authenticated>
                }
              >
                <Route
                  path="/login"
                  element={
                    <AuthPage
                      type="login"
                      rememberMe={<RememeberMe />}
                      formProps={{
                        defaultValues: {
                          ...authCredentials,
                        },
                      }}
                      providers={[
                        {
                          name: "google",
                          label: "Sign in with Google",
                          icon: (
                            <GoogleIcon
                              style={{
                                fontSize: 24,
                              }}
                            />
                          ),
                        },
                        {
                          name: "github",
                          label: "Sign in with GitHub",
                          icon: (
                            <GitHubIcon
                              style={{
                                fontSize: 24,
                              }}
                            />
                          ),
                        },
                      ]}
                    />
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthPage
                      type="register"
                      providers={[
                        {
                          name: "google",
                          label: "Sign in with Google",
                          icon: (
                            <GoogleIcon
                              style={{
                                fontSize: 24,
                              }}
                            />
                          ),
                        },
                        {
                          name: "github",
                          label: "Sign in with GitHub",
                          icon: (
                            <GitHubIcon
                              style={{
                                fontSize: 24,
                              }}
                            />
                          ),
                        },
                      ]}
                    />
                  }
                />
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
                  <Authenticated key="catch-all">
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
