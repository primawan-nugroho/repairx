import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "production_control" | "viewer";
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: "admin" | "production_control" | "viewer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "production_control" | "viewer";
    username: string;
  }
}
