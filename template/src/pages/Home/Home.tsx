import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Welcome!</title>
      </Head>
      <Link href="/login" passHref>
        <a>Log in</a>
      </Link>
    </>
  );
}
