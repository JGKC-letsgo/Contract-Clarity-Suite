import { useParams } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import NewContract from "@/pages/new-contract";
import ContractView from "@/pages/contract-view";
import ContractVersions from "@/pages/contract-versions";
import ContractComments from "@/pages/contract-comments";
import Templates from "@/pages/templates";
import SharedContract from "@/pages/shared-contract";

function ContractViewRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractView id={parseInt(params.id)} />;
}

function ContractVersionsRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractVersions id={parseInt(params.id)} />;
}

function ContractCommentsRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractComments id={parseInt(params.id)} />;
}

function SharedContractRoute() {
  const params = useParams();
  if (!params.token) return null;
  return <SharedContract token={params.token} />;
}

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/contracts/new" component={NewContract} />
        <Route path="/templates" component={Templates} />
        <Route path="/shared/:token" component={SharedContractRoute} />
        <Route path="/contracts/:id/versions" component={ContractVersionsRoute} />
        <Route path="/contracts/:id/comments" component={ContractCommentsRoute} />
        <Route path="/contracts/:id" component={ContractViewRoute} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
