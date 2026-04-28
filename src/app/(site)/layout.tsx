import Grain from "@/components/layout/Grain";
import CustomCursor from "@/components/layout/CustomCursor";
import Loader from "@/components/layout/Loader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
    </>
  );
}
