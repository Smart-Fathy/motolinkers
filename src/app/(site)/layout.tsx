import Grain from "@/components/layout/Grain";
import CustomCursor from "@/components/layout/CustomCursor";
import Loader from "@/components/layout/Loader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageEventBeacon from "@/components/analytics/PageEventBeacon";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Grain />
      <CustomCursor />
      <Loader />
      <Navbar />
      {children}
      <Footer />
      {/* Records a page_events row on every public page navigation.
          The vehicle detail page mounts its own beacon with a slug
          prop so we can group views by vehicle. */}
      <PageEventBeacon />
    </>
  );
}
