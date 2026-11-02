//This file was created to help with the cache issue being exprienced with the app
//Overall, the attempt is to clear the stored data whenever someone new logs in or out so that the page has nothng saved from the previous user and the browser does not need to be manually refreshed 
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();