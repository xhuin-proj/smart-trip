import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="text-sm text-gray-500 border-t mt-10 py-4">
          Place data © OpenStreetMap contributors. Wikipedia and Wikimedia Commons
          content used under their respective licenses.
        </footer>
      </body>
    </html>
  );
}
