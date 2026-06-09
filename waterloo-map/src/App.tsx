import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Map from "./components/Map";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* The rest of your application */}
      <ReactQueryDevtools initialIsOpen={false} />
      <Map></Map>
    </QueryClientProvider>
  );
}

export default App;
