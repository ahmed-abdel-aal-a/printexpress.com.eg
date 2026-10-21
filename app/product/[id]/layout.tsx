export function generateStaticParams() {
  return [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
