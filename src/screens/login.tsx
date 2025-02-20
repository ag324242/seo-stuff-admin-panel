import dynamic from "next/dynamic";

// Dynamically import the AdminLogin component with SSR disabled
const AdminLogin = dynamic(() => import("../components/AdminLogin"), { ssr: false });

export default function LoginPage() {
  return <AdminLogin />;
}