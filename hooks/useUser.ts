// ./hooks/useUser.ts

import { PermitUser } from "@/types/user";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

/**
 * Custom hook to fetch and manage user data from the Permit.io API.
 *
 * This hook combines Permit.io user data with NextAuth user data, returning a unified
 * user object containing Permit.io attributes alongside NextAuth session properties.
 *
 * @returns An object containing the combined user data or `null` if not available.
 */
const useUser = () => {
  // Extract the user data from the NextAuth session.
  const sessionUser = useSession().data?.user;

  // State to hold the combined user data.
  const [user, setUser] = useState<(PermitUser & Partial<User>) | null>(null);

  useEffect(() => {
    // Fetch user details from the Permit.io API and combine with NextAuth session data.
    const getPermitUser = async () => {
      try {
        // Make a request to the API endpoint to fetch Permit.io user data.
        const res = await fetch("/api/permit/getUser");

        // Parse the API response and cast it to the PermitUser type.
        const user = (await res.json()).user as PermitUser;

        // Merge Permit.io user data with session data (e.g., image and name from NextAuth).
        setUser({
          ...user,
          image: sessionUser?.image,
          name: sessionUser?.name,
        });
      } catch (error) {
        // Handle errors gracefully and reset the user state to `null`.
        console.error("Error fetching Permit.io user data:", error);
        setUser(null);
      }
    };

    // Fetch user data only when sessionUser is available.
    getPermitUser();
  }, [sessionUser]);

  return { user };
};

export default useUser;
